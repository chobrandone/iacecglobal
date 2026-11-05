import type { ChildStatus, Gender, Prisma, VisitFrequency } from '@prisma/client';
import { decryptOptional, encrypt, encryptOptional } from './encryption';
import { steps as defaultSteps, withOverrides, type FieldOverrides, type Step, type Values } from './fields';
import { isEmptyPhone } from './schema';

/** Converts between the flat form answers and the database records, for the public form and the admin. */

const str = (v: Values, name: string) => (typeof v[name] === 'string' ? (v[name] as string).trim() : '');
const opt = (v: Values, name: string) => str(v, name) || null;
const date = (v: Values, name: string) => (str(v, name) ? new Date(str(v, name)) : null);
const int = (v: Values, name: string) => (str(v, name) ? Number(str(v, name).replace(/\D/g, '')) : null);
const yes = (v: Values, name: string) => (str(v, name) ? str(v, name) === 'yes' : null);
const phone = (v: Values, name: string) => (isEmptyPhone(str(v, name)) ? null : str(v, name));

/** The school year runs September to August. */
export function schoolYear(now = new Date()) {
  const [year, month] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Douala', year: 'numeric', month: 'numeric' }).format(now).split('-').map(Number);
  const start = month >= 9 ? year : year - 1;
  return `${start}/${start + 1}`;
}

/** Admin forms have no file fields: documents are handled on their own tab. */
export function editableSteps(overrides: FieldOverrides | undefined, ids?: string[]): Step[] {
  return withOverrides(overrides)
    .filter((s) => s.id !== 'documents' && (!ids || ids.includes(s.id)))
    .map((s) => ({ ...s, groups: s.groups.map((g) => ({ ...g, fields: g.fields.filter((f) => f.type !== 'file' && f.type !== 'signature') })) }));
}

export const allStepIds = defaultSteps.map((s) => s.id).filter((id) => id !== 'documents');

export function toRecords(v: Values) {
  const parent = (prefix: string, role: 'FATHER' | 'MOTHER') => {
    const deceased = str(v, `${prefix}_state`) === 'DECEASED';
    return {
      role,
      fullName: opt(v, `${prefix}_name`),
      deceased,
      dateOfDeath: deceased ? date(v, `${prefix}_death_date`) : null,
      causeOfDeath: deceased ? opt(v, `${prefix}_death_cause`) : null,
      occupation: opt(v, `${prefix}_occupation`),
      hometown: opt(v, `${prefix}_hometown`),
      certificateAvailable: deceased && str(v, `${prefix}_certificate`) === 'yes',
    };
  };
  const helper = str(v, 'completed_by') === 'IACEC_MEMBER';
  return {
    application: {
      completedBy: helper ? ('IACEC_MEMBER' as const) : ('CARETAKER' as const),
      helperName: helper ? opt(v, 'helper_name') : null,
      helperPhone: helper ? phone(v, 'helper_phone') : null,
      photoConsent: str(v, 'photo_consent') === 'AGREE',
      declarations: { truthful: v.decl_true === true, visits: v.decl_visits === true, inform: v.decl_inform === true, activities: v.decl_activities === true },
      signatureName: opt(v, 'signature_name'),
      signatureDate: date(v, 'signature_date'),
    },
    child: {
      fullName: str(v, 'child_name'),
      gender: str(v, 'child_gender') as Gender,
      dateOfBirth: date(v, 'child_dob')!,
      placeOfBirth: str(v, 'child_birthplace'),
      address: str(v, 'child_address'),
      church: opt(v, 'child_church'),
      status: str(v, 'child_status') as ChildStatus,
      healthNotes: encryptOptional(opt(v, 'child_health')),
      interests: opt(v, 'child_interests'),
    },
    siblings: ((v.siblings ?? []) as { name: string; age: string }[]).filter((s) => s.name.trim()).map((s) => ({ name: s.name.trim(), age: s.age ? Number(s.age) || null : null })),
    parents: [parent('father', 'FATHER'), parent('mother', 'MOTHER')],
    caretaker: {
      fullName: str(v, 'caretaker_name'),
      relationship: str(v, 'caretaker_relationship'),
      relationshipOther: str(v, 'caretaker_relationship') === 'Other' ? opt(v, 'caretaker_relationship_other') : null,
      livingSince: date(v, 'caretaker_since'),
      phones: [phone(v, 'caretaker_phone'), phone(v, 'caretaker_phone2')].filter((p): p is string => !!p),
      email: opt(v, 'caretaker_email'),
      address: str(v, 'caretaker_address'),
      income: opt(v, 'caretaker_income'),
      householdSize: int(v, 'household_size'),
      otherChildren: int(v, 'other_children'),
      nationalId: encrypt(str(v, 'caretaker_national_id')),
      church: opt(v, 'caretaker_church'),
      pastorName: opt(v, 'caretaker_pastor'),
      willingMember: yes(v, 'caretaker_member'),
    },
    references: ([1, 2] as const).map((position) => ({
      position,
      fullName: str(v, `ref${position}_name`),
      relationship: str(v, `ref${position}_relationship`),
      phone: str(v, `ref${position}_phone`),
      address: opt(v, `ref${position}_address`),
      willing: yes(v, `ref${position}_willing`) ?? false,
    })),
    careTeam: ([1, 2] as const)
      .filter((n) => str(v, `member${n}_name`))
      .map((position) => ({
        position,
        fullName: str(v, `member${position}_name`),
        phone: phone(v, `member${position}_phone`) ?? '',
        connection: opt(v, `member${position}_connection`),
        frequency: opt(v, `member${position}_frequency`) as VisitFrequency | null,
      })),
    referral: { referredBy: str(v, 'referred_by'), relationship: opt(v, 'referrer_relationship') },
    school: {
      school: str(v, 'school_name'),
      level: str(v, 'school_level'),
      schoolAddress: opt(v, 'school_address'),
      headteacherPhone: phone(v, 'headteacher_phone'),
      feesDue: int(v, 'fees_year') ?? 0,
      feesOwed: int(v, 'fees_owed'),
      results: opt(v, 'last_results'),
      currentPayer: opt(v, 'fees_payer'),
      materialNeeds: (v.material_needs ?? []) as string[],
      materialOther: opt(v, 'material_other'),
      urgentNeeds: opt(v, 'urgent_needs'),
      supportReceived: opt(v, 'support_received'),
    },
  };
}

export type Records = ReturnType<typeof toRecords>;

/** The nested data for creating a new application. */
export function createData(r: Records) {
  return {
    ...r.application,
    child: { create: { ...r.child, siblings: { create: r.siblings } } },
    parents: { create: r.parents },
    caretaker: { create: r.caretaker },
    references: { create: r.references },
    careTeam: { create: r.careTeam },
    referral: { create: r.referral },
    schoolRecords: { create: { ...r.school, schoolYear: schoolYear() } },
  } satisfies Partial<Prisma.ChildApplicationCreateInput>;
}

export const applicationInclude = {
  child: { include: { siblings: true } },
  caretaker: true,
  referral: true,
  parents: true,
  references: { orderBy: { position: 'asc' } },
  careTeam: { orderBy: { position: 'asc' } },
  schoolRecords: { orderBy: { createdAt: 'asc' }, take: 1 },
} satisfies Prisma.ChildApplicationInclude;

export type ApplicationRecord = Prisma.ChildApplicationGetPayload<{ include: typeof applicationInclude }>;

const day = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : undefined);
const text = (s?: string | number | null) => (s === null || s === undefined ? undefined : String(s));
const yesNo = (b?: boolean | null) => (b === null || b === undefined ? undefined : b ? 'yes' : 'no');

/** The answers as the form holds them, with sensitive columns decrypted. */
export function toValues(a: ApplicationRecord): Values {
  const declarations = a.declarations as Record<string, boolean>;
  const school = a.schoolRecords[0];
  const v: Values = {
    completed_by: a.completedBy,
    helper_name: text(a.helperName),
    helper_phone: text(a.helperPhone),
    child_name: a.child?.fullName,
    child_gender: a.child?.gender,
    child_dob: day(a.child?.dateOfBirth),
    child_birthplace: a.child?.placeOfBirth,
    child_address: a.child?.address,
    child_church: text(a.child?.church),
    child_status: a.child?.status,
    siblings: a.child?.siblings.map((s) => ({ name: s.name, age: text(s.age) ?? '' })),
    child_health: decryptOptional(a.child?.healthNotes) ?? undefined,
    child_interests: text(a.child?.interests),
    caretaker_name: a.caretaker?.fullName,
    caretaker_relationship: a.caretaker?.relationship,
    caretaker_relationship_other: text(a.caretaker?.relationshipOther),
    caretaker_since: day(a.caretaker?.livingSince),
    caretaker_phone: a.caretaker?.phones[0],
    caretaker_phone2: a.caretaker?.phones[1],
    caretaker_email: text(a.caretaker?.email),
    caretaker_address: a.caretaker?.address,
    caretaker_income: text(a.caretaker?.income),
    household_size: text(a.caretaker?.householdSize),
    other_children: text(a.caretaker?.otherChildren),
    caretaker_national_id: decryptOptional(a.caretaker?.nationalId) ?? undefined,
    caretaker_church: text(a.caretaker?.church),
    caretaker_pastor: text(a.caretaker?.pastorName),
    caretaker_member: yesNo(a.caretaker?.willingMember),
    referred_by: a.referral?.referredBy,
    referrer_relationship: text(a.referral?.relationship),
    school_name: school?.school,
    school_level: school?.level,
    school_address: text(school?.schoolAddress),
    headteacher_phone: text(school?.headteacherPhone),
    fees_year: text(school?.feesDue),
    fees_owed: text(school?.feesOwed),
    last_results: text(school?.results),
    fees_payer: text(school?.currentPayer),
    material_needs: school?.materialNeeds,
    material_other: text(school?.materialOther),
    urgent_needs: text(school?.urgentNeeds),
    support_received: text(school?.supportReceived),
    decl_true: !!declarations.truthful,
    decl_visits: !!declarations.visits,
    decl_inform: !!declarations.inform,
    decl_activities: !!declarations.activities,
    photo_consent: a.photoConsent ? 'AGREE' : 'DECLINE',
    signature_name: text(a.signatureName),
    signature_date: day(a.signatureDate),
  };
  for (const [prefix, role] of [['father', 'FATHER'], ['mother', 'MOTHER']] as const) {
    const p = a.parents.find((x) => x.role === role);
    v[`${prefix}_name`] = text(p?.fullName);
    v[`${prefix}_state`] = p ? (p.deceased ? 'DECEASED' : 'LIVING') : undefined;
    v[`${prefix}_death_date`] = day(p?.dateOfDeath);
    v[`${prefix}_death_cause`] = text(p?.causeOfDeath);
    v[`${prefix}_occupation`] = text(p?.occupation);
    v[`${prefix}_hometown`] = text(p?.hometown);
    v[`${prefix}_certificate`] = p?.deceased ? yesNo(p.certificateAvailable) : undefined;
  }
  for (const r of a.references) {
    v[`ref${r.position}_name`] = r.fullName;
    v[`ref${r.position}_relationship`] = r.relationship;
    v[`ref${r.position}_phone`] = r.phone;
    v[`ref${r.position}_address`] = text(r.address);
    v[`ref${r.position}_willing`] = yesNo(r.willing);
  }
  for (const m of a.careTeam) {
    v[`member${m.position}_name`] = m.fullName;
    v[`member${m.position}_phone`] = m.phone;
    v[`member${m.position}_connection`] = text(m.connection);
    v[`member${m.position}_frequency`] = text(m.frequency);
  }
  return v;
}
