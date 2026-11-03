// Images used on the live site, downloaded into public/media/seed by scripts/fetch-seed-images.mjs.
// Alt texts are copied from the live site.
export const seedImages = {
  hero: {
    source: 'https://media.base44.com/images/public/6ae2451a79bcc865a2b681c7/45497794b_generated_f6f03611.png',
    alt: 'A teacher guiding a pupil through an exercise book in a sunlit classroom in Douala',
  },
  training: {
    source: 'https://media.base44.com/images/public/6ae2451a79bcc865a2b681c7/cf57dec2f_generated_37861d7f.png',
    alt: 'Teachers taking notes during an IACEC training workshop',
  },
  children: {
    source: 'https://media.base44.com/images/public/6ae2451a79bcc865a2b681c7/1155a6d27_generated_dcf7b8f1.png',
    alt: 'Children laughing together in a school courtyard',
  },
  family: {
    source: 'https://media.base44.com/images/public/6ae2451a79bcc865a2b681c7/443ccf2c5_generated_bcfaffc0.png',
    alt: 'Parents reading with their children at home',
  },
  community: {
    source: 'https://media.base44.com/images/public/6ae2451a79bcc865a2b681c7/d8c547abe_generated_a0f81af5.png',
    alt: 'A community gathering of parents, teachers and church members',
  },
  sponsorship: {
    source: 'https://media.base44.com/images/public/6ae2451a79bcc865a2b681c7/b6fdfeb5d_generated_60a7490d.png',
    alt: 'A sponsored pupil holding her schoolbooks',
  },
  conference: {
    source: 'https://media.base44.com/images/public/6ae2451a79bcc865a2b681c7/f45b7030f_generated_ff32b174.png',
    alt: 'A speaker addressing educators at a conference',
  },
  volunteers: {
    source: 'https://media.base44.com/images/public/6ae2451a79bcc865a2b681c7/175bc4a14_generated_556324ee.png',
    alt: 'Volunteers preparing school materials',
  },
  educator: {
    source: 'https://media.base44.com/images/public/6ae2451a79bcc865a2b681c7/071448e2c_generated_004e8ca5.png',
    alt: 'A teacher standing at the front of his classroom',
  },
  news: {
    source: 'https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png',
    alt: 'IACEC news',
  },
} as const;

export type SeedImageKey = keyof typeof seedImages;

export const seedImagePath = (key: SeedImageKey) => `/media/seed/${key}.webp`;

export const img = (key: SeedImageKey, alt?: string) => ({ src: seedImagePath(key), alt: alt ?? seedImages[key].alt });
