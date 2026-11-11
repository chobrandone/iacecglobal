import { Readable } from 'node:stream';
import { google, type drive_v3 } from 'googleapis';
import { prisma } from '@/lib/db';
import { decryptOptional } from '@/lib/sponsorship/encryption';

export const ROOT_NAME = 'IACEC Child Sponsorship';
export const DRIVE_SCOPE_OAUTH = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_SCOPE_SERVICE = 'https://www.googleapis.com/auth/drive';
const FOLDER = 'application/vnd.google-apps.folder';

export type DriveFile = { id: string; name: string };

/** Everything the backups need from Drive. Tests supply an in-memory version. No method ever shares a file. */
export type DriveApi = {
  ensureFolder(name: string, parentId: string | null): Promise<string>;
  rename(id: string, name: string): Promise<void>;
  upload(file: { name: string; parentId: string; mimeType: string; body: Buffer; replaceId?: string }): Promise<string>;
  list(parentId: string): Promise<DriveFile[]>;
  download(id: string): Promise<Buffer>;
  remove(id: string): Promise<void>;
};

export const authMode = () => (process.env.GOOGLE_AUTH_MODE === 'service_account' ? 'service_account' : 'oauth');

/** The public address. Behind the host's proxy a request's own URL is an internal one such as 0.0.0.0:3000. */
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://iacecglobal.com').replace(/\/$/, '');

export const oauthClient = () => new google.auth.OAuth2(process.env.GOOGLE_OAUTH_CLIENT_ID, process.env.GOOGLE_OAUTH_CLIENT_SECRET, `${siteUrl()}/api/google/oauth`);

const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

function wrap(drive: drive_v3.Drive): DriveApi {
  const all = { supportsAllDrives: true };
  const list = async (query: string) => {
    const files: DriveFile[] = [];
    let pageToken: string | undefined;
    do {
      const res = await drive.files.list({ q: `${query} and trashed = false`, fields: 'nextPageToken, files(id, name)', pageSize: 1000, pageToken, includeItemsFromAllDrives: true, ...all });
      for (const f of res.data.files ?? []) files.push({ id: f.id!, name: f.name! });
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);
    return files;
  };
  return {
    async ensureFolder(name, parentId) {
      const parent = parentId ? ` and '${parentId}' in parents` : '';
      const [found] = await list(`name = '${escape(name)}' and mimeType = '${FOLDER}'${parent}`);
      if (found) return found.id;
      const res = await drive.files.create({ requestBody: { name, mimeType: FOLDER, parents: parentId ? [parentId] : undefined }, fields: 'id', ...all });
      return res.data.id!;
    },
    async rename(id, name) {
      await drive.files.update({ fileId: id, requestBody: { name }, ...all });
    },
    async upload({ name, parentId, mimeType, body, replaceId }) {
      const media = { mimeType, body: Readable.from(body) };
      if (replaceId) {
        await drive.files.update({ fileId: replaceId, requestBody: { name }, media, ...all });
        return replaceId;
      }
      const res = await drive.files.create({ requestBody: { name, parents: [parentId] }, media, fields: 'id', ...all });
      return res.data.id!;
    },
    list: (parentId) => list(`'${parentId}' in parents`),
    async download(id) {
      const res = await drive.files.get({ fileId: id, alt: 'media', ...all }, { responseType: 'arraybuffer' });
      return Buffer.from(res.data as ArrayBuffer);
    },
    async remove(id) {
      await drive.files.delete({ fileId: id, ...all });
    },
  };
}

/** The connected Drive, or null if backups are not set up yet. */
export async function connectDrive(): Promise<DriveApi | null> {
  if (authMode() === 'service_account') {
    const encoded = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!encoded) return null;
    const auth = new google.auth.GoogleAuth({ credentials: JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')), scopes: [DRIVE_SCOPE_SERVICE] });
    return wrap(google.drive({ version: 'v3', auth }));
  }
  const settings = await prisma.sponsorshipSettings.findUnique({ where: { id: 1 } });
  const refreshToken = decryptOptional(settings?.googleRefreshToken);
  if (!refreshToken || !process.env.GOOGLE_OAUTH_CLIENT_ID) return null;
  const auth = oauthClient();
  auth.setCredentials({ refresh_token: refreshToken });
  return wrap(google.drive({ version: 'v3', auth }));
}
