import type { Metadata, Viewport } from 'next';
import { Montserrat, Source_Sans_3 } from 'next/font/google';
import { getSettings } from '@/lib/content';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-source-sans',
  display: 'swap',
});

export const viewport: Viewport = { themeColor: '#022667' };

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || s.siteUrl || 'https://iacecglobal.com';
  return {
    metadataBase: new URL(siteUrl),
    title: { default: s.defaultTitle, template: `%s${s.titleSuffix}` },
    description: s.defaultDescription,
    applicationName: s.organisationName,
    icons: { icon: s.favicon?.src || '/favicon.svg' },
    openGraph: {
      type: 'website',
      siteName: s.organisationName,
      title: s.defaultTitle,
      description: s.defaultDescription,
      url: siteUrl,
      images: s.ogImage?.src ? [{ url: s.ogImage.src }] : undefined,
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${sourceSans.variable}`}>
      <body>
        <noscript>
          <style>{'.reveal{opacity:1!important;transform:none!important}'}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
