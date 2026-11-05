import type { PrismaClient } from '@prisma/client';
import { encrypt } from '../../src/lib/sponsorship/encryption';

/** Three invented children for trying out the dashboard. Loaded only by: npm run db:seed -- --demo */
const demo = [
  {
    reference: 'IACEC-CS-TEST-0001',
    status: 'NEW',
    child: { fullName: 'TEST Amara Example', gender: 'FEMALE', dateOfBirth: '2015-03-14', status: 'LOST_FATHER', health: 'Test data: mild asthma.' },
    parents: [
      { role: 'FATHER', fullName: 'TEST Paul Example', deceased: true, dateOfDeath: '2023-06-02' },
      { role: 'MOTHER', fullName: 'TEST Grace Example', deceased: false },
    ],
    caretaker: { fullName: 'TEST Grace Example', relationship: 'Other', relationshipOther: 'Mother', nationalId: 'TEST-000000001' },
    school: { school: 'TEST Primary School', level: 'Class 4', feesDue: 45000 },
  },
  {
    reference: 'IACEC-CS-TEST-0002',
    status: 'VISIT_SCHEDULED',
    child: { fullName: 'TEST Daniel Sample', gender: 'MALE', dateOfBirth: '2012-09-01', status: 'LOST_BOTH', health: null },
    parents: [
      { role: 'FATHER', fullName: 'TEST John Sample', deceased: true, dateOfDeath: '2021-01-20' },
      { role: 'MOTHER', fullName: 'TEST Ruth Sample', deceased: true, dateOfDeath: '2022-11-05' },
    ],
    caretaker: { fullName: 'TEST Esther Sample', relationship: 'Aunt', relationshipOther: null, nationalId: 'TEST-000000002' },
    school: { school: 'TEST Secondary School', level: 'Form 1', feesDue: 90000 },
  },
  {
    reference: 'IACEC-CS-TEST-0003',
    status: 'ACCEPTED',
    child: { fullName: 'TEST Miriam Placeholder', gender: 'FEMALE', dateOfBirth: '2017-12-22', status: 'LOST_MOTHER', health: null },
    parents: [
      { role: 'FATHER', fullName: 'TEST Peter Placeholder', deceased: false },
      { role: 'MOTHER', fullName: 'TEST Lydia Placeholder', deceased: true, dateOfDeath: '2024-02-11' },
    ],
    caretaker: { fullName: 'TEST Martha Placeholder', relationship: 'Grandparent', relationshipOther: null, nationalId: 'TEST-000000003' },
    school: { school: 'TEST Nursery and Primary', level: 'Class 2', feesDue: 35000 },
  },
] as const;

export async function seedSponsorshipDemo(prisma: PrismaClient) {
  for (const d of demo) {
    if (await prisma.childApplication.findUnique({ where: { reference: d.reference } })) continue;
    await prisma.childApplication.create({
      data: {
        reference: d.reference,
        status: d.status,
        isTest: true,
        documentsComplete: false,
        declarations: { truthful: true, visits: true, inform: true, activities: true },
        signatureName: d.caretaker.fullName,
        signatureDate: new Date('2026-11-01'),
        child: {
          create: {
            fullName: d.child.fullName,
            gender: d.child.gender,
            dateOfBirth: new Date(d.child.dateOfBirth),
            placeOfBirth: 'Test town',
            address: 'Test quarter, Test town',
            status: d.child.status,
            healthNotes: d.child.health ? encrypt(d.child.health) : null,
          },
        },
        parents: { create: d.parents.map((p) => ({ ...p, dateOfDeath: 'dateOfDeath' in p ? new Date(p.dateOfDeath) : null })) },
        caretaker: {
          create: {
            fullName: d.caretaker.fullName,
            relationship: d.caretaker.relationship,
            relationshipOther: d.caretaker.relationshipOther,
            phones: ['+237 600 000 000'],
            address: 'Test quarter, Test town',
            nationalId: encrypt(d.caretaker.nationalId),
          },
        },
        references: {
          create: [1, 2].map((position) => ({ position, fullName: `TEST Reference ${position}`, relationship: 'Uncle', phone: '+237 600 000 000', willing: true })),
        },
        referral: { create: { referredBy: 'TEST IACEC member' } },
        schoolRecords: { create: { schoolYear: '2026/2027', ...d.school, materialNeeds: ['Uniform', 'Books'] } },
        statusChanges: { create: { to: d.status, userName: 'Demo seed' } },
      },
    });
  }
  console.log(`  ✓ ${demo.length} fictional test children`);
}
