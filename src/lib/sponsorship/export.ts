import ExcelJS from 'exceljs';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { decryptOptional } from './encryption';
import { ageOf, statusLabels } from './format';

const include = {
  child: true,
  caretaker: true,
  referral: true,
  assignedTo: { select: { name: true } },
  schoolRecords: { orderBy: { createdAt: 'desc' }, take: 1 },
} satisfies Prisma.ChildApplicationInclude;

type Application = Prisma.ChildApplicationGetPayload<{ include: typeof include }>;
type Column = { header: string; value: (a: Application) => string | number | null | undefined; sensitive?: boolean };

const day = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : '');

const columns: Column[] = [
  { header: 'Reference', value: (a) => a.reference },
  { header: 'Status', value: (a) => statusLabels[a.status] },
  { header: 'Received', value: (a) => day(a.createdAt) },
  { header: 'Source', value: (a) => (a.source === 'PAPER' ? 'Paper' : 'Online') },
  { header: 'Child', value: (a) => a.child?.fullName },
  { header: 'Gender', value: (a) => a.child?.gender },
  { header: 'Date of birth', value: (a) => day(a.child?.dateOfBirth) },
  { header: 'Age', value: (a) => (a.child ? ageOf(a.child.dateOfBirth) : null) },
  { header: 'Child status', value: (a) => a.child?.status },
  { header: 'Place of birth', value: (a) => a.child?.placeOfBirth },
  { header: 'Address', value: (a) => a.child?.address },
  { header: 'Church', value: (a) => a.child?.church },
  { header: 'Caretaker', value: (a) => a.caretaker?.fullName },
  { header: 'Relationship', value: (a) => a.caretaker?.relationshipOther || a.caretaker?.relationship },
  { header: 'Phones', value: (a) => a.caretaker?.phones.join(', ') },
  { header: 'Email', value: (a) => a.caretaker?.email },
  { header: 'School', value: (a) => a.schoolRecords[0]?.school },
  { header: 'Class', value: (a) => a.schoolRecords[0]?.level },
  { header: 'Fees per year (FCFA)', value: (a) => a.schoolRecords[0]?.feesDue },
  { header: 'Referred by', value: (a) => a.referral?.referredBy },
  { header: 'Documents complete', value: (a) => (a.documentsComplete ? 'Yes' : 'No') },
  { header: 'Coordinator', value: (a) => a.assignedTo?.name },
  { header: 'National ID', value: (a) => decryptOptional(a.caretaker?.nationalId), sensitive: true },
  { header: 'Health notes', value: (a) => decryptOptional(a.child?.healthNotes), sensitive: true },
];

export async function exportRows(where: Prisma.ChildApplicationWhereInput, sensitive: boolean) {
  const applications = await prisma.childApplication.findMany({ where, include, orderBy: { createdAt: 'desc' } });
  const chosen = columns.filter((c) => sensitive || !c.sensitive);
  return { headers: chosen.map((c) => c.header), rows: applications.map((a) => chosen.map((c) => c.value(a) ?? '')) };
}

export async function toWorkbook(sheets: { name: string; headers: string[]; rows: (string | number)[][] }[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'IACEC';
  for (const { name, headers, rows } of sheets) {
    const sheet = workbook.addWorksheet(name);
    sheet.addRow(headers).font = { bold: true };
    sheet.addRows(rows);
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    (sheet.columns ?? []).forEach((column) => {
      column.width = 20;
    });
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
