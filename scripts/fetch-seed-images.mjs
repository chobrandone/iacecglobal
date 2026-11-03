// Downloads the live site's images once and stores them as optimised WebP in public/media/seed.
// Usage: node scripts/fetch-seed-images.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const images = {
  hero: 'https://media.base44.com/images/public/6ae2451a79bcc865a2b681c7/45497794b_generated_f6f03611.png',
  training: 'https://media.base44.com/images/public/6ae2451a79bcc865a2b681c7/cf57dec2f_generated_37861d7f.png',
  children: 'https://media.base44.com/images/public/6ae2451a79bcc865a2b681c7/1155a6d27_generated_dcf7b8f1.png',
  family: 'https://media.base44.com/images/public/6ae2451a79bcc865a2b681c7/443ccf2c5_generated_bcfaffc0.png',
  community: 'https://media.base44.com/images/public/6ae2451a79bcc865a2b681c7/d8c547abe_generated_a0f81af5.png',
  sponsorship: 'https://media.base44.com/images/public/6ae2451a79bcc865a2b681c7/b6fdfeb5d_generated_60a7490d.png',
  conference: 'https://media.base44.com/images/public/6ae2451a79bcc865a2b681c7/f45b7030f_generated_ff32b174.png',
  volunteers: 'https://media.base44.com/images/public/6ae2451a79bcc865a2b681c7/175bc4a14_generated_556324ee.png',
  educator: 'https://media.base44.com/images/public/6ae2451a79bcc865a2b681c7/071448e2c_generated_004e8ca5.png',
  news: 'https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png',
};

const outDir = path.join(process.cwd(), 'public', 'media', 'seed');
await mkdir(outDir, { recursive: true });

for (const [key, url] of Object.entries(images)) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const input = Buffer.from(await res.arrayBuffer());
  const out = await sharp(input).resize({ width: 1800, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  await writeFile(path.join(outDir, `${key}.webp`), out);
  const meta = await sharp(out).metadata();
  console.log(`${key}.webp  ${meta.width}×${meta.height}  ${(out.length / 1024).toFixed(0)} KB`);
}
