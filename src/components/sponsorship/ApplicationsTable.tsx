'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { bulkUpdate } from '@/app/admin/(panel)/sponsorship/_actions';
import { Badge, Button, Select } from '@/components/admin/ui';
import { ExportButton } from './ExportButton';

export type Row = {
  id: string;
  reference: string;
  child: string;
  age: number | null;
  gender: string;
  status: string;
  statusLabel: string;
  statusTone: 'default' | 'gold' | 'green' | 'red' | 'muted';
  caretaker: string;
  phone: string;
  school: string;
  referredBy: string;
  documentsComplete: boolean;
  received: string;
  coordinator: string;
  isTest: boolean;
};

type Option = { value: string; label: string };

export function ApplicationsTable({ rows, columns, statusOptions, coordinators }: { rows: Row[]; columns: { key: string; label: string; href?: string; active?: string }[]; statusOptions: Option[]; coordinators: Option[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [coordinator, setCoordinator] = useState('');
  const [busy, setBusy] = useState(false);
  const all = rows.length > 0 && selected.length === rows.length;

  async function apply() {
    if (!status && !coordinator) return void toast.error('Choose a status or a coordinator first.');
    setBusy(true);
    const res = await bulkUpdate(selected, { status: status || undefined, assignedToId: coordinator || undefined });
    setBusy(false);
    if (!res.ok) return void toast.error(res.error ?? 'This could not be saved.');
    const skipped = res.skipped ?? 0;
    toast.success(`${selected.length - skipped} updated`);
    if (skipped) toast.warning(`${skipped} could not move to that status from where they are.`);
    setSelected([]);
    setStatus('');
    setCoordinator('');
    router.refresh();
  }

  return (
    <>
      {selected.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-gold/40 bg-gold-tint/50 p-3 text-sm text-navy">
          <span className="font-semibold">{selected.length} selected</span>
          <Select id="bulk-status" value={status} onChange={setStatus} options={[{ value: '', label: 'Change status…' }, ...statusOptions.filter((o) => o.value !== 'EXITED')]} className="w-auto" />
          <Select id="bulk-coordinator" value={coordinator} onChange={setCoordinator} options={[{ value: '', label: 'Assign coordinator…' }, ...coordinators]} className="w-auto" />
          <Button size="sm" onClick={apply} disabled={busy}>
            Apply
          </Button>
          <ExportButton ids={selected} label="Export selection" />
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-navy/[0.09] bg-white shadow-sm">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="border-b border-navy/10 bg-mist/60 font-heading text-[0.72rem] text-navy">
            <tr>
              <th className="w-10 px-3 py-2.5">
                <input type="checkbox" aria-label="Select all" checked={all} onChange={() => setSelected(all ? [] : rows.map((r) => r.id))} className="accent-gold" />
              </th>
              {columns.map((c) => (
                <th key={c.key} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  {c.href ? (
                    <Link href={c.href} className="hover:text-gold-deep">
                      {c.label}
                      {c.active}
                    </Link>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/[0.06]">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-mist/40">
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label={`Select ${r.reference}`}
                    checked={selected.includes(r.id)}
                    onChange={() => setSelected((s) => (s.includes(r.id) ? s.filter((x) => x !== r.id) : [...s, r.id]))}
                    className="accent-gold"
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <Link href={`/admin/sponsorship/applications/${r.id}`} className="font-semibold text-navy underline decoration-gold underline-offset-2">
                    {r.reference}
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  {r.child} {r.isTest && <Badge tone="muted">Test</Badge>}
                </td>
                <td className="px-3 py-2.5">{r.age ?? '—'}</td>
                <td className="px-3 py-2.5">{r.gender}</td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <Badge tone={r.statusTone}>{r.statusLabel}</Badge>
                </td>
                <td className="px-3 py-2.5">{r.caretaker}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{r.phone}</td>
                <td className="px-3 py-2.5">{r.school}</td>
                <td className="px-3 py-2.5">{r.referredBy}</td>
                <td className="px-3 py-2.5">{r.documentsComplete ? <Badge tone="green">Yes</Badge> : <Badge tone="red">No</Badge>}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{r.received}</td>
                <td className="px-3 py-2.5">{r.coordinator}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-center text-sm text-ink/50">No applications match.</p>}
      </div>
    </>
  );
}
