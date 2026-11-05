import type { Metadata } from 'next';
import { getSettings } from '@/lib/content';
import { prisma } from '@/lib/db';
import { pageMetadata } from '@/lib/seo';
import type { FieldOverrides } from '@/lib/sponsorship/fields';
import { Wizard } from '@/components/sponsorship/Wizard';
import { PageHero } from '@/sections/common';

export const dynamic = 'force-dynamic';

const TITLE = 'Child Sponsorship Registration';
const SUMMARY = 'Register a child for the programme. You can stop at any time and come back on the same phone.';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getSettings(), { title: TITLE, description: SUMMARY, path: '/community-support/register' });
}

export default async function RegisterPage() {
  const settings = await prisma.sponsorshipSettings.findUnique({ where: { id: 1 } });
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Douala' }).format(new Date());
  return (
    <>
      <PageHero
        c={{ variant: 'banner', breadcrumb: 'Registration', eyebrow: 'Apply for support', heading: TITLE, body: SUMMARY, image: { src: '', alt: '' } }}
        bg="navy"
        ctx={{}}
      />
      <section className="bg-mist py-10 sm:py-14">
        <div className="container-page max-w-3xl">
          <Wizard programmeName={settings?.programmeName ?? 'Child Sponsorship Programme'} overrides={(settings?.fieldOverrides ?? {}) as FieldOverrides} today={today} />
        </div>
      </section>
    </>
  );
}
