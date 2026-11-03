/* eslint-disable no-console */
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { PrismaClient, type Prisma } from '@prisma/client';
import { defaultSettings } from '../src/lib/settings-schema';
import {
  donationFunds,
  milestones,
  news,
  partnershipTypes,
  pillars,
  programmes,
  sponsorshipSteps,
  values,
  volunteerAreas,
} from './seed-data/collections';
import { forms } from './seed-data/forms';
import { seedImages, seedImagePath } from './seed-data/images';
import { seedPages } from './seed-data/pages';
import { pageSeo } from './seed-data/seo';

const prisma = new PrismaClient();
const json = (v: unknown) => v as Prisma.InputJsonValue;

/**
 * Fills an empty database with the live site's content. Content tables are only written when
 * they are empty, so re-running the seed never overwrites edits made in the admin.
 * Pass --reset to replace all content (users and submissions are kept).
 */
async function main() {
  const reset = process.argv.includes('--reset');

  if (reset) {
    console.log('Resetting content tables…');
    await prisma.$transaction([
      prisma.section.deleteMany(),
      prisma.page.deleteMany(),
      prisma.pillar.deleteMany(),
      prisma.programme.deleteMany(),
      prisma.value.deleteMany(),
      prisma.milestone.deleteMany(),
      prisma.sponsorshipStep.deleteMany(),
      prisma.newsArticle.deleteMany(),
      prisma.donationFund.deleteMany(),
      prisma.volunteerArea.deleteMany(),
      prisma.partnershipType.deleteMany(),
      prisma.formDefinition.deleteMany(),
      prisma.siteSettings.deleteMany(),
    ]);
  }

  // Settings
  await prisma.siteSettings.upsert({ where: { id: 1 }, create: { id: 1, data: json(defaultSettings) }, update: {} });

  // Media library entries for the seeded photographs
  for (const [key, image] of Object.entries(seedImages)) {
    const url = seedImagePath(key as keyof typeof seedImages);
    const file = path.join(process.cwd(), 'public', url);
    if (!existsSync(file)) {
      console.warn(`  ! ${url} is missing — run "node scripts/fetch-seed-images.mjs"`);
      continue;
    }
    await prisma.media.upsert({
      where: { key: `seed/${key}.webp` },
      create: {
        key: `seed/${key}.webp`,
        url,
        filename: `${key}.webp`,
        mimeType: 'image/webp',
        size: statSync(file).size,
        alt: image.alt,
      },
      update: {},
    });
  }

  // Logo files (public/media/brand, built by scripts/make-logo.mjs)
  const brand = [
    { file: 'iacec-logo.png', alt: 'IACEC — Innovation Association for Christian Educators' },
    { file: 'iacec-logo-full.png', alt: 'IACEC — Raising a God-loving generation.' },
    { file: 'iacec-logo-light.png', alt: 'IACEC — Raising a God-loving generation. (white version)' },
    { file: 'iacec-emblem.png', alt: 'IACEC emblem' },
  ];
  for (const b of brand) {
    const file = path.join(process.cwd(), 'public', 'media', 'brand', b.file);
    if (!existsSync(file)) continue;
    await prisma.media.upsert({
      where: { key: `seed/brand/${b.file}` },
      create: { key: `seed/brand/${b.file}`, url: `/media/brand/${b.file}`, filename: b.file, mimeType: 'image/png', size: statSync(file).size, alt: b.alt },
      update: {},
    });
  }

  // Pages and sections
  if (reset || (await prisma.page.count()) === 0) {
    for (const page of seedPages) {
      await prisma.page.create({
        data: {
          slug: page.slug,
          title: page.title,
          seoTitle: page.seoTitle ?? page.title,
          metaDescription: page.metaDescription,
          isTemplate: page.isTemplate ?? false,
          sections: {
            create: page.sections.map((s, order) => ({
              type: s.type,
              order,
              background: s.background ?? 'white',
              anchor: s.anchor,
              label: s.label,
              content: json(s.content),
            })),
          },
        },
      });
    }
    console.log(`  ✓ ${seedPages.length} pages`);
  }

  // Search titles and keywords. Pages that already have keywords, or a title set in the admin, are left alone.
  for (const [slug, seo] of Object.entries(pageSeo)) {
    const page = await prisma.page.findUnique({ where: { slug } });
    if (!page || page.keywords) continue;
    const untouched = !page.seoTitle || page.seoTitle === page.title || page.seoTitle === seedPages.find((x) => x.slug === slug)?.seoTitle;
    await prisma.page.update({ where: { slug }, data: { keywords: seo.keywords, seoTitle: untouched ? seo.seoTitle : page.seoTitle } });
  }

  const fill = async (label: string, count: () => Promise<number>, create: () => Promise<unknown>) => {
    if (reset || (await count()) === 0) {
      await create();
      console.log(`  ✓ ${label}`);
    }
  };

  await fill('pillars', () => prisma.pillar.count(), () => prisma.pillar.createMany({ data: pillars.map((x, order) => ({ ...x, order })) }));
  await fill('programmes', () => prisma.programme.count(), () =>
    prisma.programme.createMany({
      data: programmes.map(({ image: _image, ...x }) => ({ ...x, gallery: json([]) })),
    }),
  );
  await fill('values', () => prisma.value.count(), () => prisma.value.createMany({ data: values.map((x, order) => ({ ...x, order })) }));
  await fill('milestones', () => prisma.milestone.count(), () =>
    prisma.milestone.createMany({ data: milestones.map((x, order) => ({ ...x, order })) }),
  );
  await fill('sponsorship steps', () => prisma.sponsorshipStep.count(), () =>
    prisma.sponsorshipStep.createMany({ data: sponsorshipSteps.map((x, order) => ({ ...x, order })) }),
  );
  await fill('news', () => prisma.newsArticle.count(), () => prisma.newsArticle.createMany({ data: news }));
  await fill('donation funds', () => prisma.donationFund.count(), () =>
    prisma.donationFund.createMany({ data: donationFunds.map((x, order) => ({ ...x, order })) }),
  );
  await fill('volunteer areas', () => prisma.volunteerArea.count(), () =>
    prisma.volunteerArea.createMany({ data: volunteerAreas.map((x, order) => ({ ...x, order })) }),
  );
  await fill('partnership types', () => prisma.partnershipType.count(), () =>
    prisma.partnershipType.createMany({ data: partnershipTypes.map((x, order) => ({ ...x, order })) }),
  );

  // Forms
  for (const form of forms) {
    const { fields, ...rest } = form;
    await prisma.formDefinition.upsert({
      where: { key: form.key },
      create: {
        ...rest,
        restricted: rest.restricted ?? false,
        sponsorship: rest.sponsorship ?? false,
        recipients: [],
        fields: json(fields),
      },
      update: {},
    });
  }
  console.log(`  ✓ ${forms.length} forms`);

  // First administrator
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: { email, name: process.env.ADMIN_NAME || 'Administrator', role: 'ADMIN', passwordHash: await bcrypt.hash(password, 12) },
      });
      console.log(`  ✓ administrator ${email}`);
    }
  } else {
    console.warn('  ! ADMIN_EMAIL / ADMIN_PASSWORD not set — no administrator created');
  }
}

main()
  .then(() => console.log('Seed complete.'))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
