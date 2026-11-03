import { img, seedImagePath } from './images';

const p = (...paras: string[]) => paras.map((x) => `<p>${x}</p>`).join('');

export const pillars = [
  { number: '01', title: 'Equipping Teachers', short: 'Training teachers to teach Christianly in any classroom.', link: '/educators', icon: 'GraduationCap' },
  { number: '02', title: 'Reaching Children', short: 'Teaching children to know, love and obey God, and to stay safe.', link: '/students-youth', icon: 'Sparkles' },
  { number: '03', title: 'Strengthening Families', short: 'Helping parents and caretakers raise children of good character at home.', link: '/parents-family', icon: 'House' },
  {
    number: '04',
    title: 'Caring for Children in Need',
    short: 'Schooling, material support, care and personal follow-up through sponsorship.',
    link: '/community-support',
    icon: 'HandHeart',
  },
  {
    number: '05',
    title: 'Partnering with Churches & Schools',
    short: 'Working with churches, schools and Christian networks to advance Christian education.',
    link: '/partners',
    icon: 'Church',
  },
];

export const programmes = [
  {
    title: 'Teacher Training in Biblical Integration',
    slug: 'teacher-training-in-biblical-integration',
    pillar: 'teachers',
    summary:
      'Training school teachers and head teachers to integrate Christian principles into education — in lesson planning, classroom culture and discipline.',
    description: p(
      'Children spend more waking hours with their teachers than with almost anyone else. This training helps teachers and head teachers bring Christian conviction into that everyday influence: how a lesson is planned, how a classroom is ordered, how a child is corrected and encouraged.',
      'The training is practical. Teachers work through their own subject areas and discover how to teach with a Christian mind whether or not the Bible can be opened in the classroom. Follow-up visits help the training settle into daily practice.',
    ),
    image: 'training' as const,
    ctaLabel: 'Book a Training',
    ctaLink: '/educators#book',
    featured: true,
  },
  {
    title: 'Lifestyle Evangelism Workshop',
    slug: 'lifestyle-evangelism-workshop',
    pillar: 'teachers',
    summary:
      'Helping teachers demonstrate Christian faith through character, integrity, excellence and love — where words alone are not permitted.',
    description: p(
      'A teacher who is patient, honest, prepared and kind is already teaching the gospel. This workshop helps teachers understand that their character is part of the curriculum, and gives them practical ways to live consistently before children.',
      'It is especially suited to schools and settings where the Christian message cannot be taught directly, and to teachers who want their daily conduct to commend the faith they hold.',
    ),
    image: 'educator' as const,
    ctaLabel: 'Book a Training',
    ctaLink: '/educators#book',
  },
  {
    title: 'Children’s Outreach in Schools',
    slug: 'childrens-outreach-in-schools',
    pillar: 'children',
    summary: 'Teaching pupils about God, a personal relationship with Him, personal safety and obedience — at the child’s own level.',
    description: p(
      'Our children’s outreach teams visit schools by invitation, with the school’s leadership present, to teach children in a way they can understand. Children hear who God is, what it means to know Him personally, how to recognise danger and stay safe, and how to obey God in everyday decisions.',
      'Sessions are age-appropriate, interactive and short enough for children to hold on to. We work with the school, never around it.',
    ),
    image: 'children' as const,
    ctaLabel: 'Invite the Team',
    ctaLink: '/students-youth#invite',
    featured: true,
  },
  {
    title: 'Sunday School Outreach',
    slug: 'sunday-school-outreach',
    pillar: 'children',
    summary: 'Reaching Sunday school children through church-authorised visits, alongside the teachers who know them week by week.',
    description: p(
      'We visit Sunday schools with the authorisation of the church, serving the teachers who already give their time week after week. Children are taught, encouraged and helped to understand the faith they are growing into.',
      'Where a church wishes, we also help Sunday school teachers with materials, lesson planning and classroom practice.',
    ),
    image: 'children' as const,
    ctaLabel: 'Invite the Team',
    ctaLink: '/students-youth#invite',
  },
  {
    title: 'Child Safety Teaching',
    slug: 'child-safety-teaching',
    pillar: 'children',
    summary: 'Helping children recognise danger, understand how to remain safe and know when to seek help from a trusted adult.',
    description: p(
      'Child safety teaching is delivered in an age-appropriate way, never using fear, and always with the knowledge of the school or church. Children learn to recognise unsafe situations, to say no, and to tell a trusted adult.',
      'The material is designed to sit alongside the school’s own safeguarding practice rather than replace it.',
    ),
    image: 'children' as const,
    ctaLabel: 'Invite the Team',
    ctaLink: '/students-youth#invite',
  },
  {
    title: 'Christian Parents and Teachers Forum',
    slug: 'christian-parents-and-teachers-forum',
    pillar: 'families',
    summary:
      'Connecting parents and teachers around Christian child development, so the two most important adults in a child’s life can talk to one another.',
    description: p(
      'The Forum brings parents, caretakers, teachers and church children’s workers into the same room. It was established when IACEC was relaunched in 2023, and it remains a place to ask honest questions and share practical experience.',
      'Sessions address the real pressures of raising and teaching children, with space for discussion rather than lectures alone.',
    ),
    image: 'family' as const,
    ctaLabel: 'Join the Forum',
    ctaLink: '/parents-family#forum',
  },
  {
    title: 'Family & Community Outreach',
    slug: 'family-and-community-outreach',
    pillar: 'families',
    summary: 'Reaching fathers, mothers, couples and whole communities with practical, Christ-centred teaching on family life.',
    description: p(
      'We go to where families already gather — churches, schools and neighbourhood meetings — and serve the community that is there. Sessions address parenting, marriage, character formation and the place of faith at home.',
      'Outreaches are arranged with local leadership, so that the work continues in the relationships that remain after the visit.',
    ),
    image: 'community' as const,
    ctaLabel: 'Invite IACEC',
    ctaLink: '/students-youth#invite',
  },
  {
    title: 'Child Sponsorship Programme',
    slug: 'child-sponsorship-programme',
    pillar: 'care',
    summary: 'Supporting children who have lost one or both parents through education, material assistance and personal follow-up.',
    description: p(
      'Not just school fees. A family that follows up. Each child is referred, verified and visited at home before being matched with a sponsor. The sponsor supports education and material needs; IACEC follows the child’s schooling and wellbeing and reports back.',
      'Every child is supported by one sponsor, two engaged family members and two IACEC members — a small, accountable circle around a real child. The programme begins in 2026, initially targeting twelve children.',
    ),
    image: 'sponsorship' as const,
    ctaLabel: 'Sponsor a Child',
    ctaLink: '/community-support#sponsor',
    featured: true,
  },
  {
    title: 'Conferences & Seminars',
    slug: 'conferences-and-seminars',
    pillar: 'partnerships',
    summary: 'Periodic gatherings for educators, parents and church leaders around Christian education.',
    description: p(
      'Our conferences bring educators, parents and church leaders together for teaching, worship and conversation about Christian education in Cameroon.',
      'Announcements, dates and reports are published in our news and events section as they are confirmed.',
    ),
    image: 'conference' as const,
    ctaLabel: 'Register',
    ctaLink: '/events',
  },
  {
    title: 'School & Church Partnerships',
    slug: 'school-and-church-partnerships',
    pillar: 'partnerships',
    summary: 'Helping schools and churches adopt and strengthen Christian education for the long term.',
    description: p(
      'A single training day is a beginning, not an end. We work with schools and churches who want to build Christian education into their culture — through repeated training, follow-up visits and shared planning.',
      'Partnerships are agreed in writing, with named people responsible on both sides, so that expectations are clear and the work can be reviewed honestly.',
    ),
    image: 'conference' as const,
    ctaLabel: 'Partner With Us',
    ctaLink: '/partners#become-a-partner',
  },
].map((x, order) => ({
  ...x,
  coverImage: seedImagePath(x.image),
  coverAlt: x.title,
  order,
  featured: x.featured ?? false,
}));

export const values = [
  { title: 'Christ First', description: 'God is at the centre of every lesson, home and programme we serve.', icon: 'Cross' },
  { title: 'Integrity', description: 'Teachers and parents live what they teach. Children learn from lifestyle more than from words.', icon: 'ShieldCheck' },
  { title: 'Love', description: 'Every child is seen, valued and cared for as a child of God.', icon: 'Heart' },
  { title: 'Family', description: 'School and home work together to raise the child — never apart.', icon: 'Users' },
  {
    title: 'Innovation',
    description:
      "Finding practical and innovative ways to bring God's truth into classrooms, including environments where the Bible cannot be taught directly.",
    icon: 'Lightbulb',
  },
  { title: 'Faithfulness', description: 'Maintaining long-term commitment to children, families and partners through consistent follow-up.', icon: 'Anchor' },
];

export const milestones = [
  {
    period: 'c. 1990',
    title: 'Roots in community service',
    description:
      'The founder’s work begins through community service, laying the foundations of what would later become the New Hope Foundation for Culture and Service.',
    era: 'Early Roots',
  },
  {
    period: '1991',
    title: 'A first school, opened with daily prayer',
    description: 'The founder opens a first school where prayer begins each day — the pattern of faith and learning that still shapes the work.',
    era: 'Early Roots',
  },
  {
    period: 'After 2008',
    title: 'Christian education and leadership initiatives',
    description:
      'Growing participation in Christian education and leadership initiatives, widening the circle of people committed to the same vision.',
    era: 'Growing Years',
  },
  {
    period: 'c. 2008–2018',
    title: 'Networking in Cameroon',
    description:
      'Christian education networking and work connected with ACSI in Cameroon, strengthening relationships between schools, teachers and leaders.',
    era: 'Growing Years',
  },
  {
    period: '2011–2016',
    title: 'Training teachers to teach Christianly',
    description: 'A sustained focus on training teachers to teach Christianly — not as an event, but as a practice to be built over years.',
    era: 'Growing Years',
  },
  {
    period: '2023',
    title: 'IACEC relaunched with foundation members',
    description: 'The association is relaunched with its first foundation members, and the Christian Parents and Teachers Forum begins.',
    era: 'IACEC Today',
  },
  {
    period: '2023–2024',
    title: 'Teacher training in biblical integration',
    description: 'Teacher training in biblical integration and lifestyle evangelism becomes a central part of the association’s work.',
    era: 'IACEC Today',
  },
  {
    period: '2025',
    title: 'School and Sunday school outreach expanded',
    description:
      'Children’s outreach expands in schools and Sunday schools, always by invitation and in partnership with local leadership.',
    era: 'IACEC Today',
  },
  {
    period: '2026',
    title: 'Child sponsorship begins',
    description: 'The Child Sponsorship Programme begins, initially targeting twelve children who have lost one or both parents.',
    era: 'IACEC Today',
  },
];

export const sponsorshipSteps = [
  { number: '01', title: 'A child is referred', description: 'A church, school or community member refers a child who has lost one or both parents.' },
  { number: '02', title: 'The caretaker applies', description: 'The caretaker completes an intake form describing the child and the family situation.' },
  { number: '03', title: 'We verify and visit', description: 'IACEC verifies the application and conducts a home visit before any commitment is made.' },
  { number: '04', title: 'A sponsor is matched', description: 'The child is matched with a sponsor whose support fits the child’s needs.' },
  { number: '05', title: 'Support begins', description: 'The sponsor supports education and material needs, and joins the child in fellowship.' },
  { number: '06', title: 'We follow up and report', description: 'IACEC follows the child’s schooling and wellbeing and reports back to the sponsor.' },
];

const newsImage = img('news', '');

export const news = [
  {
    title: 'A new chapter: IACEC relaunched with its first foundation members',
    slug: 'iac-s-relaunch-2023',
    category: 'Update',
    publishedAt: new Date('2023-06-01T09:00:00Z'),
    featured: true,
    sortOrder: 0,
    excerpt:
      'In 2023 the association was relaunched with its first foundation members, gathering educators, parents and church leaders around a single purpose.',
    body: p(
      'In 2023 the Innovation Association for Christian Educators was relaunched with its first foundation members, gathering educators, parents and church leaders around a single purpose: to fulfil the Great Commission through the classroom and the home.',
      'The relaunch also saw the beginning of the Christian Parents and Teachers Forum, a gathering that connects parents and teachers around Christian child development.',
      'The association’s roots reach back to approximately 1990 through the New Hope Foundation for Culture and Service. The relaunch marked a new chapter for that same commitment, now carried under the IACEC identity.',
    ),
  },
  {
    title: 'Training teachers in biblical integration and lifestyle evangelism',
    slug: 'teacher-training-biblical-integration',
    category: 'Report',
    publishedAt: new Date('2024-06-01T09:00:00Z'),
    featured: false,
    sortOrder: 1,
    excerpt: 'Between 2023 and 2024 the association focused on training teachers in biblical integration and lifestyle evangelism.',
    body: p(
      'Teacher training has been central to IACEC’s work since the association was relaunched. Between 2023 and 2024, the focus was training in biblical integration and lifestyle evangelism.',
      'Biblical integration helps a teacher bring a Christian mind to their subject and their classroom — in lesson planning, in discipline and in the way they speak to children. Lifestyle evangelism addresses the other half of the same calling: that character, integrity and love teach as much as words do.',
      'This matters most in classrooms where the Bible cannot be taught directly. There, a faithful teacher is the message.',
    ),
  },
  {
    title: 'Child sponsorship: twelve children to begin with',
    slug: 'child-sponsorship-begins-2026',
    category: 'News',
    publishedAt: new Date('2026-01-15T09:00:00Z'),
    featured: false,
    sortOrder: 2,
    excerpt: 'The Child Sponsorship Programme begins in 2026, initially targeting twelve children who have lost one or both parents.',
    body: p(
      'Our Child Sponsorship Programme begins in 2026, initially targeting twelve children. It is built around a simple conviction: not just school fees, but a family that follows up.',
      'Every child is referred and then verified, including a home visit by our team. Once approved, the child is matched with a sponsor. The sponsor supports education and material needs; IACEC follows the child’s schooling and wellbeing and reports back.',
      'Each child is supported by one sponsor, two engaged family members and two IACEC members — a small, accountable circle around a child who is known by name.',
      'Because these children are trusting us with their private circumstances, sponsorship information is never published. Applications are seen only by authorised IACEC staff.',
    ),
  },
].map((n) => ({ ...n, coverImage: newsImage.src, coverAlt: '', author: 'IACEC', showDate: false, published: true }));

export const donationFunds = [
  { title: 'General Support', description: 'Sustain the everyday work of the association, from administration to follow-up visits.' },
  { title: 'Child Sponsorship', description: 'School fees, books, uniforms and personal follow-up for a child who has lost a parent.' },
  { title: 'Teacher Training', description: 'Help a teacher or head teacher attend training in biblical integration.' },
  { title: 'Children’s Outreach', description: 'Take a children’s outreach team into a school or Sunday school.' },
  { title: 'Family Programmes', description: 'Support parenting sessions, the Parents and Teachers Forum and family follow-up.' },
  { title: 'Community Outreach', description: 'Reach fathers, mothers, couples and communities with practical Christian care.' },
].map((d) => ({ ...d, icon: 'HeartHandshake' }));

export const volunteerAreas = [
  { title: 'Training support', description: 'Help set up venues, register teachers and prepare materials during a training day.' },
  { title: 'Children’s outreach', description: 'Assist a children’s team with songs, storytelling, games and small-group activities.' },
  { title: 'Administration & logistics', description: 'Support follow-up visits, record keeping and the practical running of programmes.' },
  { title: 'Professional skills', description: 'Offer teaching, translation, design, photography (with consent), finance or legal skills.' },
  { title: 'Prayer & encouragement', description: 'Join a team of people committed to praying consistently for children, teachers and families.' },
];

export const partnershipTypes = [
  { title: 'Churches', description: 'Host a children’s outreach, send your Sunday school teachers for training, or adopt a local school.' },
  { title: 'Schools', description: 'Invite a training for your teaching staff or a values-based outreach for your pupils.' },
  { title: 'Companies', description: 'Support school materials, sponsorship or training logistics for a defined programme.' },
  { title: 'Foundations & institutions', description: 'Co-design education and child wellbeing initiatives with measurable follow-up.' },
  { title: 'Individuals', description: 'Give, sponsor a child, volunteer your skills or open a door for the work in your community.' },
];
