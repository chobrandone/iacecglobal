import { f, objectSchema, type Field } from '@/lib/fields';
import { iconNames } from '@/lib/icons';

/**
 * Every section type a page can contain. Client-safe: used by the admin page editor to build
 * friendly forms and by the server to validate stored content.
 */
export type SectionDefinition = {
  type: string;
  label: string;
  description: string;
  fields: Field[];
  /** Whether editors may switch the background (white / pale / navy). */
  backgrounds?: boolean;
  /** Used by detail templates only. */
  templateOnly?: boolean;
};

const header = [f.text('eyebrow', 'Eyebrow (small label)'), f.text('heading', 'Heading', { required: true }), f.textarea('description', 'Intro text', 3)];
const linkItem = [f.text('label', 'Label'), f.text('href', 'Link')];
const button = (name: string, label: string) => f.link(name, label);
const styledButtons = f.list(
  'buttons',
  'Buttons',
  [...linkItem, f.select('style', 'Style', ['primary', 'gold', 'outline', 'ghostLight'])],
  'Button',
);
const iconField: Field = { kind: 'select', name: 'icon', label: 'Icon', options: iconNames.map((n) => ({ value: n, label: n })) };
const formKeys = [
  { value: 'training', label: 'Training request' },
  { value: 'outreach', label: 'Outreach invitation' },
  { value: 'forum', label: 'Join the forum' },
  { value: 'sponsor', label: 'Become a sponsor' },
  { value: 'child-application', label: 'Child sponsorship application (confidential)' },
  { value: 'partnership', label: 'Partnership enquiry' },
  { value: 'volunteer', label: 'Volunteer application' },
  { value: 'giving', label: 'Giving details' },
  { value: 'contact', label: 'Contact' },
];

export const sectionDefinitions: SectionDefinition[] = [
  {
    type: 'homeHero',
    label: 'Home hero',
    description: 'Large opening section with headline, buttons, figures and photo.',
    fields: [
      f.text('eyebrow', 'Eyebrow'),
      f.text('line1', 'Headline line 1'),
      f.text('line2', 'Headline line 2 (lighter blue)'),
      f.text('line3', 'Headline line 3 (underlined)'),
      f.textarea('body', 'Intro text', 3),
      button('primary', 'Primary button'),
      button('secondary', 'Secondary button'),
      f.list('stats', 'Figures', [f.text('value', 'Figure'), f.text('label', 'Label')], 'Figure'),
      f.image('image', 'Photo'),
      f.text('badge', 'Photo badge'),
      f.text('visionLabel', 'Card label'),
      f.text('visionText', 'Card text'),
    ],
  },
  {
    type: 'pageHero',
    label: 'Page hero',
    description: 'Opening section of an inner page: navy banner over a photo, or pale split with a photo.',
    fields: [
      f.select('variant', 'Style', [
        { value: 'split', label: 'Pale with photo on the right' },
        { value: 'banner', label: 'Navy banner over photo' },
      ]),
      f.text('breadcrumb', 'Breadcrumb label'),
      f.text('eyebrow', 'Eyebrow'),
      f.text('heading', 'Heading (H1)', { required: true }),
      f.textarea('body', 'Intro text', 3),
      f.image('image', 'Photo'),
    ],
  },
  {
    type: 'scripture',
    label: 'Anchor scripture',
    description: 'Centered scripture quotation with reference.',
    fields: [f.text('eyebrow', 'Eyebrow'), f.textarea('quote', 'Quotation', 4), f.text('reference', 'Reference')],
  },
  {
    type: 'aboutIntro',
    label: 'Who we are (photo + text + cards)',
    description: 'Photo with badge on the left, heading, paragraphs, three small cards and a link.',
    fields: [
      f.image('image', 'Photo'),
      f.text('badgeLabel', 'Photo badge label'),
      f.text('badgeText', 'Photo badge text'),
      f.text('eyebrow', 'Eyebrow'),
      f.text('heading', 'Heading'),
      f.textarea('paragraphs', 'Paragraphs (one per line)', 6),
      f.list('cards', 'Cards', [f.text('title', 'Title'), f.textarea('text', 'Text', 2)], 'Card'),
      button('link', 'Link'),
    ],
  },
  {
    type: 'pillars',
    label: 'Five pillars',
    description: 'Shows the Pillars collection as cards or as a list.',
    backgrounds: true,
    fields: [f.select('variant', 'Layout', [{ value: 'grid', label: 'Cards' }, { value: 'list', label: 'List' }]), ...header],
  },
  {
    type: 'programmes',
    label: 'Programmes',
    description: 'Programme cards from the Programmes collection — featured selection or the full filterable list.',
    backgrounds: true,
    fields: [
      f.select('variant', 'Mode', [
        { value: 'featured', label: 'Featured (with heading)' },
        { value: 'all', label: 'All programmes with filters' },
      ]),
      ...header,
      button('button', 'Button'),
      f.number('count', 'Number of cards (featured mode)'),
      f.list('filters', 'Filter buttons (all mode)', [f.text('key', 'Pillar key (all, teachers, children, families, care, partnerships)'), f.text('label', 'Label')], 'Filter'),
      f.text('emptyTitle', 'Empty-state title'),
    ],
  },
  {
    type: 'navyFeature',
    label: 'Navy feature band',
    description: 'Navy section with text, a list and a photo.',
    fields: [
      f.select('variant', 'Layout', [
        { value: 'home', label: 'Checklist + buttons + photo card' },
        { value: 'formats', label: 'Formats list + tall photo' },
        { value: 'shield', label: 'Shield list + photo' },
      ]),
      f.text('eyebrow', 'Eyebrow'),
      f.text('heading', 'Heading'),
      f.textarea('body', 'Text', 4),
      f.list('items', 'List items', [f.text('title', 'Title / text'), f.text('text', 'Detail (formats layout)')], 'Item'),
      styledButtons,
      f.image('image', 'Photo'),
      f.text('overlayLabel', 'Photo card label'),
      f.text('overlayText', 'Photo card text'),
    ],
  },
  {
    type: 'imageLinkCards',
    label: 'Photo link cards',
    description: 'Two large photo cards linking to other pages.',
    backgrounds: true,
    fields: [...header, f.list('cards', 'Cards', [f.text('title', 'Title'), f.textarea('text', 'Text', 2), f.text('href', 'Link'), f.image('image', 'Photo')], 'Card')],
  },
  {
    type: 'sponsorship',
    label: 'Child sponsorship steps',
    description: 'Photo, support circle and the Sponsorship steps collection.',
    backgrounds: true,
    fields: [
      ...header,
      f.image('image', 'Photo'),
      f.text('statsLabel', 'Support circle label'),
      f.list('stats', 'Support circle', [f.text('value', 'Number'), f.text('label', 'Label')], 'Item'),
      styledButtons,
    ],
  },
  {
    type: 'timeline',
    label: 'Timeline',
    description: 'Milestones collection as a timeline.',
    backgrounds: true,
    fields: [...header, button('button', 'Button (optional)'), f.bool('homeOnly', 'Only milestones marked "show on home"'), f.number('limit', 'Maximum entries (0 = all)')],
  },
  {
    type: 'latestNews',
    label: 'Latest news',
    description: 'Most recent news articles.',
    backgrounds: true,
    fields: [...header, button('button', 'Button'), f.number('count', 'Number of articles')],
  },
  {
    type: 'ctaBand',
    label: 'Call-to-action band',
    description: 'Navy band with centered heading and two buttons.',
    fields: [f.text('eyebrow', 'Eyebrow'), f.text('heading', 'Heading'), f.textarea('body', 'Text', 2), button('primary', 'Gold button'), button('secondary', 'Outline button')],
  },
  {
    type: 'storySplit',
    label: 'Story (text + facts + photo)',
    description: 'Heading and paragraphs with fact cards, and a photo with a highlighted card.',
    backgrounds: true,
    fields: [
      f.text('eyebrow', 'Eyebrow'),
      f.text('heading', 'Heading'),
      f.textarea('paragraphs', 'Paragraphs (one per line)', 8),
      f.list('facts', 'Fact cards', [f.text('label', 'Label'), f.text('value', 'Figure'), f.text('text', 'Text')], 'Fact'),
      f.image('image', 'Photo'),
      f.text('calloutLabel', 'Highlighted card label'),
      f.text('calloutText', 'Highlighted card text'),
      button('calloutLink', 'Highlighted card link'),
    ],
  },
  {
    type: 'visionMission',
    label: 'Vision & mission',
    description: 'Navy vision card, gold mission card and a three-part summary strip.',
    fields: [
      f.text('visionLabel', 'Vision label'),
      f.textarea('visionText', 'Vision', 2),
      f.text('missionLabel', 'Mission label'),
      f.textarea('missionText', 'Mission', 4),
      f.list('strip', 'Summary strip', [f.text('label', 'Label'), f.text('text', 'Text')], 'Item'),
    ],
  },
  {
    type: 'values',
    label: 'Core values',
    description: 'Values collection as icon cards.',
    backgrounds: true,
    fields: header,
  },
  {
    type: 'numberedCards',
    label: 'Numbered cards',
    description: 'Cards numbered 01, 02… from your own items, Volunteer areas or Partnership types.',
    backgrounds: true,
    fields: [
      f.select('variant', 'Style', [
        { value: 'steps', label: 'Steps (three columns, no hover)' },
        { value: 'cards', label: 'Cards (hover lift)' },
      ]),
      f.select('source', 'Items from', [
        { value: 'inline', label: 'Items below' },
        { value: 'volunteerAreas', label: 'Volunteer areas collection' },
        { value: 'partnershipTypes', label: 'Partnership types collection' },
      ]),
      ...header,
      f.list('items', 'Items', [f.text('title', 'Title'), f.textarea('text', 'Text', 2)], 'Item'),
      f.group('ctaCard', 'Extra navy card (optional)', [f.text('title', 'Title'), f.textarea('text', 'Text', 2), f.link('link', 'Link')]),
    ],
  },
  {
    type: 'iconCards',
    label: 'Icon cards',
    description: 'Cards with an icon, from your own items or the Donation funds collection.',
    backgrounds: true,
    fields: [
      f.select('variant', 'Style', [
        { value: 'side', label: 'Icon beside text (two columns)' },
        { value: 'sideLarge', label: 'Large icon beside text, hover lift' },
        { value: 'top', label: 'Icon above text (three columns)' },
      ]),
      f.select('source', 'Items from', [
        { value: 'inline', label: 'Items below' },
        { value: 'donationFunds', label: 'Donation funds collection' },
      ]),
      ...header,
      f.list('items', 'Items', [iconField, f.text('title', 'Title'), f.textarea('text', 'Text', 2)], 'Card'),
    ],
  },
  {
    type: 'iconListImage',
    label: 'Icon list + photo',
    description: 'Heading with a list of icon cards, and a sticky photo with a highlighted card.',
    backgrounds: true,
    fields: [
      ...header,
      f.list('items', 'Items', [iconField, f.text('title', 'Title'), f.textarea('text', 'Text', 2)], 'Item'),
      f.image('image', 'Photo'),
      f.text('calloutLabel', 'Card label'),
      f.text('calloutTitle', 'Card heading'),
      f.textarea('calloutText', 'Card text', 2),
    ],
  },
  {
    type: 'formSection',
    label: 'Form',
    description: 'Introduction on the left, a form card on the right.',
    backgrounds: true,
    fields: [
      f.select('formKey', 'Form', formKeys),
      f.select('layout', 'Column widths', [
        { value: 'narrow', label: 'Narrow text, wide form' },
        { value: 'balanced', label: 'Balanced' },
      ]),
      f.bool('compact', 'Less vertical padding'),
      ...header,
      f.select('bulletStyle', 'Bullet style', [
        { value: 'arrow', label: 'Gold arrows' },
        { value: 'dot', label: 'Text bullets' },
      ]),
      f.list('bullets', 'Bullet points', [f.text('text', 'Text')], 'Point'),
      f.list('notes', 'Notes (bold lead-in)', [f.text('title', 'Lead-in'), f.textarea('text', 'Text', 2)], 'Note'),
      f.list('boxes', 'Information boxes', [iconField, f.text('title', 'Title'), f.textarea('text', 'Text (or one list item per line)', 4), f.bool('numbered', 'Show as list')], 'Box'),
      f.text('cardHeading', 'Heading inside the form card (optional)'),
      f.textarea('cardText', 'Text inside the form card (optional)', 2),
    ],
  },
  {
    type: 'imageTextList',
    label: 'Photo + text list',
    description: 'Photo on the left, heading and a list with gold rules on the right.',
    backgrounds: true,
    fields: [f.image('image', 'Photo'), ...header, f.list('items', 'Items', [f.text('title', 'Title'), f.textarea('text', 'Text', 2)], 'Item')],
  },
  {
    type: 'stepsImage',
    label: 'Numbered steps + photo',
    description: 'Heading and numbered steps on the left, photo on the right.',
    backgrounds: true,
    fields: [...header, f.list('steps', 'Steps', [f.text('title', 'Title'), f.textarea('text', 'Text', 2)], 'Step'), f.image('image', 'Photo')],
  },
  {
    type: 'givingMethods',
    label: 'Giving methods',
    description: 'Bank and mobile money details from Site settings, or a placeholder until they are set.',
    backgrounds: true,
    fields: [...header, f.text('emptyTitle', 'Placeholder title'), f.textarea('emptyText', 'Placeholder text', 3), button('contactLink', 'Contact button')],
  },
  {
    type: 'contactCards',
    label: 'Contact cards',
    description: 'Email, phone, WhatsApp and location cards using Site settings.',
    fields: [f.text('emailLabel', 'Email label'), f.text('phoneLabel', 'Phone label'), f.text('whatsappLabel', 'WhatsApp label'), f.text('locationLabel', 'Location label')],
  },
  {
    type: 'contactMain',
    label: 'Contact form + location',
    description: 'Contact form card, location details and mailing list.',
    fields: [
      f.select('formKey', 'Form', formKeys),
      f.text('formHeading', 'Form heading'),
      f.textarea('formText', 'Form text', 2),
      f.text('eyebrow', 'Location eyebrow'),
      f.text('heading', 'Location heading'),
      f.textarea('text', 'Location text', 3),
      f.text('mapLinkLabel', 'Map link label'),
      f.text('mapLinkAction', 'Map link action'),
      f.text('newsletterHeading', 'Mailing list heading'),
      f.textarea('newsletterText', 'Mailing list text', 2),
    ],
  },
  {
    type: 'legal',
    label: 'Policy text',
    description: 'Headed sections of rich text with a closing callout.',
    backgrounds: true,
    fields: [f.list('sections', 'Sections', [f.text('heading', 'Heading'), f.rich('body', 'Text')], 'Section'), f.text('calloutHeading', 'Callout heading'), f.rich('calloutBody', 'Callout text')],
  },
  {
    type: 'newsHub',
    label: 'Newsroom',
    description: 'Tabs for news, events and resources.',
    fields: [
      f.select('view', 'Tab shown', ['news', 'events', 'resources']),
      f.list('tabs', 'Tabs', [f.text('key', 'Key (news, events, resources)'), ...linkItem], 'Tab'),
      f.text('searchPlaceholder', 'Search placeholder'),
      f.text('newsEmptyTitle', 'No news title'),
      f.textarea('newsEmptyText', 'No news text', 2),
      f.text('eventsEmptyTitle', 'No events title'),
      f.textarea('eventsEmptyText', 'No events text', 2),
      f.text('conferencesHeading', 'Past conferences heading'),
      f.text('resourcesEmptyTitle', 'No resources title'),
      f.textarea('resourcesEmptyText', 'No resources text', 2),
    ],
  },
  {
    type: 'team',
    label: 'Team',
    description: 'Team members grouped by role. Hidden while the collection is empty.',
    backgrounds: true,
    fields: [...header, f.list('groups', 'Groups', [f.text('key', 'Group key (founder, board, foundation, staff)'), f.text('label', 'Heading')], 'Group')],
  },
  {
    type: 'testimonies',
    label: 'Testimonies',
    description: 'Approved testimonies. Hidden while none are approved.',
    backgrounds: true,
    fields: header,
  },
  {
    type: 'partnerLogos',
    label: 'Partner logos',
    description: 'Partners marked "show publicly". Hidden while none are.',
    backgrounds: true,
    fields: header,
  },
  {
    type: 'richText',
    label: 'Rich text',
    description: 'Free text with optional heading.',
    backgrounds: true,
    fields: [f.text('eyebrow', 'Eyebrow'), f.text('heading', 'Heading'), f.rich('body', 'Text')],
  },
  {
    type: 'programmeBody',
    label: 'Programme details',
    description: 'Programme description and "At a glance" box (programme template).',
    templateOnly: true,
    fields: [
      f.text('ctaFallback', 'Main button label when the programme has none'),
      f.text('allLabel', '"All programmes" button'),
      f.text('glanceHeading', 'Box heading'),
      f.text('pillarLabel', 'Pillar label'),
      f.text('whereLabel', 'Location label'),
      f.text('deliveryLabel', 'Delivery label'),
      f.text('audienceLabel', 'Audience label'),
      f.text('formatLabel', 'Format label'),
      f.text('frequencyLabel', 'Frequency label'),
      f.text('statusLabel', 'Status label'),
      f.textarea('glanceNote', 'Box note', 2),
      button('requestButton', 'Box button'),
    ],
  },
  {
    type: 'relatedProgrammes',
    label: 'Other programmes',
    description: 'Programmes from the same pillar (programme template).',
    templateOnly: true,
    fields: [f.text('eyebrow', 'Eyebrow'), f.text('heading', 'Heading'), f.text('viewAllLabel', '"View all" link')],
  },
  {
    type: 'articleBody',
    label: 'Article',
    description: 'Article header, cover photo and text (news template).',
    templateOnly: true,
    fields: [f.text('backLabel', 'Back link label'), f.text('byline', 'Byline prefix')],
  },
  {
    type: 'moreNews',
    label: 'More news',
    description: 'Other recent articles (news template).',
    templateOnly: true,
    fields: [f.text('heading', 'Heading'), f.number('count', 'Number of articles')],
  },
];

export const sectionDefinitionMap = Object.fromEntries(sectionDefinitions.map((d) => [d.type, d]));

export function parseSectionContent(type: string, content: unknown) {
  const def = sectionDefinitionMap[type];
  if (!def) return (content ?? {}) as Record<string, unknown>;
  const parsed = objectSchema(def.fields).safeParse(content ?? {});
  return (parsed.success ? parsed.data : content) as Record<string, unknown>;
}
