import type { Field, Step } from '../fields';
import { CONTENT, MARGIN, Sheet } from './sheet';

const GAP = 12;

function write(sheet: Sheet, field: Field, label: string) {
  switch (field.type) {
    case 'radio':
    case 'select':
    case 'checks':
      sheet.choices(label, (field.options ?? []).map((o) => o.label));
      break;
    case 'yesno':
      sheet.choices(label, ['Yes', 'No']);
      break;
    case 'checkbox':
      sheet.choices('', [label]);
      break;
    case 'file':
      sheet.choices('', [`${label} (attached)`]);
      break;
    case 'textarea':
      sheet.box(label, 44);
      break;
    case 'signature':
      sheet.box('Signature', 52);
      break;
    case 'siblings':
      sheet.box(`${label}: names and ages`, 58);
      break;
    default:
      sheet.box(label, 20);
  }
}

const isBox = (f: Field) => !['radio', 'select', 'checks', 'yesno', 'checkbox', 'file', 'textarea', 'signature', 'siblings'].includes(f.type);

/** The printable form, drawn from the same definitions as the online wizard. */
export async function paperForm(steps: Step[], programmeName: string) {
  const sheet = await Sheet.create('Child Sponsorship Registration', `${programmeName} · Confidential once completed`);
  sheet.text(`${programmeName}: registration form`, { size: 15, bold: true });
  sheet.y -= 4;
  sheet.text('Please write clearly. Questions marked * must be answered. Give the completed form, with copies of the documents, to an IACEC member. All information is confidential.', { size: 9.5 });
  sheet.y -= 4;
  sheet.box('For IACEC use: reference number and date received', 18);

  steps.forEach((step, i) => {
    sheet.heading(`${i + 1}. ${step.title}`);
    if (step.id === 'documents') sheet.text('Tick each document you are attaching.', { size: 9, muted: true });
    else if (step.intro) sheet.text(step.intro, { size: 9, muted: true });
    for (const group of step.groups) {
      if (group.title) sheet.subheading(group.title);
      const fields = group.fields;
      for (let n = 0; n < fields.length; n += 1) {
        const field = fields[n];
        const label = `${field.label}${field.required ? ' *' : ''}${field.showIf ? ' (if it applies)' : ''}`;
        const next = fields[n + 1];
        // Two short answers can share a line.
        if (field.half && next?.half && isBox(field) && isBox(next)) {
          const width = (CONTENT - GAP) / 2;
          sheet.need(52);
          const a = sheet.box(label, 20, { width, advance: false });
          const b = sheet.box(`${next.label}${next.required ? ' *' : ''}${next.showIf ? ' (if it applies)' : ''}`, 20, { x: MARGIN + width + GAP, width, advance: false });
          sheet.y -= Math.max(a, b);
          n += 1;
        } else {
          write(sheet, field, label);
        }
      }
    }
  });
  return sheet.finish();
}
