import { prisma } from '@/lib/db';
import { profilePdf, visitLogPdf } from '@/lib/sponsorship/pdf/reports';
import { readPrivate } from '@/lib/sponsorship/storage';
import { ROOT_NAME, type DriveApi } from './client';

/** The backup folder: chosen by the administrator, or created by the app the first time. */
export async function rootFolder(drive: DriveApi) {
  const settings = await prisma.sponsorshipSettings.findUnique({ where: { id: 1 } });
  const existing = settings?.driveFolderId || process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID;
  if (existing) return existing;
  const id = await drive.ensureFolder(ROOT_NAME, null);
  await prisma.sponsorshipSettings.update({ where: { id: 1 }, data: { driveFolderId: id } });
  return id;
}

async function record(entity: string, entityId: string) {
  return prisma.driveSync.findUnique({ where: { entity_entityId: { entity, entityId } } });
}

async function remember(entity: string, entityId: string, driveFileId: string, checksum: string) {
  await prisma.driveSync.upsert({
    where: { entity_entityId: { entity, entityId } },
    create: { entity, entityId, driveFileId, checksum },
    update: { driveFileId, checksum, syncedAt: new Date() },
  });
}

/** Sends one child's folder to Drive. Only new or changed files are uploaded. Returns files sent and bytes. */
export async function syncApplication(drive: DriveApi, id: string) {
  const application = await prisma.childApplication.findUnique({ where: { id }, include: { child: true, documents: true } });
  if (!application?.child) return { files: 0, bytes: 0 };

  const root = await rootFolder(drive);
  const applications = await drive.ensureFolder('Applications', root);
  const folderName = `${application.reference} - ${application.child.fullName}`.replace(/[/\\]/g, '-');

  const known = await record('application-folder', id);
  const folder = known?.driveFileId ?? (await drive.ensureFolder(folderName, applications));
  if (known && known.checksum !== folderName) await drive.rename(folder, folderName);
  await remember('application-folder', id, folder, folderName);

  const [documents, visits, fees] = await Promise.all([drive.ensureFolder('Documents', folder), drive.ensureFolder('Visits', folder), drive.ensureFolder('Fees', folder)]);

  let files = 0;
  let bytes = 0;
  const version = application.updatedAt.toISOString();

  async function send(entity: string, name: string, parentId: string, mimeType: string, body: Buffer | Uint8Array) {
    const previous = await record(entity, id);
    const fileId = await drive.upload({ name, parentId, mimeType, body: Buffer.from(body), replaceId: previous?.driveFileId });
    await remember(entity, id, fileId, version);
    files += 1;
    bytes += body.length;
  }

  if ((await record('application-pdf', id))?.checksum !== version) {
    const pdf = await profilePdf(id);
    if (pdf) await send('application-pdf', 'Application.pdf', folder, 'application/pdf', pdf.bytes);
    const log = await visitLogPdf(id);
    if (log) await send('visit-log-pdf', 'Visit log.pdf', visits, 'application/pdf', log);
  }

  for (const doc of application.documents) {
    const previous = await record('document', doc.id);
    if (previous?.checksum === doc.storageKey) continue;
    const parentId = doc.type === 'VISIT_PHOTO' ? visits : doc.type === 'FEES_RECEIPT' ? fees : documents;
    const body = await readPrivate(doc.storageKey);
    const fileId = await drive.upload({ name: `${doc.type.toLowerCase()} - ${doc.filename}`, parentId, mimeType: doc.mimeType, body, replaceId: previous?.driveFileId });
    await remember('document', doc.id, fileId, doc.storageKey);
    files += 1;
    bytes += body.length;
  }
  return { files, bytes };
}

/** Everything not yet copied, stopping at the deadline. The next run carries on from there. */
export async function syncOutstanding(drive: DriveApi, deadline: number) {
  const applications = await prisma.childApplication.findMany({ select: { id: true, updatedAt: true } });
  const synced = await prisma.driveSync.findMany({ where: { entity: 'application-pdf' }, select: { entityId: true, checksum: true } });
  const versions = new Map(synced.map((s) => [s.entityId, s.checksum]));
  const unsynced = await prisma.applicationDocument.findMany({ select: { id: true, storageKey: true, applicationId: true } });
  const docs = new Map((await prisma.driveSync.findMany({ where: { entity: 'document' }, select: { entityId: true, checksum: true } })).map((s) => [s.entityId, s.checksum]));
  const outstanding = new Set([
    ...applications.filter((a) => versions.get(a.id) !== a.updatedAt.toISOString()).map((a) => a.id),
    ...unsynced.filter((d) => docs.get(d.id) !== d.storageKey).map((d) => d.applicationId),
  ]);

  let files = 0;
  let bytes = 0;
  let failed = 0;
  for (const id of outstanding) {
    if (Date.now() > deadline) break;
    // One unreadable file must not stop everyone else, or the database backup, from being saved.
    try {
      const sent = await syncApplication(drive, id);
      files += sent.files;
      bytes += sent.bytes;
    } catch {
      failed += 1;
    }
  }
  return { files, bytes, failed };
}

/** Removes a child's Drive folder and every record of its files. */
export async function deleteApplicationFolder(drive: DriveApi | null, id: string, documentIds: string[]) {
  const folder = await record('application-folder', id);
  if (folder && drive) await drive.remove(folder.driveFileId);
  await prisma.driveSync.deleteMany({ where: { OR: [{ entityId: id }, { entity: 'document', entityId: { in: documentIds } }] } });
  return folder && !drive ? folder.driveFileId : null;
}
