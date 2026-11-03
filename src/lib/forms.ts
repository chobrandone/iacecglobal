import { z } from 'zod';

/** A field on a public form, as stored in FormDefinition.fields and edited in the form builder. */
export type FormField = {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'number' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  half?: boolean;
  placeholder?: string;
  hint?: string;
  options?: string[];
  rows?: number;
};

export type PublicFormDefinition = {
  key: string;
  submitLabel: string;
  successTitle: string;
  successBody: string;
  note: string | null;
  errorMessage: string;
  fields: FormField[];
};

export const formFieldSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9_]*$/, 'Use lowercase letters, numbers and underscores'),
  label: z.string().min(1),
  type: z.enum(['text', 'email', 'tel', 'date', 'number', 'select', 'textarea', 'checkbox']),
  required: z.boolean().optional(),
  half: z.boolean().optional(),
  placeholder: z.string().optional(),
  hint: z.string().optional(),
  options: z.array(z.string()).optional(),
  rows: z.number().int().min(1).max(20).optional(),
});

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const messages = {
  required: 'This field is required.',
  confirm: 'Please confirm to continue.',
  email: 'Please enter a valid email address.',
};

/** Same rules on the client and the server. */
export function validateSubmission(fields: FormField[], values: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const v = values[field.name];
    const empty = v === '' || v === false || v === undefined || v === null;
    if (field.required && empty) errors[field.name] = field.type === 'checkbox' ? messages.confirm : messages.required;
    else if (field.type === 'email' && typeof v === 'string' && v && !EMAIL_RE.test(v)) errors[field.name] = messages.email;
    else if (field.type === 'select' && typeof v === 'string' && v && field.options && !field.options.includes(v))
      errors[field.name] = messages.required;
  }
  return errors;
}

/** Keeps only declared fields, coerced to strings/booleans and length-limited. */
export function cleanSubmission(fields: FormField[], values: Record<string, unknown>) {
  const out: Record<string, string | boolean> = {};
  for (const field of fields) {
    const v = values[field.name];
    if (field.type === 'checkbox') out[field.name] = v === true || v === 'true' || v === 'on';
    else out[field.name] = typeof v === 'string' ? v.trim().slice(0, field.type === 'textarea' ? 5000 : 500) : '';
  }
  return out;
}
