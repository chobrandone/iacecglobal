import { can, requirePage } from '@/lib/permissions';
import { SponsorshipNav } from '@/components/sponsorship/SponsorshipNav';

export default async function SponsorshipLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePage('sponsorship');
  return (
    <>
      <SponsorshipNav settings={can(user.role, 'sponsorship-admin')} />
      {children}
    </>
  );
}
