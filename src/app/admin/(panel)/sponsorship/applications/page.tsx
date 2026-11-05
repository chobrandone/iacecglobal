import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requirePage } from '@/lib/permissions';
import { audit } from '@/lib/sponsorship/audit';
import { applicationWhere } from '@/lib/sponsorship/filters';
import { ageOf, formatDate, statusLabels, statusOptions, statusTone } from '@/lib/sponsorship/format';
import { ApplicationsTable, type Row } from '@/components/sponsorship/ApplicationsTable';
import { ExportButton } from '@/components/sponsorship/ExportButton';
import { Button, PageTitle } from '@/components/admin/ui';

const PER_PAGE = 25;

type Search = Record<'q' | 'status' | 'gender' | 'minAge' | 'maxAge' | 'school' | 'referrer' | 'docs' | 'from' | 'to' | 'sort' | 'dir' | 'page', string | undefined>;

function orderFrom(sort: string | undefined, dir: Prisma.SortOrder): Prisma.ChildApplicationOrderByWithRelationInput {
  if (sort === 'reference') return { reference: dir };
  if (sort === 'child') return { child: { fullName: dir } };
  if (sort === 'status') return { status: dir };
  return { createdAt: dir };
}

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requirePage('sponsorship');
  const s = await searchParams;
  const page = Math.max(1, Number(s.page) || 1);
  const dir: Prisma.SortOrder = s.dir === 'asc' ? 'asc' : 'desc';
  const where = applicationWhere(s);

  const [total, applications, coordinators] = await Promise.all([
    prisma.childApplication.count({ where }),
    prisma.childApplication.findMany({
      where,
      orderBy: orderFrom(s.sort, dir),
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { child: true, caretaker: true, referral: true, assignedTo: { select: { name: true } }, schoolRecords: { orderBy: { createdAt: 'desc' }, take: 1 } },
    }),
    prisma.user.findMany({ where: { active: true, role: { in: ['ADMIN', 'SPONSORSHIP_COORDINATOR'] } }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);
  await audit(user, 'view', 'application-list', undefined, { results: applications.length });

  const rows: Row[] = applications.map((a) => ({
    id: a.id,
    reference: a.reference,
    child: a.child?.fullName ?? '—',
    age: a.child ? ageOf(a.child.dateOfBirth) : null,
    gender: a.child?.gender === 'MALE' ? 'Male' : a.child?.gender === 'FEMALE' ? 'Female' : '—',
    status: a.status,
    statusLabel: statusLabels[a.status],
    statusTone: statusTone[a.status],
    caretaker: a.caretaker?.fullName ?? '—',
    phone: a.caretaker?.phones[0] ?? '—',
    school: a.schoolRecords[0]?.school ?? '—',
    referredBy: a.referral?.referredBy ?? '—',
    documentsComplete: a.documentsComplete,
    received: formatDate(a.createdAt),
    coordinator: a.assignedTo?.name ?? '—',
    isTest: a.isTest,
  }));

  const link = (changes: Partial<Search>) => {
    const params = new URLSearchParams(Object.entries({ ...s, ...changes }).filter((e): e is [string, string] => !!e[1]));
    return `/admin/sponsorship/applications?${params}`;
  };
  const sortable = (key: string, label: string) => ({
    key,
    label,
    href: link({ sort: key, dir: s.sort === key && dir === 'desc' ? 'asc' : 'desc', page: undefined }),
    active: (s.sort ?? 'date') === key ? (dir === 'asc' ? ' ↑' : ' ↓') : '',
  });
  const columns = [
    sortable('reference', 'Reference'),
    sortable('child', 'Child'),
    { key: 'age', label: 'Age' },
    { key: 'gender', label: 'Gender' },
    sortable('status', 'Status'),
    { key: 'caretaker', label: 'Caretaker' },
    { key: 'phone', label: 'Phone' },
    { key: 'school', label: 'School' },
    { key: 'referrer', label: 'Referred by' },
    { key: 'docs', label: 'Documents complete' },
    sortable('date', 'Received'),
    { key: 'coordinator', label: 'Coordinator' },
  ];
  const filterQuery = new URLSearchParams(Object.entries(s).filter((e): e is [string, string] => !!e[1] && !['sort', 'dir', 'page'].includes(e[0]))).toString();
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const box = 'h-10 rounded-lg border border-navy/15 bg-white px-3 text-sm text-ink';

  return (
    <>
      <PageTitle
        title="Applications"
        description={`${total} ${total === 1 ? 'application' : 'applications'}. Confidential.`}
        actions={
          <>
            <ExportButton query={filterQuery} />
            <Link href="/admin/sponsorship/applications/new">
              <Button>
                <Plus className="h-4 w-4" /> New application
              </Button>
            </Link>
          </>
        }
      />
      <form className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5" aria-label="Filters">
        <input name="q" defaultValue={s.q} placeholder="Search name or reference" aria-label="Search" className={box} />
        <select name="status" defaultValue={s.status ?? ''} aria-label="Status" className={box}>
          <option value="">All statuses</option>
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select name="gender" defaultValue={s.gender ?? ''} aria-label="Gender" className={box}>
          <option value="">Any gender</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
        <select name="docs" defaultValue={s.docs ?? ''} aria-label="Documents complete" className={box}>
          <option value="">Documents: any</option>
          <option value="yes">Documents complete</option>
          <option value="no">Documents incomplete</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input name="minAge" defaultValue={s.minAge} inputMode="numeric" placeholder="Min age" aria-label="Minimum age" className={box} />
          <input name="maxAge" defaultValue={s.maxAge} inputMode="numeric" placeholder="Max age" aria-label="Maximum age" className={box} />
        </div>
        <input name="school" defaultValue={s.school} placeholder="School" aria-label="School" className={box} />
        <input name="referrer" defaultValue={s.referrer} placeholder="Referred by" aria-label="Referred by" className={box} />
        <input name="from" type="date" defaultValue={s.from} aria-label="Received from" className={box} />
        <input name="to" type="date" defaultValue={s.to} aria-label="Received to" className={box} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            Filter
          </Button>
          <Link href="/admin/sponsorship/applications" className="flex h-10 items-center px-2 text-sm text-ink/60 underline">
            Clear
          </Link>
        </div>
      </form>
      <ApplicationsTable rows={rows} columns={columns} statusOptions={statusOptions} coordinators={coordinators.map((c) => ({ value: c.id, label: c.name }))} />
      {pages > 1 && (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm text-ink/60">
          {page > 1 ? <Link href={link({ page: String(page - 1) })} className="text-navy underline">Previous</Link> : <span />}
          <span>
            Page {page} of {pages}
          </span>
          {page < pages ? <Link href={link({ page: String(page + 1) })} className="text-navy underline">Next</Link> : <span />}
        </nav>
      )}
    </>
  );
}
