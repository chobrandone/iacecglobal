/**
 * The registration form, defined once. The public wizard, its validation (client and server),
 * the admin forms and the paper form are all built from these definitions.
 */

export type Option = { value: string; label: string };

export type FileRef = { key: string; filename: string; mimeType: string; size: number };
export type Sibling = { name: string; age: string };
export type Value = string | boolean | string[] | FileRef[] | Sibling[] | undefined;
export type Values = Record<string, Value>;

export type FieldType =
  | 'text'
  | 'textarea'
  | 'date'
  | 'tel'
  | 'email'
  | 'number'
  | 'money'
  | 'select'
  | 'radio'
  | 'yesno'
  | 'checks'
  | 'checkbox'
  | 'siblings'
  | 'file'
  | 'signature';

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  options?: Option[];
  /** Shown beside the next half-width field on larger screens. */
  half?: boolean;
  /** Dates only: must not be in the future. */
  past?: boolean;
  /** Files only: the document category, and whether several files are allowed. */
  docType?: string;
  multiple?: boolean;
  /** Never written to the browser draft. */
  sensitive?: boolean;
  showIf?: (values: Values) => boolean;
};

export type Group = { title?: string; fields: Field[] };
export type Step = { id: string; title: string; intro?: string; groups: Group[]; columns?: 2 };

const options = (...labels: string[]): Option[] => labels.map((label) => ({ value: label, label }));
const is = (name: string, value: string) => (v: Values) => v[name] === value;

function parent(prefix: 'father' | 'mother', title: string): Group {
  const deceased = is(`${prefix}_state`, 'DECEASED');
  return {
    title,
    fields: [
      { name: `${prefix}_name`, label: 'Full name', type: 'text' },
      {
        name: `${prefix}_state`,
        label: 'Living or deceased',
        type: 'radio',
        required: true,
        options: [
          { value: 'LIVING', label: 'Living' },
          { value: 'DECEASED', label: 'Deceased' },
        ],
      },
      { name: `${prefix}_death_date`, label: 'Date of death', type: 'date', past: true, showIf: deceased },
      { name: `${prefix}_death_cause`, label: 'Cause of death, if known', type: 'text', hint: 'Optional.', showIf: deceased },
      { name: `${prefix}_occupation`, label: 'Last occupation', type: 'text' },
      { name: `${prefix}_hometown`, label: 'Hometown or village', type: 'text' },
      { name: `${prefix}_certificate`, label: 'Death certificate available', type: 'yesno', showIf: deceased },
    ],
  };
}

function reference(n: 1 | 2): Group {
  return {
    title: `Family member ${n}`,
    fields: [
      { name: `ref${n}_name`, label: 'Full name', type: 'text', required: true },
      { name: `ref${n}_relationship`, label: 'Relationship to the child', type: 'text', required: true },
      { name: `ref${n}_phone`, label: 'Phone', type: 'tel', required: true },
      { name: `ref${n}_address`, label: 'Address or town', type: 'text' },
      { name: `ref${n}_willing`, label: 'Willing to work with IACEC on the child’s upbringing?', type: 'yesno' },
    ],
  };
}

function member(n: 1 | 2): Group {
  return {
    title: `IACEC member ${n}`,
    fields: [
      { name: `member${n}_name`, label: 'Full name', type: 'text' },
      { name: `member${n}_phone`, label: 'Phone', type: 'tel' },
      { name: `member${n}_connection`, label: 'How they know the child or family', type: 'text' },
      { name: `member${n}_frequency`, label: 'Visit frequency', type: 'select', options: [
        { value: 'WEEKLY', label: 'Weekly' },
        { value: 'MONTHLY', label: 'Monthly' },
        { value: 'QUARTERLY', label: 'Quarterly' },
      ] },
    ],
  };
}

export const steps: Step[] = [
  {
    id: 'about',
    title: 'About the programme',
    groups: [
      {
        fields: [
          {
            name: 'completed_by',
            label: 'Who is completing this form?',
            type: 'radio',
            required: true,
            options: [
              { value: 'CARETAKER', label: 'Caretaker' },
              { value: 'IACEC_MEMBER', label: 'IACEC member on behalf of caretaker' },
            ],
          },
          { name: 'helper_name', label: 'Your name', type: 'text', required: true, half: true, showIf: is('completed_by', 'IACEC_MEMBER') },
          { name: 'helper_phone', label: 'Your phone', type: 'tel', required: true, half: true, showIf: is('completed_by', 'IACEC_MEMBER') },
        ],
      },
    ],
  },
  {
    id: 'child',
    title: 'Child’s information',
    groups: [
      {
        fields: [
          { name: 'child_name', label: 'Full name', type: 'text', required: true },
          {
            name: 'child_gender',
            label: 'Gender',
            type: 'radio',
            required: true,
            half: true,
            options: [
              { value: 'MALE', label: 'Male' },
              { value: 'FEMALE', label: 'Female' },
            ],
          },
          { name: 'child_dob', label: 'Date of birth', type: 'date', required: true, past: true, half: true },
          { name: 'child_birthplace', label: 'Place of birth', type: 'text', required: true },
          { name: 'child_address', label: 'Current home address', type: 'textarea', required: true, hint: 'Town, quarter and a landmark.' },
          { name: 'child_church', label: 'Church attended', type: 'text' },
          {
            name: 'child_status',
            label: 'Child’s status',
            type: 'radio',
            required: true,
            options: [
              { value: 'LOST_FATHER', label: 'Lost father' },
              { value: 'LOST_MOTHER', label: 'Lost mother' },
              { value: 'LOST_BOTH', label: 'Lost both parents' },
            ],
          },
          { name: 'siblings', label: 'Brothers and sisters', type: 'siblings' },
          { name: 'child_health', label: 'Health condition or special needs', type: 'textarea', sensitive: true },
          { name: 'child_interests', label: 'Hobbies, talents and dreams', type: 'textarea' },
          { name: 'child_photo', label: 'Recent photo of the child', type: 'file', required: true, docType: 'CHILD_PHOTO' },
        ],
      },
    ],
  },
  {
    id: 'parents',
    title: 'Parents’ information',
    columns: 2,
    groups: [parent('father', 'Father'), parent('mother', 'Mother')],
  },
  {
    id: 'caretaker',
    title: 'Caretaker or guardian',
    groups: [
      {
        fields: [
          { name: 'caretaker_name', label: 'Full name', type: 'text', required: true },
          { name: 'caretaker_relationship', label: 'Relationship to the child', type: 'select', required: true, half: true, options: options('Aunt', 'Uncle', 'Grandparent', 'Sibling', 'Other') },
          { name: 'caretaker_relationship_other', label: 'Please say which', type: 'text', required: true, half: true, showIf: is('caretaker_relationship', 'Other') },
          { name: 'caretaker_since', label: 'Living with the child since', type: 'date', past: true },
          { name: 'caretaker_phone', label: 'Phone number', type: 'tel', required: true, half: true },
          { name: 'caretaker_phone2', label: 'Second phone number', type: 'tel', half: true },
          { name: 'caretaker_email', label: 'Email', type: 'email' },
          { name: 'caretaker_address', label: 'Home address', type: 'textarea', required: true },
          { name: 'caretaker_income', label: 'Occupation or source of income', type: 'text' },
          { name: 'household_size', label: 'Number of people in the household', type: 'number', half: true },
          { name: 'other_children', label: 'Other children in their care', type: 'number', half: true },
          { name: 'caretaker_national_id', label: 'National ID card number', type: 'text', required: true, sensitive: true, hint: 'For your privacy, this is not saved on this phone. You may need to enter it again if you come back later.' },
          { name: 'caretaker_church', label: 'Church', type: 'text', half: true },
          { name: 'caretaker_pastor', label: 'Pastor’s name', type: 'text', half: true },
          { name: 'caretaker_member', label: 'Willing to become an IACEC member?', type: 'yesno' },
        ],
      },
    ],
  },
  {
    id: 'references',
    title: 'Two family references',
    intro: 'Every child walks with two family members who agree to stay involved.',
    columns: 2,
    groups: [reference(1), reference(2)],
  },
  {
    id: 'followup',
    title: 'IACEC follow-up members and referral',
    intro: 'If you do not yet know the two IACEC members, leave them empty. IACEC can assign them later.',
    columns: 2,
    groups: [
      member(1),
      member(2),
      {
        title: 'Referral',
        fields: [
          { name: 'referred_by', label: 'Referred by (IACEC partner or member)', type: 'text', required: true },
          { name: 'referrer_relationship', label: 'Referrer’s relationship to the child', type: 'text' },
        ],
      },
    ],
  },
  {
    id: 'school',
    title: 'Schooling and needs',
    groups: [
      {
        fields: [
          { name: 'school_name', label: 'Name of school', type: 'text', required: true, half: true },
          { name: 'school_level', label: 'Class or level', type: 'text', required: true, half: true },
          { name: 'school_address', label: 'School address', type: 'text', half: true },
          { name: 'headteacher_phone', label: 'Headteacher’s phone', type: 'tel', half: true },
          { name: 'fees_year', label: 'School fees per year (FCFA)', type: 'money', required: true, half: true },
          { name: 'fees_owed', label: 'Fees currently owed (FCFA)', type: 'money', half: true },
          { name: 'last_results', label: 'Last term’s average or position', type: 'text', half: true },
          { name: 'fees_payer', label: 'Who currently pays the fees', type: 'text', half: true },
          { name: 'material_needs', label: 'Material needs', type: 'checks', options: options('Uniform', 'Books', 'Shoes', 'Bag', 'Other') },
          { name: 'material_other', label: 'Other material needs', type: 'text', showIf: (v) => Array.isArray(v.material_needs) && (v.material_needs as string[]).includes('Other') },
          { name: 'urgent_needs', label: 'Other urgent needs (health, food, shelter)', type: 'textarea' },
          { name: 'support_received', label: 'Support already received, and from whom', type: 'textarea' },
        ],
      },
    ],
  },
  {
    id: 'documents',
    title: 'Proof documents',
    intro: 'Take a clear photo with your phone, or choose an image or PDF. Each file can be up to 10 MB. Documents marked * are needed now; the others can follow later.',
    groups: [
      {
        fields: [
          { name: 'doc_birth', label: 'Child’s birth certificate', type: 'file', required: true, docType: 'BIRTH_CERTIFICATE' },
          { name: 'doc_death', label: 'Death certificate(s), or a letter from the chief, quarter head or pastor confirming the death', type: 'file', required: true, multiple: true, docType: 'DEATH_PROOF' },
          { name: 'doc_caretaker_id', label: 'Caretaker’s national ID card', type: 'file', required: true, docType: 'CARETAKER_ID' },
          { name: 'doc_passport', label: 'Passport-size photo of the child', type: 'file', required: true, docType: 'PASSPORT_PHOTO' },
          { name: 'doc_report', label: 'Latest school report card', type: 'file', docType: 'REPORT_CARD' },
          { name: 'doc_receipt', label: 'School fees receipt or statement', type: 'file', docType: 'FEES_RECEIPT' },
          { name: 'doc_recommendation', label: 'Letter of recommendation from a pastor or church leader', type: 'file', docType: 'RECOMMENDATION' },
          { name: 'doc_reference_ids', label: 'ID cards of the two family references', type: 'file', multiple: true, docType: 'REFERENCE_ID' },
        ],
      },
    ],
  },
  {
    id: 'consent',
    title: 'Declarations and consent',
    groups: [
      {
        fields: [
          { name: 'decl_true', label: 'The information is true and complete.', type: 'checkbox', required: true },
          { name: 'decl_visits', label: 'I agree that IACEC members may visit the child at home and at school, with a responsible adult present.', type: 'checkbox', required: true },
          { name: 'decl_inform', label: 'I will inform IACEC if the child changes home, school or caretaker.', type: 'checkbox', required: true },
          { name: 'decl_activities', label: 'I agree that the child may attend IACEC fellowship, camps and activities, with my permission for each event.', type: 'checkbox', required: true },
          {
            name: 'photo_consent',
            label: 'Photos of the child',
            type: 'radio',
            required: true,
            options: [
              { value: 'AGREE', label: 'I agree that photos of the child may be used in IACEC reports, without the child’s surname or home address.' },
              { value: 'DECLINE', label: 'I do not agree that photos of the child may be used in IACEC reports.' },
            ],
          },
          { name: 'signature_name', label: 'Caretaker’s full name, as a signature', type: 'text', required: true, half: true },
          { name: 'signature_date', label: 'Date', type: 'date', required: true, past: true, half: true },
          { name: 'signature_drawn', label: 'Draw your signature (optional)', type: 'signature' },
        ],
      },
    ],
  },
];

export const allFields = (list: Step[] = steps) => list.flatMap((s) => s.groups.flatMap((g) => g.fields));
export const isVisible = (field: Field, values: Values) => !field.showIf || field.showIf(values);

export type FieldOverrides = Record<string, { label?: string; hint?: string; options?: Option[] }>;

/** Applies wording and dropdown choices edited in the admin. */
export function withOverrides(overrides: FieldOverrides = {}): Step[] {
  return steps.map((step) => ({
    ...step,
    groups: step.groups.map((group) => ({ ...group, fields: group.fields.map((field) => ({ ...field, ...overrides[field.name] })) })),
  }));
}

/** Documents that must all be present for an application not to be flagged "Documents incomplete". */
export const documentFields = () => allFields().filter((f) => f.type === 'file');
