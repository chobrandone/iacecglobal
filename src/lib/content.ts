import { cache } from 'react';
import { prisma } from './db';
import { defaultSettings, settingsSchema, type SiteSettings } from './settings-schema';

/**
 * Server-side data access for the public site. Everything visible on the site is read
 * through here; `cache` de-duplicates calls within one render.
 */

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const row = await prisma.siteSettings.findUnique({ where: { id: 1 } }).catch(() => null);
  const merged = { ...defaultSettings, ...((row?.data as object) ?? {}) };
  const parsed = settingsSchema.safeParse(merged);
  return (parsed.success ? parsed.data : merged) as SiteSettings;
});

export const getPage = cache(async (slug: string) => {
  return prisma.page.findUnique({
    where: { slug },
    include: { sections: { where: { visible: true }, orderBy: { order: 'asc' } } },
  });
});

export const getPillars = cache(() => prisma.pillar.findMany({ orderBy: { order: 'asc' } }));

export const getProgrammes = cache(() =>
  prisma.programme.findMany({ where: { published: true }, orderBy: { order: 'asc' } }),
);

export const getProgramme = cache((slug: string) =>
  prisma.programme.findFirst({ where: { slug, published: true } }),
);

export const getMilestones = cache(() => prisma.milestone.findMany({ orderBy: { order: 'asc' } }));
export const getSponsorshipSteps = cache(() => prisma.sponsorshipStep.findMany({ orderBy: { order: 'asc' } }));
export const getValues = cache(() => prisma.value.findMany({ orderBy: { order: 'asc' } }));
export const getDonationFunds = cache(() => prisma.donationFund.findMany({ orderBy: { order: 'asc' } }));
export const getVolunteerAreas = cache(() => prisma.volunteerArea.findMany({ orderBy: { order: 'asc' } }));
export const getPartnershipTypes = cache(() => prisma.partnershipType.findMany({ orderBy: { order: 'asc' } }));

/** Newsroom order: featured first, then the manual sort order. */
export const getNewsroomArticles = cache(() =>
  prisma.newsArticle.findMany({
    where: { published: true },
    orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { publishedAt: 'desc' }],
  }),
);

/** Latest articles by publication date (home page). */
export const getLatestArticles = cache((take: number) =>
  prisma.newsArticle.findMany({ where: { published: true }, orderBy: { publishedAt: 'desc' }, take }),
);

export const getArticle = cache((slug: string) =>
  prisma.newsArticle.findFirst({ where: { slug, published: true } }),
);

export const getEvents = cache(() =>
  prisma.event.findMany({ where: { published: true }, orderBy: { startsAt: 'asc' } }),
);
export const getConferences = cache(() =>
  prisma.conference.findMany({ where: { published: true }, orderBy: { order: 'asc' } }),
);
export const getResources = cache(() =>
  prisma.resource.findMany({ where: { published: true }, orderBy: [{ category: 'asc' }, { order: 'asc' }] }),
);
export const getTeam = cache(() =>
  prisma.teamMember.findMany({ where: { published: true }, orderBy: { order: 'asc' } }),
);
export const getTestimonies = cache(() =>
  prisma.testimony.findMany({ where: { approved: true }, orderBy: { order: 'asc' } }),
);
export const getPartners = cache(() =>
  prisma.partner.findMany({ where: { showPublic: true }, orderBy: { order: 'asc' } }),
);

export const getForm = cache((key: string) => prisma.formDefinition.findUnique({ where: { key } }));
