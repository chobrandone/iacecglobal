import { img } from './images';

/** Every page of the live site, section by section, with its text copied verbatim. */

type SeedSection = { type: string; background?: 'white' | 'mist' | 'navy'; anchor?: string; label?: string; content: Record<string, unknown> };
export type SeedPage = {
  slug: string;
  title: string;
  seoTitle?: string;
  metaDescription?: string;
  isTemplate?: boolean;
  sections: SeedSection[];
};

const L = (label: string, href: string) => ({ label, href });
const cta = (eyebrow: string, heading: string, body: string, primary: [string, string], secondary: [string, string]) => ({
  type: 'ctaBand',
  background: 'navy' as const,
  content: { eyebrow, heading, body, primary: L(...primary), secondary: L(...secondary) },
});
const scripture = {
  type: 'scripture',
  content: {
    eyebrow: 'Our anchor scripture',
    quote:
      '“Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, teaching them to observe all that I have commanded you.”',
    reference: 'Matthew 28:19–20',
  },
};
const sponsorshipSection = (anchor: string, buttons: { label: string; href: string; style: string }[]) => ({
  type: 'sponsorship',
  background: 'mist' as const,
  anchor,
  content: {
    eyebrow: 'Child sponsorship',
    heading: 'Not just school fees. A family that follows up.',
    description:
      'Our Child Sponsorship Programme supports children who have lost one or both parents — with schooling, material help and consistent personal follow-up.',
    image: img('sponsorship'),
    statsLabel: 'How a child is supported',
    stats: [
      { value: '1', label: 'Child' },
      { value: '1', label: 'Sponsor' },
      { value: '2', label: 'Family members' },
      { value: '2', label: 'IACEC members' },
    ],
    buttons,
  },
});
const p = (...paras: string[]) => paras.map((x) => `<p>${x}</p>`).join('');

export const seedPages: SeedPage[] = [
  {
    slug: '',
    title: 'Home',
    seoTitle: 'Raising a God Loving Generation',
    metaDescription:
      'IACEC is a Christian association in Douala, Cameroon, equipping teachers, parents and caretakers and teaching children to know, love and obey God.',
    sections: [
      {
        type: 'homeHero',
        background: 'mist',
        content: {
          eyebrow: 'Douala, Cameroon · Since 1990',
          line1: 'Raising a',
          line2: 'God Loving',
          line3: 'Generation.',
          body: 'Equipping teachers, strengthening families and helping children know, love and obey God — through the classroom and the home.',
          primary: L('Discover IACEC', '/programmes'),
          secondary: L('Sponsor a Child', '/community-support#sponsor'),
          stats: [
            { value: '5', label: 'Core pillars' },
            { value: '1990', label: 'Our roots begin' },
            { value: '2023', label: 'Relaunched' },
          ],
          image: img('hero'),
          badge: 'Cameroon',
          visionLabel: 'Our vision',
          visionText: 'To raise a God-fearing and loving generation for Christ.',
        },
      },
      scripture,
      {
        type: 'aboutIntro',
        content: {
          image: img('educator'),
          badgeLabel: 'Anchor scripture',
          badgeText: 'Matthew 28:19–20',
          eyebrow: 'Who we are',
          heading: 'A Christian association for the people who shape a generation.',
          paragraphs: [
            'The Innovation Association for Christian Educators is a Christian association based in Douala, Cameroon. We equip teachers, parents and caretakers — and we teach children to know, love and obey God, raising a God-loving generation for Christ.',
            'Our roots reach back to around 1990 through the New Hope Foundation for Culture and Service. In 2023 the association was relaunched with its first foundation members, and the work continues today through five core pillars.',
          ].join('\n'),
          cards: [
            { title: 'Equipping', text: 'Teachers trained to teach with Christian conviction.' },
            { title: 'Reaching', text: 'Children taught to know, love and obey God.' },
            { title: 'Strengthening', text: 'Families raising children of good character.' },
          ],
          link: L('More about IACEC', '/about'),
        },
      },
      {
        type: 'pillars',
        background: 'mist',
        content: {
          variant: 'grid',
          eyebrow: 'Five core pillars',
          heading: 'How we carry out the Great Commission',
          description: 'Every programme sits within one of five pillars — from the teacher at the front of the classroom to the family at home.',
        },
      },
      {
        type: 'programmes',
        content: {
          variant: 'featured',
          eyebrow: 'Our programmes',
          heading: 'Practical work, carried out with care',
          description: 'Training for teachers, outreach for children, support for families and partnership with churches and schools.',
          button: L('All programmes', '/programmes'),
          count: 3,
          filters: [],
          emptyTitle: '',
        },
      },
      {
        type: 'navyFeature',
        background: 'navy',
        content: {
          variant: 'home',
          eyebrow: 'Pillar one · Equipping teachers',
          heading: 'Teachers who teach Christianly — whatever the classroom.',
          body: 'Children spend more waking hours with their teachers than almost anyone else. We train teachers and head teachers to bring Christian conviction into that everyday influence.',
          items: [
            { title: 'Teach Christianly in any classroom — including where the Bible cannot be taught directly.', text: '' },
            { title: 'Model integrity, excellence and love so that children learn from lifestyle, not only words.', text: '' },
            { title: 'Bring the Christian message into lesson planning, discipline and school culture.', text: '' },
          ],
          buttons: [
            { label: 'Explore teacher training', href: '/educators', style: 'gold' },
            { label: 'Book a training', href: '/educators#book', style: 'ghostLight' },
          ],
          image: img('training'),
          overlayLabel: 'Training focus',
          overlayText: 'Biblical integration · Lifestyle evangelism · Christian school culture',
        },
      },
      {
        type: 'imageLinkCards',
        content: {
          eyebrow: 'Children and families',
          heading: 'Faith is formed in two places at once',
          description: 'The classroom and the home must speak with one voice. We serve both — and bring them together.',
          cards: [
            {
              title: 'Children & youth',
              text: 'Outreach in schools and Sunday schools, character education and child safety teaching.',
              href: '/students-youth',
              image: img('children'),
            },
            {
              title: 'Parents & families',
              text: 'Christian parenting, family development and the Christian Parents and Teachers Forum.',
              href: '/parents-family',
              image: img('family'),
            },
          ],
        },
      },
      sponsorshipSection('sponsorship', [
        { label: 'Sponsor a Child', href: '/community-support#sponsor', style: 'primary' },
        { label: 'Apply for Child Support', href: '/community-support/register', style: 'outline' },
      ]),
      {
        type: 'timeline',
        content: {
          eyebrow: 'Our journey',
          heading: 'A long obedience in the same direction',
          description: 'From community service in the early 1990s to a relaunched association training teachers and reaching children today.',
          button: L('Read our story', '/about'),
          homeOnly: false,
          limit: 5,
        },
      },
      { type: 'testimonies', background: 'mist', content: { eyebrow: 'Testimonies', heading: 'What people say about the work', description: '' } },
      {
        type: 'latestNews',
        background: 'mist',
        content: {
          eyebrow: 'News & updates',
          heading: 'From the classroom and the community',
          description: 'Reports, stories and announcements from the work of IACEC.',
          button: L('All news', '/news'),
          count: 2,
        },
      },
      cta(
        'Join the work',
        'A generation is shaped one classroom, one home, one child at a time.',
        'Whether you teach, parent, pray, give or partner — there is a place for you in this work.',
        ['Partner With Us', '/partners'],
        ['Donate', '/donate'],
      ),
    ],
  },
  {
    slug: 'about',
    title: 'About Us',
    metaDescription:
      'IACEC is a Christian association in Douala, Cameroon. Our roots reach back to around 1990 through the New Hope Foundation for Culture and Service, and we relaunched in 2023.',
    sections: [
      {
        type: 'pageHero',
        background: 'navy',
        content: {
          variant: 'banner',
          breadcrumb: 'About us',
          eyebrow: 'About IACEC',
          heading: 'A long obedience in the same direction.',
          body: 'The Innovation Association for Christian Educators is a Christian association based in Douala, Cameroon — equipping teachers, parents and caretakers, and teaching children to know, love and obey God.',
          image: img('community'),
        },
      },
      {
        type: 'storySplit',
        content: {
          eyebrow: 'Our story',
          heading: 'It began with service, and grew into a calling.',
          paragraphs: [
            "IACEC's roots go back to approximately 1990, through the New Hope Foundation for Culture and Service. What started as community service grew, year after year, into a settled conviction: that the classroom and the home are the two places where a generation is formed.",
            'In 2023 the association was relaunched with its first foundation members, gathering educators, parents and church leaders around a single purpose — to fulfil the Great Commission through the classroom and the home.',
            'Today IACEC trains teachers in biblical integration and lifestyle evangelism, reaches children in schools and Sunday schools, strengthens families, supports children in need, and partners with churches and schools across Cameroon.',
          ].join('\n'),
          facts: [
            { label: 'Our roots', value: 'c. 1990', text: 'Through the New Hope Foundation for Culture and Service.' },
            { label: 'Relaunched', value: '2023', text: "With the association's first foundation members." },
          ],
          image: img('educator'),
          calloutLabel: 'Our vision',
          calloutText: 'To raise a God-fearing and loving generation for Christ.',
          calloutLink: L('Mission, vision & values', '/mission-vision-values'),
        },
      },
      {
        type: 'timeline',
        background: 'mist',
        content: {
          eyebrow: 'Our journey',
          heading: 'Milestones along the way',
          description: "The founder's earlier journey is distinct from the programmes carried out today under the IACEC identity.",
          button: L('', ''),
          homeOnly: false,
          limit: 0,
        },
      },
      {
        type: 'team',
        content: {
          eyebrow: 'Leadership',
          heading: 'The people who carry this work',
          description:
            'IACEC is led by its founder, a board and its foundation members. Profiles are published as each member confirms their details.',
          groups: [
            { key: 'founder', label: 'Founder & President' },
            { key: 'board', label: 'Board' },
            { key: 'foundation', label: 'Foundation Member' },
            { key: 'staff', label: 'Staff' },
          ],
        },
      },
      cta(
        'Work with us',
        'The story is still being written.',
        'Churches, schools, teachers, parents and sponsors all have a part to play in the next chapter.',
        ['Partner With Us', '/partners'],
        ['Contact IACEC', '/contact'],
      ),
    ],
  },
  {
    slug: 'mission-vision-values',
    title: 'Mission, Vision & Values',
    metaDescription:
      'Our vision is to raise a God-fearing and loving generation for Christ. Our mission is to fulfil the Great Commission through the classroom and the home.',
    sections: [
      {
        type: 'pageHero',
        background: 'mist',
        content: {
          variant: 'split',
          breadcrumb: 'Mission, vision & values',
          eyebrow: 'Our foundation',
          heading: 'Christ at the centre of every lesson and every home.',
          body: 'IACEC exists to fulfil the Great Commission through the classroom and the home. Everything we do flows from that conviction.',
          image: img('educator'),
        },
      },
      {
        type: 'visionMission',
        content: {
          visionLabel: 'Our vision',
          visionText: 'To raise a God-fearing and loving generation for Christ.',
          missionLabel: 'Our mission',
          missionText:
            'To fulfil the Great Commission through the classroom and the home, by equipping teachers, parents and caretakers to teach and live Christ before children, and by teaching children to know, love and obey God.',
          strip: [
            { label: 'Through', text: 'The classroom and the home' },
            { label: 'By', text: 'Equipping teachers, parents and caretakers' },
            { label: 'So that', text: 'Children know, love and obey God' },
          ],
        },
      },
      scripture,
      {
        type: 'values',
        background: 'mist',
        content: {
          eyebrow: 'Core values',
          heading: 'Six convictions that shape the work',
          description: 'These values are not statements on a wall. They decide how we train, how we follow up and how we treat every child.',
        },
      },
      {
        type: 'pillars',
        content: { variant: 'list', eyebrow: 'Outworked in five pillars', heading: 'How these values take shape', description: '' },
      },
      cta(
        'Live it with us',
        'These values are best understood in a classroom.',
        'Visit a training, invite an outreach or partner with a school — and see what this looks like in practice.',
        ['Explore programmes', '/programmes'],
        ['Volunteer', '/volunteer'],
      ),
    ],
  },
  {
    slug: 'programmes',
    title: 'Our Programmes',
    metaDescription:
      'Teacher training, children’s outreach, family development, child sponsorship and partnerships — the programmes of IACEC in Cameroon.',
    sections: [
      {
        type: 'pageHero',
        background: 'navy',
        content: {
          variant: 'banner',
          breadcrumb: 'Programmes',
          eyebrow: 'Our programmes',
          heading: 'Work you can see, in places you can visit.',
          body: 'Every IACEC programme sits within one of five pillars — and every one of them begins with people, not a project document.',
          image: img('training'),
        },
      },
      {
        type: 'programmes',
        content: {
          variant: 'all',
          eyebrow: '',
          heading: 'All programmes',
          description: '',
          button: L('', ''),
          count: 0,
          filters: [
            { key: 'all', label: 'All programmes' },
            { key: 'teachers', label: 'Teachers' },
            { key: 'children', label: 'Children' },
            { key: 'families', label: 'Families' },
            { key: 'care', label: 'Child support' },
            { key: 'partnerships', label: 'Partnerships' },
          ],
          emptyTitle: 'Nothing listed here yet.',
        },
      },
      {
        type: 'numberedCards',
        background: 'mist',
        content: {
          variant: 'steps',
          source: 'inline',
          eyebrow: 'How we work',
          heading: 'Small, deliberate steps — repeated faithfully',
          description: 'Our approach is relational and long-term. We would rather do a few things well than many things quickly.',
          items: [
            { title: 'We come alongside', text: 'We work with the school, church or family that already knows the child — never around them.' },
            { title: 'We equip the adults', text: 'Teachers and caretakers are trained so the impact continues long after our team has gone home.' },
            { title: 'We follow up', text: 'Consistent visits and contact keep the work accountable, personal and lasting.' },
          ],
          ctaCard: { title: '', text: '', link: L('', '') },
        },
      },
      cta(
        'Bring us to your community',
        'Which of these does your school, church or family need most?',
        'Tell us about your context and we will suggest the programme that fits.',
        ['Talk to IACEC', '/contact'],
        ['Partner With Us', '/partners'],
      ),
    ],
  },
  {
    slug: 'educators',
    title: 'Educators & Teacher Training',
    metaDescription:
      'IACEC trains teachers and head teachers in biblical integration and lifestyle evangelism — teaching Christianly in any classroom in Cameroon.',
    sections: [
      {
        type: 'pageHero',
        background: 'mist',
        content: {
          variant: 'split',
          breadcrumb: 'Educators',
          eyebrow: 'Pillar one · Equipping teachers',
          heading: 'Teaching Christianly in any classroom.',
          body: 'Teachers shape what a child believes about themselves, about learning and about God. We help them do that with conviction, integrity and excellence.',
          image: img('training'),
        },
      },
      {
        type: 'iconCards',
        content: {
          variant: 'side',
          source: 'inline',
          eyebrow: 'What we train',
          heading: 'Practical training for real classrooms',
          description:
            'Our training is designed for the classroom a teacher actually stands in — including schools where the Bible cannot be taught directly.',
          items: [
            {
              icon: 'BookOpen',
              title: 'Teacher Training in Biblical Integration',
              text: 'Training school teachers and head teachers to integrate Christian principles into education — in lesson planning, classroom culture and discipline.',
            },
            {
              icon: 'HeartHandshake',
              title: 'Lifestyle Evangelism Workshop',
              text: 'Helping teachers demonstrate Christian faith through character, integrity, excellence and love, where words alone are not permitted.',
            },
            {
              icon: 'GraduationCap',
              title: 'Leadership for head teachers',
              text: 'Supporting school leaders to shape a Christian school culture that staff, pupils and parents can feel.',
            },
            {
              icon: 'Users',
              title: 'Cluster and church-based sessions',
              text: 'Bringing training to a group of schools or a church network, so that teachers encourage one another afterwards.',
            },
          ],
        },
      },
      {
        type: 'navyFeature',
        background: 'navy',
        content: {
          variant: 'formats',
          eyebrow: 'Lifestyle evangelism',
          heading: 'Children learn from lifestyle more than from words.',
          body: 'A teacher who is patient, honest, prepared and kind is already teaching the gospel. Our lifestyle evangelism workshop helps teachers understand that their character is part of the curriculum.',
          items: [
            { title: 'Half-day workshop', text: 'An introduction for a whole staff team.' },
            { title: 'Two-day training', text: 'Deeper work on integration and lifestyle evangelism.' },
            { title: 'Follow-up visit', text: 'A return visit to encourage and refine practice.' },
          ],
          buttons: [],
          image: img('educator'),
          overlayLabel: '',
          overlayText: '',
        },
      },
      {
        type: 'formSection',
        background: 'mist',
        anchor: 'book',
        content: {
          formKey: 'training',
          layout: 'narrow',
          compact: false,
          eyebrow: 'Book a training',
          heading: 'Bring IACEC to your staff team',
          description:
            'Tell us about your school, the number of teachers and the dates that would work for you. We will respond with a proposal.',
          bulletStyle: 'arrow',
          bullets: [
            { text: 'Suitable for primary and secondary schools, churches and school networks.' },
            { text: 'Sessions can be held at your school or in a shared venue.' },
            { text: 'Follow-up visits are available to help training settle into practice.' },
          ],
          notes: [],
          boxes: [],
          cardHeading: '',
          cardText: '',
        },
      },
      cta(
        'Not a teacher?',
        'Teacher training is strengthened by people who pray, give and serve.',
        "Sponsor a teacher's place at a training, or volunteer your professional skills to the work.",
        ['Sponsor a training', '/donate'],
        ['Volunteer With Us', '/volunteer'],
      ),
    ],
  },
  {
    slug: 'students-youth',
    title: 'Students & Youth Development',
    metaDescription:
      'IACEC reaches children in schools and Sunday schools — teaching them who God is, a personal relationship with Him, personal safety and obedience.',
    sections: [
      {
        type: 'pageHero',
        background: 'navy',
        content: {
          variant: 'banner',
          breadcrumb: 'Students & youth',
          eyebrow: 'Pillar two · Reaching children',
          heading: 'Helping children know, love and obey God.',
          body: 'We visit schools and Sunday schools, with permission and partnership, to teach children in a way they can understand — and to help them stay safe.',
          image: img('children'),
        },
      },
      {
        type: 'iconCards',
        content: {
          variant: 'sideLarge',
          source: 'inline',
          eyebrow: "Our children's outreach",
          heading: 'Four things every child should understand',
          description:
            "Our outreach addresses four areas, taught simply and at the child's level — always with the school or church, never around them.",
          items: [
            {
              icon: 'Sparkles',
              title: 'Who is God?',
              text: 'Explaining God simply, at the level of the child, with language and pictures they can hold on to.',
            },
            {
              icon: 'HeartHandshake',
              title: 'A personal relationship with God',
              text: 'Helping children understand God as friend and Father — not a distant idea, but someone who knows them.',
            },
            {
              icon: 'ShieldCheck',
              title: 'Protection and safety',
              text: 'Helping children recognise danger, stay safe and know when and how to seek help from a trusted adult.',
            },
            { icon: 'Footprints', title: 'Obeying God', text: 'Helping children apply faith to everyday decisions at home, in school and among friends.' },
          ],
        },
      },
      {
        type: 'navyFeature',
        background: 'navy',
        content: {
          variant: 'shield',
          eyebrow: 'Child protection',
          heading: 'Every child is seen, valued and protected.',
          body: "Children's outreach is carried out with the authorisation of the school or church, with care for each child's dignity. We do not photograph or name a child publicly without recorded consent, and we never publish private information about a child or family.",
          items: [
            { title: 'Outreach only by invitation, with the leadership of the school or church present.', text: '' },
            { title: 'Personal safety taught in an age-appropriate way, including when to seek help.', text: '' },
            { title: "Consent recorded before any child's photo or name is published.", text: '' },
          ],
          buttons: [],
          image: img('children'),
          overlayLabel: '',
          overlayText: '',
        },
      },
      {
        type: 'formSection',
        background: 'mist',
        anchor: 'invite',
        content: {
          formKey: 'outreach',
          layout: 'narrow',
          compact: false,
          eyebrow: 'Invite the team',
          heading: "Bring a children's outreach to your school or church",
          description: 'Tell us who you are and what you have in mind. We will confirm what is possible and agree the details with your leadership.',
          bulletStyle: 'arrow',
          bullets: [],
          notes: [],
          boxes: [],
          cardHeading: '',
          cardText: '',
        },
      },
      cta(
        'Stand with a child',
        'One hour in a classroom can outlive a whole childhood.',
        "Give towards children's outreach, or volunteer to help a team visit a school.",
        ['Give to children’s outreach', '/donate'],
        ['Volunteer', '/volunteer'],
      ),
    ],
  },
  {
    slug: 'parents-family',
    title: 'Parents & Family Development',
    metaDescription:
      'IACEC helps parents and caretakers raise children of good character at home, through Christian parenting sessions and the Christian Parents and Teachers Forum.',
    sections: [
      {
        type: 'pageHero',
        background: 'mist',
        content: {
          variant: 'split',
          breadcrumb: 'Parents & family',
          eyebrow: 'Pillar three · Strengthening families',
          heading: 'Faith is formed at home first.',
          body: 'Parents and caretakers are the first teachers a child will ever have. We walk with them — through parenting sessions, family development and the Christian Parents and Teachers Forum.',
          image: img('family'),
        },
      },
      {
        type: 'iconListImage',
        content: {
          eyebrow: 'What we address',
          heading: 'Support for the people raising the next generation',
          description: 'Our sessions are practical, warm and rooted in scripture — designed for real households, not ideal ones.',
          items: [
            {
              icon: 'House',
              title: 'Christian parenting foundations',
              text: 'What it means to raise a child before God, and how grace shapes discipline and expectation.',
            },
            {
              icon: 'Sprout',
              title: 'Character and discipline at home',
              text: 'Practical approaches to building good character without breaking a child’s spirit.',
            },
            {
              icon: 'MessageCircle',
              title: 'Faith conversations',
              text: 'How to talk with children about God, doubt, failure and forgiveness at home.',
            },
            { icon: 'Users', title: 'School and home together', text: 'Working with teachers instead of against them, for the good of the child.' },
          ],
          image: img('family'),
          calloutLabel: 'Why this matters',
          calloutTitle: 'A teacher sees a child for a season. A family sees that child for life.',
          calloutText: 'When home and school agree, a child receives one consistent message about who God is and who they are.',
        },
      },
      {
        type: 'formSection',
        background: 'mist',
        anchor: 'forum',
        content: {
          formKey: 'forum',
          layout: 'balanced',
          compact: false,
          eyebrow: 'The forum',
          heading: 'Christian Parents and Teachers Forum',
          description:
            "A gathering that connects parents and teachers around Christian child development — so that the two most important adults in a child's life can talk to one another.",
          bulletStyle: 'arrow',
          bullets: [
            { text: 'Established when IACEC was relaunched in 2023.' },
            { text: 'Open to parents, caretakers, teachers and church children’s workers.' },
            { text: 'A place to ask honest questions and share practical experience.' },
            { text: 'Sessions are announced through our news and events pages.' },
          ],
          notes: [],
          boxes: [],
          cardHeading: 'Join the forum',
          cardText: 'Register your interest and we will let you know when the next forum is held.',
        },
      },
      cta(
        'For churches',
        'Host a parenting session for your congregation.',
        'We can run a family and community outreach with your church, reaching fathers, mothers and couples together.',
        ['Invite IACEC', '/contact'],
        ['Explore programmes', '/programmes'],
      ),
    ],
  },
  {
    slug: 'community-support',
    title: 'Community Outreach & Child Support',
    metaDescription:
      'Community outreach, child sponsorship and support for children in need through IACEC in Douala, Cameroon. Not just school fees — a family that follows up.',
    sections: [
      {
        type: 'pageHero',
        background: 'navy',
        content: {
          variant: 'banner',
          breadcrumb: 'Community & child support',
          eyebrow: 'Pillar four · Caring for children in need',
          heading: 'A child is not a project. A child is a person.',
          body: 'Through community outreach and our Child Sponsorship Programme, we support children who have lost one or both parents — with schooling, material help and personal follow-up.',
          image: img('community'),
        },
      },
      {
        type: 'imageTextList',
        content: {
          image: img('community'),
          eyebrow: 'Community outreach',
          heading: 'We go to where families already gather',
          description:
            'Our community work happens in churches, schools and neighbourhood gatherings — always in partnership with local leadership.',
          items: [
            {
              title: 'Family & community outreach',
              text: 'Reaching fathers, mothers, couples and whole communities with practical, Christ-centred teaching on family life.',
            },
            {
              title: 'Community engagement',
              text: 'Meeting communities where they are — in churches, schools and neighbourhood gatherings — and serving what is already there.',
            },
            {
              title: 'Church partnerships',
              text: 'Equipping churches to care for the children and families in their own congregation and neighbourhood.',
            },
          ],
        },
      },
      sponsorshipSection('sponsorship', [
        { label: 'Sponsor a Child', href: '/community-support#sponsor', style: 'primary' },
        { label: 'Apply for Child Support', href: '/community-support/register', style: 'outline' },
      ]),
      {
        type: 'formSection',
        background: 'white',
        anchor: 'sponsor',
        content: {
          formKey: 'sponsor',
          layout: 'narrow',
          compact: true,
          eyebrow: 'Sponsor a child',
          heading: 'Begin a sponsorship',
          description:
            'Tell us how you would like to help. A sponsorship coordinator will contact you with the next steps and answer any questions.',
          bulletStyle: 'arrow',
          bullets: [],
          notes: [],
          boxes: [],
          cardHeading: '',
          cardText: '',
        },
      },
      {
        type: 'formSection',
        background: 'mist',
        anchor: 'apply',
        content: {
          formKey: '',
          layout: 'balanced',
          compact: true,
          eyebrow: 'Apply for support',
          heading: 'Child sponsorship application',
          description:
            'Applications are normally made by a caretaker, and are often referred by a church or school. Every application is verified and followed by a home visit.',
          bulletStyle: 'arrow',
          bullets: [],
          notes: [],
          boxes: [
            {
              icon: 'Lock',
              title: 'Private and confidential',
              text: 'This form is seen only by authorised IACEC sponsorship staff. Child details, documents, school information and family circumstances are never published on this website.',
              numbered: false,
            },
            {
              icon: 'ShieldCheck',
              title: 'What happens next',
              text: [
                '1. We review the application.',
                '2. We contact the caretaker to arrange verification and a home visit.',
                '3. If approved, the child is matched with a sponsor.',
                '4. Support and follow-up begin.',
              ].join('\n'),
              numbered: true,
            },
          ],
          cardHeading: 'Register a child',
          cardText: 'The form takes about 20 minutes, works on a phone and saves as you go. Have the child’s birth certificate, proof of the parent’s death and the caretaker’s ID card ready to photograph.',
          cardLink: { label: 'Start the registration form', href: '/community-support/register' },
        },
      },
      cta(
        'Protect a childhood',
        'Twelve children are the beginning.',
        'Our Child Sponsorship Programme begins in 2026, initially targeting twelve children. Your support helps a child stay in school and stay known.',
        ['Sponsor a Child', '/community-support#sponsor'],
        ['Donate', '/donate'],
      ),
    ],
  },
  {
    slug: 'partners',
    title: 'Sponsors & Partnerships',
    metaDescription:
      'Partner with IACEC — churches, schools, companies, foundations and individuals advancing Christian education in Cameroon.',
    sections: [
      {
        type: 'pageHero',
        background: 'navy',
        content: {
          variant: 'banner',
          breadcrumb: 'Partners',
          eyebrow: 'Sponsors & partnerships',
          heading: 'No one raises a generation alone.',
          body: 'We work with churches, schools, companies, foundations and individuals who believe that a child formed in truth and love changes a whole community.',
          image: img('conference'),
        },
      },
      {
        type: 'numberedCards',
        content: {
          variant: 'cards',
          source: 'partnershipTypes',
          eyebrow: 'Who we partner with',
          heading: 'Five kinds of partnership',
          description: 'Each partnership is shaped around what you can offer and what the community genuinely needs.',
          items: [],
          ctaCard: {
            title: 'Have something different in mind?',
            text: 'Tell us what you would like to see happen, and we will explore it with you.',
            link: L('Start a conversation', '#become-a-partner'),
          },
        },
      },
      {
        type: 'stepsImage',
        background: 'mist',
        content: {
          eyebrow: 'How we work',
          heading: 'Clear from the first conversation',
          description:
            'Partnerships fail when expectations are vague. Ours begin with a written understanding of the work and end with an honest report.',
          steps: [
            { title: 'A conversation', text: 'We begin by listening — what you care about, and what your community actually needs.' },
            { title: 'A clear agreement', text: 'We agree the programme, the people responsible, and what success will look like.' },
            { title: 'Delivered and reported', text: 'We do the work together and report back on what happened, honestly and in writing.' },
          ],
          image: img('volunteers'),
        },
      },
      {
        type: 'formSection',
        background: 'mist',
        anchor: 'become-a-partner',
        content: {
          formKey: 'partnership',
          layout: 'narrow',
          compact: false,
          eyebrow: 'Become a partner',
          heading: 'Tell us about your organisation',
          description: 'Whether you are a church, a school, a company or an individual, we would like to hear what you have in mind.',
          bulletStyle: 'arrow',
          bullets: [],
          notes: [],
          boxes: [],
          cardHeading: '',
          cardText: '',
        },
      },
      { type: 'partnerLogos', content: { eyebrow: 'Our partners', heading: 'Standing with us', description: '' } },
      cta(
        'Pray with us',
        'Partnership is more than funding.',
        'Prayer, expertise, advocacy and opening doors are all forms of partnership that strengthen this work.',
        ['Contact IACEC', '/contact'],
        ['Volunteer', '/volunteer'],
      ),
    ],
  },
  {
    slug: 'volunteer',
    title: 'Volunteer With Us',
    metaDescription:
      'Serve with IACEC in Cameroon — teacher training support, children’s outreach, administration, professional skills and prayer.',
    sections: [
      {
        type: 'pageHero',
        background: 'mist',
        content: {
          variant: 'split',
          breadcrumb: 'Volunteer',
          eyebrow: 'Serve with us',
          heading: 'Give what you already have.',
          body: 'Volunteers carry the practical weight of this work — setting up a training, sitting with a child, keeping records straight, praying when no one is watching.',
          image: img('volunteers'),
        },
      },
      {
        type: 'numberedCards',
        content: {
          variant: 'cards',
          source: 'volunteerAreas',
          eyebrow: 'Ways to serve',
          heading: 'Where volunteers are most needed',
          description: 'You do not need to be a teacher to serve. Consistency and care matter more than a title.',
          items: [],
          ctaCard: { title: '', text: '', link: L('', '') },
        },
      },
      {
        type: 'formSection',
        background: 'mist',
        anchor: 'apply',
        content: {
          formKey: 'volunteer',
          layout: 'narrow',
          compact: false,
          eyebrow: 'Register',
          heading: 'Become an IACEC volunteer',
          description:
            'Tell us a little about yourself and how you would like to serve. We will contact you about the next opportunity that fits.',
          bulletStyle: 'dot',
          bullets: [
            { text: 'Volunteers serve under the leadership of the school, church or IACEC team lead.' },
            { text: 'Anyone working with children is briefed on our child protection expectations.' },
            { text: 'We ask for consistency: a regular commitment is more valuable than a single appearance.' },
          ],
          notes: [],
          boxes: [],
          cardHeading: '',
          cardText: '',
        },
      },
      cta(
        'Another way to help',
        'Not able to volunteer right now?',
        'Giving and partnership both extend the work — and both are needed just as much.',
        ['Donate', '/donate'],
        ['Partner With Us', '/partners'],
      ),
    ],
  },
  ...(['news', 'events', 'resources'] as const).map(
    (view): SeedPage => ({
      slug: view,
      title: 'News, Events & Resources',
      metaDescription:
        'News, upcoming events, past conferences and downloadable resources from the Innovation Association for Christian Educators.',
      sections: [
        {
          type: 'pageHero',
          background: 'navy',
          content: {
            variant: 'banner',
            breadcrumb: 'News & events',
            eyebrow: 'Newsroom',
            heading: 'What is happening in the work',
            body: 'Reports from trainings and outreaches, upcoming gatherings, past conference records and downloadable resources.',
            image: img('conference'),
          },
        },
        {
          type: 'newsHub',
          content: {
            view,
            tabs: [
              { key: 'news', label: 'News', href: '/news' },
              { key: 'events', label: 'Events', href: '/events' },
              { key: 'resources', label: 'Resources', href: '/resources' },
            ],
            searchPlaceholder: 'Search news…',
            newsEmptyTitle: 'The first stories are on their way.',
            newsEmptyText: 'News from our trainings, outreaches and conferences will be published here. Subscribe below to hear first.',
            eventsEmptyTitle: 'No upcoming events are listed yet.',
            eventsEmptyText:
              'Our trainings, forums and conferences are announced here as dates are confirmed. In the meantime, you can invite IACEC to your school or church.',
            conferencesHeading: 'Past conferences',
            resourcesEmptyTitle: 'Resources are being prepared.',
            resourcesEmptyText: 'Our organisational profile, forms, reports and teaching materials will be available here for download.',
          },
        },
        cta(
          'Stay informed',
          'Hear about trainings and events first.',
          'Join our mailing list for occasional news from the classroom, training invitations and prayer updates.',
          ['Contact us', '/contact'],
          ['Volunteer', '/volunteer'],
        ),
      ],
    }),
  ),
  {
    slug: 'donate',
    title: 'Donate',
    metaDescription:
      'Give to IACEC — general support, child sponsorship, teacher training, children’s outreach, family programmes and community outreach in Cameroon.',
    sections: [
      {
        type: 'pageHero',
        background: 'mist',
        content: {
          variant: 'split',
          breadcrumb: 'Donate',
          eyebrow: 'Give',
          heading: 'Your giving keeps a child in school and a teacher in training.',
          body: 'Every gift is directed to a named area of work — and every area is followed by people who know the child, the teacher or the family involved.',
          image: img('sponsorship'),
        },
      },
      {
        type: 'iconCards',
        content: {
          variant: 'top',
          source: 'donationFunds',
          eyebrow: 'Where your gift goes',
          heading: 'Choose the work you want to support',
          description: 'You can give to the area closest to your heart, or to general support which keeps the whole association moving.',
          items: [],
        },
      },
      {
        type: 'givingMethods',
        background: 'mist',
        content: {
          eyebrow: 'How to give',
          heading: 'Giving methods',
          description:
            'Bank and mobile money details appear here once they are confirmed by the association. Please contact us if you would like to give before then.',
          emptyTitle: 'Giving details are being finalised.',
          emptyText:
            'The association is confirming its bank and mobile money details for publication. In the meantime, you can register your giving interest below, or contact us directly and we will guide you.',
          contactLink: L('Contact the team', '/contact'),
        },
      },
      {
        type: 'formSection',
        background: 'white',
        anchor: 'give',
        content: {
          formKey: 'giving',
          layout: 'narrow',
          compact: false,
          eyebrow: 'Register your gift',
          heading: 'Tell us how you would like to give',
          description:
            'If you are giving from outside Cameroon, or would like to set up a regular gift, let us know and a coordinator will contact you.',
          bulletStyle: 'arrow',
          bullets: [],
          notes: [
            {
              title: 'Accountability.',
              text: 'Giving is used for the area you designate. Sponsorship gifts are recorded against a named child and reported back to the sponsor.',
            },
            {
              title: 'Privacy.',
              text: "We never publish a child's private details, and we never share your contact information with third parties.",
            },
          ],
          boxes: [],
          cardHeading: '',
          cardText: '',
        },
      },
    ],
  },
  {
    slug: 'contact',
    title: 'Contact Us',
    metaDescription:
      'Contact the Innovation Association for Christian Educators in Douala, Cameroon — general enquiries, programmes, sponsorship, volunteering and partnerships.',
    sections: [
      {
        type: 'pageHero',
        background: 'mist',
        content: {
          variant: 'split',
          breadcrumb: 'Contact',
          eyebrow: 'Contact us',
          heading: 'We would love to hear from you.',
          body: 'Whether you are a teacher, a parent, a church leader, a school, a sponsor or simply curious about the work — write to us.',
          image: img('community'),
        },
      },
      { type: 'contactCards', content: { emailLabel: 'Email', phoneLabel: 'Phone', whatsappLabel: 'WhatsApp', locationLabel: 'Where we are' } },
      {
        type: 'contactMain',
        background: 'mist',
        content: {
          formKey: 'contact',
          formHeading: 'Send a message',
          formText: 'Complete the form and a member of the team will respond as soon as possible.',
          eyebrow: 'Find us',
          heading: 'Douala, Cameroon',
          text: 'Douala, Cameroon. Visits are by appointment — please contact us before coming so that someone is available to receive you.',
          mapLinkLabel: 'Open in Google Maps',
          mapLinkAction: 'View',
          newsletterHeading: 'Join our mailing list',
          newsletterText: 'Occasional news, training invitations and prayer updates — nothing more.',
        },
      },
    ],
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    metaDescription:
      'How the Innovation Association for Christian Educators collects, uses and protects personal information, including our commitments to child protection and privacy.',
    sections: [
      {
        type: 'pageHero',
        background: 'mist',
        content: {
          variant: 'split',
          breadcrumb: 'Privacy policy',
          eyebrow: 'Privacy & child protection',
          heading: 'How we handle your information',
          body: 'IACEC is committed to handling personal information with care — and to protecting the privacy and dignity of every child we serve.',
          image: { src: '', alt: '' },
        },
      },
      {
        type: 'legal',
        content: {
          sections: [
            {
              heading: 'Who we are',
              body: p(
                'This website is operated by the Innovation Association for Christian Educators (IACEC), a Christian association based in Douala, Cameroon.',
                'You can contact us at any time using the details on our contact page.',
              ),
            },
            {
              heading: 'What information we collect',
              body: p(
                'We collect the information you choose to give us through our forms — for example your name, email address, phone number and the content of your message.',
                'Where a child sponsorship application is submitted, we collect the information necessary to assess the application, including details about the child and the caretaker.',
                'We also collect anonymous, aggregated information about how the website is used so that we can improve it.',
              ),
            },
            {
              heading: 'How we use your information',
              body: p(
                'To respond to your enquiry, application or request.',
                'To administer programmes, sponsorship, volunteering and partnerships.',
                'To send you news and updates, where you have asked to receive them. You may ask to be removed at any time.',
              ),
            },
            {
              heading: 'Child protection and privacy',
              body: p(
                'The privacy and protection of children is a primary concern for IACEC.',
                'We do not publish a child’s private documents, home address, family circumstances, school information, application documents, internal notes or private contact details.',
                'A child’s identifiable photograph or full name is published only where proper consent has been recorded. Where consent is not recorded, images are used in a way that does not identify the child.',
                'Sponsorship applications are visible only to authorised IACEC staff. They are never available to ordinary website editors, sponsors or the general public.',
              ),
            },
            {
              heading: 'Who can see your information',
              body: p(
                'Your information is seen only by IACEC staff and authorised volunteers who need it to carry out the work you have asked about.',
                'We do not sell your information, and we do not share it with third parties for marketing purposes.',
              ),
            },
            {
              heading: 'How long we keep information',
              body: p(
                'We keep enquiry and application information only for as long as it is needed for the purpose it was given, or as required by law.',
                'You may ask us to delete information you have given us, and we will do so where we are not required to keep it.',
              ),
            },
            {
              heading: 'Your choices',
              body: p(
                'You may ask to see the information we hold about you, ask us to correct it, or ask us to delete it.',
                'You may unsubscribe from our mailing list at any time by contacting us.',
              ),
            },
            {
              heading: 'Changes to this policy',
              body: p('We may update this policy from time to time. The current version will always be available on this page.'),
            },
          ],
          calloutHeading: 'Questions about this policy',
          calloutBody:
            'Write to us at <a href="mailto:info@iacecglobal.com">info@iacecglobal.com</a> and we will respond as soon as possible.',
        },
      },
    ],
  },
  {
    slug: 'templates/programme',
    title: 'Programme page template',
    isTemplate: true,
    sections: [
      {
        type: 'programmeBody',
        content: {
          ctaFallback: 'Talk to IACEC',
          allLabel: 'All programmes',
          glanceHeading: 'At a glance',
          pillarLabel: 'Pillar',
          whereLabel: 'Where',
          deliveryLabel: 'Delivery',
          audienceLabel: 'Audience',
          formatLabel: 'Format',
          frequencyLabel: 'Frequency',
          statusLabel: 'Status',
          glanceNote: 'Programmes are arranged with schools, churches and communities. Get in touch to discuss dates and logistics.',
          requestButton: L('Request this programme', '/contact'),
        },
      },
      { type: 'relatedProgrammes', background: 'mist', content: { eyebrow: 'Keep exploring', heading: 'Other IACEC programmes', viewAllLabel: 'View all' } },
      cta(
        'Get involved',
        'Help this work reach one more classroom.',
        'Give, volunteer or partner with us — each one extends the reach of this programme.',
        ['Donate', '/donate'],
        ['Volunteer', '/volunteer'],
      ),
    ],
  },
  {
    slug: 'templates/article',
    title: 'News article template',
    isTemplate: true,
    sections: [
      { type: 'articleBody', content: { backLabel: 'All news', byline: 'By' } },
      { type: 'moreNews', background: 'mist', content: { heading: 'More from IACEC', count: 2 } },
      cta(
        'Be part of it',
        'Stories like this begin with people who say yes.',
        'Partner with IACEC, sponsor a child, or volunteer your time and skills.',
        ['Partner With Us', '/partners'],
        ['Sponsor a Child', '/community-support#sponsor'],
      ),
    ],
  },
];
