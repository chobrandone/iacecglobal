import { f, objectSchema, type Field, type ImageValue, type LinkValue } from './fields';

/** Editable site-wide settings. Client-safe (no server imports). */
export const settingsFields: { title: string; fields: Field[] }[] = [
  {
    title: 'Identity',
    fields: [
      f.text('siteName', 'Wordmark', { help: 'Shown next to the logo, e.g. IACEC' }),
      f.text('organisationName', 'Full organisation name'),
      f.text('tagline', 'Tagline under the wordmark'),
      f.image('logo', 'Logo (header)', { help: 'Leave empty to use the built-in IACEC emblem.' }),
      f.image('logoFooter', 'Logo (footer, light version)', { help: 'Leave empty to use the built-in emblem.' }),
      f.image('favicon', 'Favicon', { help: 'Square PNG or SVG. Leave empty for the default.' }),
    ],
  },
  {
    title: 'Contact details',
    fields: [
      f.text('email', 'Public email address'),
      f.list('phones', 'Phone numbers', [f.text('number', 'Number')], 'Phone'),
      f.text('addressLine', 'Street address (optional)'),
      f.text('city', 'City'),
      f.text('country', 'Country'),
      f.text('mapUrl', 'Map link (opens Google Maps)'),
      f.text('mapEmbedUrl', 'Map embed URL (optional)', { help: 'If set, an embedded map is shown on the contact page.' }),
      f.text('whatsappNumber', 'WhatsApp number', { help: 'International format, e.g. +237 6 77 72 16 78' }),
      f.text('whatsappLabel', 'WhatsApp button label'),
      f.text('websiteLabel', 'Website label in footer'),
    ],
  },
  {
    title: 'Social links',
    fields: [
      f.text('facebookUrl', 'Facebook URL'),
      f.text('instagramUrl', 'Instagram URL'),
      f.text('youtubeUrl', 'YouTube URL'),
      f.text('linkedinUrl', 'LinkedIn URL'),
    ],
  },
  {
    title: 'Header & navigation',
    fields: [
      f.list('nav', 'Main navigation (desktop)', [f.text('label', 'Label'), f.text('href', 'Link')], 'Link'),
      f.text('getInvolvedLabel', '"Get Involved" menu label'),
      f.list('getInvolved', 'Get Involved menu items', [f.text('label', 'Label'), f.text('href', 'Link')], 'Link'),
      f.list('mobileNav', 'Mobile menu links', [f.text('label', 'Label'), f.text('href', 'Link')], 'Link'),
      f.text('mobileGetInvolvedHeading', 'Mobile menu "Get involved" heading'),
      f.link('contactButton', 'Header contact button'),
      f.link('donateButton', 'Donate button'),
      f.link('mobileContactButton', 'Mobile menu contact button'),
    ],
  },
  {
    title: 'Footer',
    fields: [
      f.textarea('footerDescription', 'Footer description', 3),
      f.list(
        'footerColumns',
        'Footer link columns',
        [f.text('title', 'Column heading'), f.list('links', 'Links', [f.text('label', 'Label'), f.text('href', 'Link')], 'Link')],
        'Column',
      ),
      f.text('newsletterHeading', 'Newsletter heading'),
      f.textarea('newsletterText', 'Newsletter text', 2),
      f.text('newsletterPlaceholder', 'Newsletter placeholder'),
      f.text('newsletterSuccess', 'Newsletter success message'),
      f.text('copyrightName', 'Copyright holder'),
      f.list('legalLinks', 'Bottom links', [f.text('label', 'Label'), f.text('href', 'Link')], 'Link'),
    ],
  },
  {
    title: 'Giving methods',
    fields: [
      f.textarea('givingNote', 'Giving note (optional)', 3, { help: 'Highlighted note above the giving methods.' }),
      f.textarea('bankDetails', 'Bank transfer details', 4),
      f.textarea('mobileMoneyDetails', 'Mobile Money (MTN / Orange) details', 4),
      f.textarea('internationalDetails', 'International giving details', 4),
    ],
  },
  {
    title: 'SEO & sharing',
    fields: [
      f.text('siteUrl', 'Canonical site URL'),
      f.text('defaultTitle', 'Default page title'),
      f.text('titleSuffix', 'Title suffix', { help: 'Appended to page titles, e.g. " — IACEC"' }),
      f.textarea('defaultDescription', 'Default meta description', 3),
      f.textarea('defaultKeywords', 'Default keywords', 2, { help: 'Separated by commas. Used on pages with no keywords of their own.' }),
      f.image('ogImage', 'Default social sharing image'),
      f.text('googleSiteVerification', 'Google Search Console verification code', {
        help: 'Paste only the content value from the HTML tag method in Search Console.',
      }),
    ],
  },
  {
    title: 'Announcement banner',
    fields: [
      f.bool('announcementEnabled', 'Show announcement banner'),
      f.text('announcementText', 'Announcement text'),
      f.link('announcementLink', 'Announcement link'),
    ],
  },
  {
    title: 'Notifications',
    fields: [f.text('notificationEmail', 'Default notification email', { help: 'Form notifications go here unless a form sets its own recipients.' })],
  },
];

export const settingsSchema = objectSchema(settingsFields.flatMap((g) => g.fields));

export type NavLink = { label: string; href: string };

export type SiteSettings = {
  siteName: string;
  organisationName: string;
  tagline: string;
  logo: ImageValue;
  logoFooter: ImageValue;
  favicon: ImageValue;
  email: string;
  phones: { number: string }[];
  addressLine: string;
  city: string;
  country: string;
  mapUrl: string;
  mapEmbedUrl: string;
  whatsappNumber: string;
  whatsappLabel: string;
  websiteLabel: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  linkedinUrl: string;
  nav: NavLink[];
  getInvolvedLabel: string;
  getInvolved: NavLink[];
  mobileNav: NavLink[];
  mobileGetInvolvedHeading: string;
  contactButton: LinkValue;
  donateButton: LinkValue;
  mobileContactButton: LinkValue;
  footerDescription: string;
  footerColumns: { title: string; links: NavLink[] }[];
  newsletterHeading: string;
  newsletterText: string;
  newsletterPlaceholder: string;
  newsletterSuccess: string;
  copyrightName: string;
  legalLinks: NavLink[];
  givingNote: string;
  bankDetails: string;
  mobileMoneyDetails: string;
  internationalDetails: string;
  siteUrl: string;
  defaultTitle: string;
  titleSuffix: string;
  defaultDescription: string;
  defaultKeywords: string;
  ogImage: ImageValue;
  googleSiteVerification: string;
  announcementEnabled: boolean;
  announcementText: string;
  announcementLink: LinkValue;
  notificationEmail: string;
};

const empty = { src: '', alt: '' };

/** Values copied verbatim from the live site; used by the seed and as a fallback. */
export const defaultSettings: SiteSettings = {
  siteName: 'IACEC',
  organisationName: 'Innovation Association for Christian Educators',
  tagline: 'Innovation Association for Christian Educators',
  logo: { src: '/media/brand/iacec-logo.png', alt: 'IACEC — Innovation Association for Christian Educators' },
  logoFooter: { src: '/media/brand/iacec-logo-light.png', alt: 'IACEC — Raising a God-loving generation.' },
  favicon: { src: '/media/brand/iacec-emblem.png', alt: 'IACEC' },
  email: 'info@iacecglobal.com',
  phones: [{ number: '+237 6 77 72 16 78' }, { number: '+1 405 762 0857' }],
  addressLine: '',
  city: 'Douala',
  country: 'Cameroon',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=Douala%2C%20Cameroon',
  mapEmbedUrl: '',
  whatsappNumber: '+237 6 77 72 16 78',
  whatsappLabel: 'Chat with us',
  websiteLabel: 'iacecglobal.com',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  linkedinUrl: '',
  nav: [
    { label: 'About', href: '/about' },
    { label: 'Mission & Values', href: '/mission-vision-values' },
    { label: 'Programmes', href: '/programmes' },
    { label: 'News & Events', href: '/news' },
  ],
  getInvolvedLabel: 'Get Involved',
  getInvolved: [
    { label: 'Educators & Teacher Training', href: '/educators' },
    { label: 'Students & Youth Development', href: '/students-youth' },
    { label: 'Parents & Family Development', href: '/parents-family' },
    { label: 'Community & Child Support', href: '/community-support' },
    { label: 'Volunteer With Us', href: '/volunteer' },
    { label: 'Sponsors & Partnerships', href: '/partners' },
    { label: 'Donate', href: '/donate' },
  ],
  mobileNav: [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Programmes', href: '/programmes' },
    { label: 'News & Events', href: '/news' },
    { label: 'Contact', href: '/contact' },
    { label: 'Mission & Values', href: '/mission-vision-values' },
  ],
  mobileGetInvolvedHeading: 'Get involved',
  contactButton: { label: 'Contact', href: '/contact' },
  donateButton: { label: 'Donate', href: '/donate' },
  mobileContactButton: { label: 'Contact us', href: '/contact' },
  footerDescription:
    'A Christian association based in Douala, Cameroon, equipping teachers, parents and caretakers — and teaching children to know, love and obey God.',
  footerColumns: [
    {
      title: 'Programmes',
      links: [
        { label: 'Teacher Training', href: '/programmes/teacher-training-in-biblical-integration' },
        { label: 'Children’s Outreach', href: '/programmes/childrens-outreach-in-schools' },
        { label: 'Parents & Teachers Forum', href: '/programmes/christian-parents-and-teachers-forum' },
        { label: 'Child Sponsorship', href: '/programmes/child-sponsorship-programme' },
        { label: 'All programmes', href: '/programmes' },
      ],
    },
    {
      title: 'Get involved',
      links: [
        { label: 'Donate', href: '/donate' },
        { label: 'Sponsor a Child', href: '/community-support#sponsor' },
        { label: 'Volunteer With Us', href: '/volunteer' },
        { label: 'Sponsors & Partnerships', href: '/partners' },
        { label: 'News, Events & Resources', href: '/news' },
      ],
    },
    {
      title: 'About',
      links: [
        { label: 'About IACEC', href: '/about' },
        { label: 'Mission, Vision & Values', href: '/mission-vision-values' },
        { label: 'Educators & Teacher Training', href: '/educators' },
        { label: 'Students & Youth', href: '/students-youth' },
        { label: 'Contact Us', href: '/contact' },
      ],
    },
  ],
  newsletterHeading: 'Stay in touch',
  newsletterText: 'Receive occasional news from the classroom, training invitations and prayer updates.',
  newsletterPlaceholder: 'Your email address',
  newsletterSuccess: 'Thank you — you are on the list.',
  copyrightName: 'Innovation Association for Christian Educators',
  legalLinks: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Contact', href: '/contact' },
  ],
  givingNote: '',
  bankDetails: '',
  mobileMoneyDetails: '',
  internationalDetails: '',
  siteUrl: 'https://iacecglobal.com',
  defaultTitle: 'IACEC — Raising a God Loving Generation',
  titleSuffix: ' — IACEC',
  defaultDescription:
    'The Innovation Association for Christian Educators (IACEC) is a Christian association based in Douala, Cameroon, equipping teachers, parents and caretakers to teach and live Christ before children.',
  defaultKeywords:
    'IACEC, Innovation Association for Christian Educators, Christian education Cameroon, Christian teacher training, biblical integration, Christian educators Douala, child sponsorship Cameroon',
  ogImage: empty,
  googleSiteVerification: '',
  announcementEnabled: false,
  announcementText: '',
  announcementLink: { label: '', href: '' },
  notificationEmail: 'info@iacecglobal.com',
};
