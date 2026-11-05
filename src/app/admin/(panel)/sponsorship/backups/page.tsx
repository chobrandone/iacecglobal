import { prisma } from '@/lib/db';
import { authMode } from '@/lib/drive/client';
import { requirePage } from '@/lib/permissions';
import { formatDateTime } from '@/lib/sponsorship/format';
import { BackupActions } from '@/components/sponsorship/BackupActions';
import { QuickForm } from '@/components/sponsorship/QuickForm';
import { Badge, Card, PageTitle } from '@/components/admin/ui';
import { saveBackupSettings } from '../_actions';

const notices: Record<string, string> = {
  connected: 'Google Drive is connected.',
  denied: 'Google access was not granted, so nothing changed.',
  failed: 'Google did not return a lasting connection. Please try again.',
  missing: 'GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET need to be set on the host first.',
};

export default async function BackupsPage({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  await requirePage('sponsorship-admin');
  const { google } = await searchParams;
  const [settings, runs, waiting] = await Promise.all([
    prisma.sponsorshipSettings.findUnique({ where: { id: 1 } }),
    prisma.backupRun.findMany({ orderBy: { startedAt: 'desc' }, take: 30 }),
    prisma.job.count({ where: { status: { in: ['PENDING', 'RUNNING'] } } }),
  ]);
  const mode = authMode();
  const connected = mode === 'oauth' ? !!settings?.googleRefreshToken : !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  return (
    <>
      <PageTitle title="Backups" description="Only Administrators can see this page. Never share the Drive folder publicly or with “anyone with the link”." />
      {google && notices[google] && <p className="mb-4 rounded-lg bg-gold-tint px-4 py-2 text-sm text-gold-deep">{notices[google]}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-base text-navy">Google Drive</h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-ink/70">
            <Badge tone={connected ? 'green' : 'red'}>{connected ? 'Connected' : 'Not connected'}</Badge>
            {mode === 'oauth' ? 'Personal Google account' : 'Shared Drive and service account'}
          </p>
          <p className="mt-2 text-sm text-ink/60">{waiting} waiting to upload.</p>
          <div className="mt-4">
            <BackupActions connected={connected} canConnect={mode === 'oauth'} />
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 text-base text-navy">Settings</h2>
          <QuickForm
            keep
            submitLabel="Save backup settings"
            fields={[
              { name: 'keepDailyBackups', label: 'Daily backups to keep', type: 'number', required: true },
              { name: 'encryptBackups', label: 'Encrypt database backups', type: 'select', required: true, options: [{ value: 'yes', label: 'Yes (recommended)' }, { value: 'no', label: 'No: sensitive columns are left out of Excel' }] },
              ...(mode === 'service_account' ? [{ name: 'driveFolderId', label: 'Shared Drive folder ID', wide: true }] : []),
            ]}
            initial={{ keepDailyBackups: String(settings?.keepDailyBackups ?? 30), encryptBackups: settings?.encryptBackups === false ? 'no' : 'yes', driveFolderId: settings?.driveFolderId ?? '' }}
            action={saveBackupSettings}
          />
        </Card>
      </div>
      <h2 className="mb-3 mt-8 text-base text-navy">Recent runs</h2>
      <div className="overflow-x-auto rounded-xl border border-navy/[0.09] bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-navy/10 bg-mist/60 font-heading text-[0.72rem] text-navy">
            <tr>
              {['Started', 'Type', 'Status', 'Files', 'Size', 'Error'].map((h) => (
                <th key={h} className="px-3 py-2.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/[0.06]">
            {runs.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap px-3 py-2.5">{formatDateTime(r.startedAt)}</td>
                <td className="px-3 py-2.5">{r.type.toLowerCase()}</td>
                <td className="px-3 py-2.5">
                  <Badge tone={r.status === 'SUCCESS' ? 'green' : r.status === 'FAILED' ? 'red' : 'gold'}>{r.status.toLowerCase()}</Badge>
                </td>
                <td className="px-3 py-2.5">{r.filesUploaded}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{(Number(r.bytes) / 1_048_576).toFixed(1)} MB</td>
                <td className="px-3 py-2.5 text-ink/60">{r.error}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {runs.length === 0 && <p className="p-6 text-center text-sm text-ink/50">No backups have run yet.</p>}
      </div>
    </>
  );
}
