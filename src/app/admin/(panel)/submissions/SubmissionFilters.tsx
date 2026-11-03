'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Input, Select } from '@/components/admin/ui';

export function SubmissionFilters({ forms, form, status, q }: { forms: { value: string; label: string }[]; form: string; status: string; q: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(q);
  const go = (next: { form?: string; status?: string; q?: string }) => {
    const params = new URLSearchParams();
    const merged = { form, status, q: query, ...next };
    Object.entries(merged).forEach(([k, v]) => v && params.set(k, v));
    router.push(`${pathname}?${params.toString()}`);
  };
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1.4fr]">
      <Select value={form} onChange={(v) => go({ form: v })} options={[{ value: '', label: 'All forms' }, ...forms]} />
      <Select
        value={status}
        onChange={(v) => go({ status: v })}
        options={[
          { value: '', label: 'Open (not archived)' },
          { value: 'NEW', label: 'New' },
          { value: 'IN_PROGRESS', label: 'In progress' },
          { value: 'DONE', label: 'Done' },
          { value: 'ARCHIVED', label: 'Archived' },
        ]}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go({ q: query });
        }}
      >
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search names, emails, messages… (Enter)" aria-label="Search submissions" />
      </form>
    </div>
  );
}
