import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib';

const WIDTH = 595.28;
const HEIGHT = 841.89;
export const MARGIN = 42;
const TOP = HEIGHT - 92;
const BOTTOM = 46;
export const CONTENT = WIDTH - MARGIN * 2;

const NAVY = rgb(2 / 255, 38 / 255, 103 / 255);
const GOLD = rgb(206 / 255, 148 / 255, 40 / 255);
const INK = rgb(0.12, 0.14, 0.19);
const MUTED = rgb(0.42, 0.45, 0.52);
const LINE = rgb(0.72, 0.75, 0.8);

/** The built-in PDF fonts cover Western European text. Other letters, including Cameroonian ones, become their nearest plain letters rather than break the file. */
function printable(text: string) {
  return text
    .replace(/[\r\t]/g, ' ')
    .replace(/→/g, '->')
    .replace(/[ŋŊɛƐɔƆəƏ]/g, (c) => ({ ŋ: 'ng', Ŋ: 'Ng', ɛ: 'e', Ɛ: 'E', ɔ: 'o', Ɔ: 'O', ə: 'e', Ə: 'E' })[c] ?? c)
    .replace(/[^\x20-\x7E\xA0-\xFF–—‘’“”•\n]/g, (c) => c.normalize('NFKD').replace(/[^\x20-\x7E]/g, '') || '?');
}

/** A4 pages on the IACEC letterhead, with a running position. */
export class Sheet {
  private page!: PDFPage;
  y = TOP;

  private constructor(
    private doc: PDFDocument,
    private regular: PDFFont,
    private bold: PDFFont,
    private logo: PDFImage | null,
    private title: string,
    private footer: string,
  ) {
    this.newPage();
  }

  static async create(title: string, footer: string) {
    const doc = await PDFDocument.create();
    doc.setTitle(title);
    doc.setAuthor('Innovation Association for Christian Educators');
    const [regular, bold] = await Promise.all([doc.embedFont(StandardFonts.Helvetica), doc.embedFont(StandardFonts.HelveticaBold)]);
    const png = await readFile(path.join(process.cwd(), 'public', 'media', 'brand', 'iacec-logo.png')).catch(() => null);
    return new Sheet(doc, regular, bold, png ? await doc.embedPng(png) : null, title, footer);
  }

  private newPage() {
    this.page = this.doc.addPage([WIDTH, HEIGHT]);
    if (this.logo) {
      const height = 34;
      this.page.drawImage(this.logo, { x: MARGIN, y: HEIGHT - 66, width: height * (this.logo.width / this.logo.height), height });
    } else {
      this.page.drawText('IACEC', { x: MARGIN, y: HEIGHT - 58, size: 20, font: this.bold, color: NAVY });
    }
    const right = (text: string, y: number, font: PDFFont, size: number, color = MUTED) =>
      this.page.drawText(text, { x: WIDTH - MARGIN - font.widthOfTextAtSize(text, size), y, size, font, color });
    right('Innovation Association for Christian Educators', HEIGHT - 44, this.regular, 8);
    right('Douala, Cameroon · info@iacecglobal.com', HEIGHT - 55, this.regular, 8);
    right(printable(this.title), HEIGHT - 68, this.bold, 10, NAVY);
    this.page.drawRectangle({ x: MARGIN, y: HEIGHT - 78, width: CONTENT, height: 1.5, color: GOLD });
    this.y = TOP;
  }

  /** Starts a new page if the next block will not fit. */
  need(height: number) {
    if (this.y - height < BOTTOM) this.newPage();
  }

  private wrap(text: string, font: PDFFont, size: number, width: number) {
    const lines: string[] = [];
    for (const paragraph of printable(text).split('\n')) {
      let line = '';
      for (const word of paragraph.split(' ')) {
        const next = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(next, size) <= width) line = next;
        else {
          if (line) lines.push(line);
          line = word;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  text(text: string, options: { size?: number; bold?: boolean; muted?: boolean; x?: number; width?: number } = {}) {
    const { size = 10, bold = false, muted = false, x = MARGIN, width = CONTENT } = options;
    const font = bold ? this.bold : this.regular;
    for (const line of this.wrap(text, font, size, width)) {
      this.need(size + 4);
      this.page.drawText(line, { x, y: this.y - size, size, font, color: muted ? MUTED : INK });
      this.y -= size + 3.5;
    }
  }

  heading(text: string) {
    this.need(40);
    this.y -= 10;
    this.page.drawText(printable(text), { x: MARGIN, y: this.y - 12, size: 12, font: this.bold, color: NAVY });
    this.y -= 20;
  }

  subheading(text: string) {
    this.need(26);
    this.y -= 3;
    this.page.drawText(printable(text), { x: MARGIN, y: this.y - 9.5, size: 9.5, font: this.bold, color: NAVY });
    this.y -= 15;
  }

  /** A label and its answer, side by side. */
  row(label: string, value: string) {
    const labelWidth = 190;
    const labelLines = this.wrap(label, this.regular, 9, labelWidth - 10);
    const valueLines = this.wrap(value, this.regular, 9.5, CONTENT - labelWidth);
    this.need(Math.max(labelLines.length, valueLines.length) * 12.5 + 3);
    const top = this.y;
    labelLines.forEach((l, i) => this.page.drawText(l, { x: MARGIN, y: top - 9 - i * 12.5, size: 9, font: this.regular, color: MUTED }));
    valueLines.forEach((l, i) => this.page.drawText(l, { x: MARGIN + labelWidth, y: top - 9 - i * 12.5, size: 9.5, font: this.regular, color: INK }));
    this.y -= Math.max(labelLines.length, valueLines.length) * 12.5 + 3;
  }

  /** A labelled blank box for writing in. */
  box(label: string, height: number, options: { x?: number; width?: number; advance?: boolean } = {}) {
    const { x = MARGIN, width = CONTENT, advance = true } = options;
    const lines = this.wrap(label, this.regular, 8.5, width);
    const total = lines.length * 11 + height + 8;
    if (advance) this.need(total);
    lines.forEach((l, i) => this.page.drawText(l, { x, y: this.y - 8.5 - i * 11, size: 8.5, font: this.regular, color: INK }));
    this.page.drawRectangle({ x, y: this.y - lines.length * 11 - height - 2, width, height, borderColor: LINE, borderWidth: 0.7 });
    if (advance) this.y -= total;
    return total;
  }

  /** Tick boxes with their wording. */
  choices(label: string, options: string[]) {
    const lines = this.wrap(label, this.regular, 8.5, CONTENT);
    const widths = options.map((o) => this.regular.widthOfTextAtSize(printable(o), 8.5) + 24);
    const inline = widths.reduce((a, b) => a + b, 0) <= CONTENT;
    const rows = inline ? [options] : options.map((o) => [o]);
    const rowHeights = rows.map((r) => (inline ? 1 : this.wrap(r[0], this.regular, 8.5, CONTENT - 20).length) * 11 + 4);
    this.need(lines.length * 11 + rowHeights.reduce((a, b) => a + b, 0) + 8);
    lines.forEach((l) => {
      this.page.drawText(l, { x: MARGIN, y: this.y - 8.5, size: 8.5, font: this.regular, color: INK });
      this.y -= 11;
    });
    this.y -= 2;
    rows.forEach((row, r) => {
      let x = MARGIN;
      for (const option of row) {
        this.page.drawRectangle({ x, y: this.y - 10, width: 9, height: 9, borderColor: LINE, borderWidth: 0.8 });
        this.wrap(option, this.regular, 8.5, CONTENT - 20).forEach((line, i) => this.page.drawText(line, { x: x + 14, y: this.y - 8.5 - i * 11, size: 8.5, font: this.regular, color: INK }));
        x += this.regular.widthOfTextAtSize(printable(option), 8.5) + 24;
      }
      this.y -= rowHeights[r];
    });
    this.y -= 5;
  }

  async finish() {
    const pages = this.doc.getPages();
    pages.forEach((page, i) => {
      const label = `Page ${i + 1} of ${pages.length}`;
      page.drawText(printable(this.footer), { x: MARGIN, y: 26, size: 7.5, font: this.regular, color: MUTED });
      page.drawText(label, { x: WIDTH - MARGIN - this.regular.widthOfTextAtSize(label, 7.5), y: 26, size: 7.5, font: this.regular, color: MUTED });
    });
    return this.doc.save();
  }
}

export const pdfResponse = (bytes: Uint8Array, filename: string, inline = false) =>
  new Response(new Uint8Array(bytes), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${filename}"`, 'Cache-Control': 'private, no-store' },
  });
