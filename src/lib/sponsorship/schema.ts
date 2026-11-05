import { z } from 'zod';
import { isVisible, type Field, type Step, type Values } from './fields';

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES_PER_FIELD = 5;

const REQUIRED = 'This field is required.';
const CONFIRM = 'Please confirm to continue.';
const EMAIL = 'Please enter a valid email address.';
const PHONE = 'Please enter a valid phone number.';
const DATE = 'Please enter a valid date.';
const FUTURE = 'This date cannot be in the future.';
const NUMBER = 'Please enter numbers only.';

const digits = (s: string) => s.replace(/\D/g, '');
/** A phone box starts with the Cameroon code, so the code alone counts as empty. */
export const isEmptyPhone = (s: string) => digits(s).length === 0 || digits(s) === '237';

const fileRef = z.object({
  key: z.string().min(1).max(200),
  filename: z.string().min(1).max(200),
  mimeType: z.string().min(1).max(100),
  size: z.number().int().positive().max(MAX_FILE_BYTES),
});

const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const isFuture = (s: string) => s > new Date().toISOString().slice(0, 10);

function text(field: Field, max: number, check?: (s: string) => boolean, message = REQUIRED) {
  const base = z.string({ error: REQUIRED }).trim().max(max, 'This is too long.');
  const filled: z.ZodType<string | undefined> = field.required ? base.min(1, REQUIRED) : base.optional();
  return check ? filled.refine((s) => !s || check(s), message) : filled;
}

function fieldSchema(field: Field): z.ZodTypeAny {
  switch (field.type) {
    case 'textarea':
      return text(field, 3000);
    case 'email':
      return text(field, 200, (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), EMAIL);
    case 'tel': {
      const base = z.string().trim().max(30, PHONE);
      const valid = (s: string) => /^\+?[\d\s()-]+$/.test(s) && digits(s).length >= 8;
      return field.required
        ? base.refine((s) => !isEmptyPhone(s), REQUIRED).refine(valid, PHONE)
        : base.optional().refine((s) => !s || isEmptyPhone(s) || valid(s), PHONE);
    }
    case 'date':
      return text(field, 10)
        .refine((s) => !s || validDate(s), DATE)
        .refine((s) => !field.past || !s || !isFuture(s), FUTURE);
    case 'number':
      return text(field, 4, (s) => /^\d+$/.test(s), NUMBER);
    case 'money':
      return text(field, 15, (s) => /^\d+$/.test(s.replace(/[\s,.]/g, '')), NUMBER);
    case 'select':
    case 'radio':
      return text(field, 300, (s) => (field.options ?? []).some((o) => o.value === s), REQUIRED);
    case 'yesno':
      return text(field, 3, (s) => s === 'yes' || s === 'no', REQUIRED);
    case 'checks':
      return z.array(z.string().max(100)).max(20).optional();
    case 'checkbox':
      return field.required ? z.literal(true, { error: CONFIRM }) : z.boolean().optional();
    case 'siblings':
      return z.array(z.object({ name: z.string().trim().max(200), age: z.string().trim().max(3) })).max(30).optional();
    case 'file':
    case 'signature': {
      const list = z.array(fileRef, { error: REQUIRED }).max(field.multiple ? MAX_FILES_PER_FIELD : 1, 'Too many files.');
      return field.required ? list.min(1, 'Please add this document.') : list.optional();
    }
    default:
      return text(field, 300);
  }
}

export type Errors = Record<string, string>;

function stepRules(step: Step, values: Values): Errors {
  if (step.id === 'parents' && values.father_state !== 'DECEASED' && values.mother_state !== 'DECEASED') {
    return { mother_state: 'At least one parent must be marked deceased.' };
  }
  return {};
}

export function validateStep(step: Step, values: Values): Errors {
  const fields = step.groups.flatMap((g) => g.fields).filter((f) => isVisible(f, values));
  const shape = Object.fromEntries(fields.map((f) => [f.name, fieldSchema(f)]));
  const result = z.object(shape).safeParse(values);
  const errors: Errors = {};
  if (!result.success) {
    for (const issue of result.error.issues) {
      const name = String(issue.path[0]);
      errors[name] ??= issue.code === 'invalid_type' ? REQUIRED : issue.message;
    }
  }
  return { ...stepRules(step, values), ...errors };
}

/** Checks every step. Returns the first step with a problem, for sending the person back to it. */
export function validateAll(list: Step[], values: Values) {
  const errors: Errors = {};
  let firstStep: number | null = null;
  list.forEach((step, i) => {
    const stepErrors = validateStep(step, values);
    if (Object.keys(stepErrors).length) {
      firstStep ??= i;
      Object.assign(errors, stepErrors);
    }
  });
  return { errors, firstStep: firstStep as number | null };
}
