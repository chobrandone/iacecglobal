// Builds the logo variants used by the site from the master artwork (white background).
// Usage: node scripts/make-logo.mjs <path-to-logo-image>
//  - public/media/brand/iacec-logo.png        emblem + IACEC (header, mobile menu)
//  - public/media/brand/iacec-logo-full.png   with the tagline
//  - public/media/brand/iacec-logo-light.png  white version for the navy footer (gold kept)
//  - public/media/brand/iacec-emblem.png      square emblem (favicon / admin)
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const src = process.argv[2];
if (!src) throw new Error('Pass the path to the logo image.');
const out = path.join(process.cwd(), 'public', 'media', 'brand');
await mkdir(out, { recursive: true });

const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;

/** "Colour to alpha" against white, so anti-aliased edges stay smooth on any background. */
function toRgba({ light = false } = {}) {
  const outBuf = Buffer.alloc(W * H * 4);
  for (let p = 0; p < W * H; p++) {
    const r = data[p * 3], g = data[p * 3 + 1], b = data[p * 3 + 2];
    const a = 1 - Math.min(r, g, b) / 255;
    let [R, G, B] = a > 0.004 ? [r, g, b].map((c) => Math.round((c - 255 * (1 - a)) / a)) : [0, 0, 0];
    if (light && B > R + 15) [R, G, B] = [255, 255, 255]; // blues → white, gold stays gold
    outBuf[p * 4] = R;
    outBuf[p * 4 + 1] = G;
    outBuf[p * 4 + 2] = B;
    outBuf[p * 4 + 3] = Math.round(Math.min(1, a * 1.08) * 255);
  }
  return sharp(outBuf, { raw: { width: W, height: H, channels: 4 } });
}

/** Bounding box of visible pixels within a region. */
function bbox(x0, y0, x1, y1) {
  let minx = x1, maxx = x0, miny = y1, maxy = y0;
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      const i = (y * W + x) * 3;
      if (data[i] + data[i + 1] + data[i + 2] < 700) {
        minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y);
      }
    }
  const pad = 4;
  return { left: Math.max(0, minx - pad), top: Math.max(0, miny - pad), width: Math.min(W, maxx + pad) - Math.max(0, minx - pad), height: Math.min(H, maxy + pad) - Math.max(0, miny - pad) };
}

// Rows: the emblem and wordmark end before the tagline; find the first empty row band.
const rowInk = (y) => { let n = 0; for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; if (data[i] + data[i + 1] + data[i + 2] < 700) n++; } return n; };
const full = bbox(0, 0, W, H);
let split = full.top + Math.round(full.height * 0.55);
while (split < full.top + full.height && rowInk(split) > 0) split++;
const mark = bbox(0, 0, W, split);
// Emblem: columns left of the first empty column gap after the emblem.
const colInk = (x) => { let n = 0; for (let y = mark.top; y < mark.top + mark.height; y++) { const i = (y * W + x) * 3; if (data[i] + data[i + 1] + data[i + 2] < 700) n++; } return n; };
let gap = mark.left + Math.round(mark.width * 0.2);
while (gap < W && colInk(gap) > 0) gap++;
const emblem = bbox(0, 0, gap, split);

const save = async (img, region, name, height) => {
  const buf = await img.extract(region).png().toBuffer();
  await sharp(buf).resize({ height, withoutEnlargement: true }).png({ compressionLevel: 9 }).toFile(path.join(out, name));
  const m = await sharp(path.join(out, name)).metadata();
  console.log(`${name}  ${m.width}×${m.height}`);
};

await save(toRgba(), mark, 'iacec-logo.png', 240);
await save(toRgba(), full, 'iacec-logo-full.png', 360);
await save(toRgba({ light: true }), full, 'iacec-logo-light.png', 360);
const side = Math.max(emblem.width, emblem.height);
const square = { left: emblem.left - Math.floor((side - emblem.width) / 2), top: emblem.top - Math.floor((side - emblem.height) / 2), width: side, height: side };
const emblemBuf = await toRgba().extract(emblem).png().toBuffer();
// sharp resizes before compositing within one pipeline, so compose first, then resize.
const squareBuf = await sharp({ create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: emblemBuf, left: emblem.left - square.left, top: emblem.top - square.top }])
  .png()
  .toBuffer();
await sharp(squareBuf).resize(256, 256).png().toFile(path.join(out, 'iacec-emblem.png'));
console.log('iacec-emblem.png  256×256');
