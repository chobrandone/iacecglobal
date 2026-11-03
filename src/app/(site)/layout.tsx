import { getSettings } from '@/lib/content';
import { Footer, WhatsAppButton } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { JsonLd } from '@/components/site/JsonLd';
import { RevealObserver } from '@/components/site/RevealObserver';
import { organisationJsonLd } from '@/lib/seo';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <JsonLd data={organisationJsonLd(s)} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Header
        settings={{
          siteName: s.siteName,
          tagline: s.tagline,
          logo: s.logo,
          email: s.email,
          phones: s.phones,
          city: s.city,
          country: s.country,
          nav: s.nav,
          getInvolvedLabel: s.getInvolvedLabel,
          getInvolved: s.getInvolved,
          mobileNav: s.mobileNav,
          mobileGetInvolvedHeading: s.mobileGetInvolvedHeading,
          contactButton: s.contactButton,
          donateButton: s.donateButton,
          mobileContactButton: s.mobileContactButton,
          announcementEnabled: s.announcementEnabled,
          announcementText: s.announcementText,
          announcementLink: s.announcementLink,
        }}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer settings={s} />
      <WhatsAppButton number={s.whatsappNumber} label={s.whatsappLabel} />
      <RevealObserver />
    </div>
  );
}
