import { getSettings } from '@/lib/content';
import { requirePage } from '@/lib/permissions';
import { SettingsEditor } from './SettingsEditor';

export default async function SettingsPage() {
  await requirePage('settings');
  const settings = await getSettings();
  return <SettingsEditor initial={settings as unknown as Record<string, unknown>} />;
}
