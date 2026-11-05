import type { Field, FileRef, Sibling, Value } from './fields';
import { isEmptyPhone } from './schema';

/** An answer as a person reads it. Empty when there is nothing to show. */
export function displayValue(field: Field, value: Value): string {
  if (field.type === 'file' || field.type === 'signature') return ((value ?? []) as FileRef[]).map((f) => f.filename).join(', ');
  if (field.type === 'siblings') return ((value ?? []) as Sibling[]).filter((s) => s.name).map((s) => (s.age ? `${s.name} (${s.age})` : s.name)).join(', ');
  if (field.type === 'checks') return ((value ?? []) as string[]).join(', ');
  if (field.type === 'checkbox') return value ? 'Yes' : '';
  if (field.type === 'yesno') return value === 'yes' ? 'Yes' : value === 'no' ? 'No' : '';
  if (typeof value !== 'string') return '';
  if (field.type === 'tel' && isEmptyPhone(value)) return '';
  return field.options?.find((o) => o.value === value)?.label ?? value;
}
