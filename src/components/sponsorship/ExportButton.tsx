'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button, Dialog, Select, Switch } from '@/components/admin/ui';

/** Asks for the format and whether to include sensitive fields, then downloads. */
export function ExportButton({ query = '', ids, label = 'Export' }: { query?: string; ids?: string[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState('xlsx');
  const [sensitive, setSensitive] = useState(false);

  function download() {
    const params = new URLSearchParams(query);
    params.set('format', format);
    if (sensitive) params.set('sensitive', '1');
    if (ids?.length) params.set('ids', ids.join(','));
    window.location.href = `/api/sponsorship/export?${params}`;
    setOpen(false);
  }

  return (
    <>
      <Button variant="outline" size={ids ? 'sm' : 'md'} onClick={() => setOpen(true)}>
        <Download className="h-4 w-4" /> {label}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={label}>
        <div className="space-y-4">
          <Select id="export-format" value={format} onChange={setFormat} options={[{ value: 'xlsx', label: 'Excel (.xlsx)' }, { value: 'csv', label: 'CSV' }]} />
          <Switch id="export-sensitive" checked={sensitive} onChange={setSensitive} label="Include sensitive fields (ID numbers, health information)" />
          {sensitive && <p className="rounded-lg bg-gold-tint px-3 py-2 text-sm text-gold-deep">This file will show ID numbers and health information in plain text. Keep it private and delete it when you are done.</p>}
          <p className="text-xs text-ink/55">This export will be recorded in the audit log.</p>
          <Button onClick={download}>Download</Button>
        </div>
      </Dialog>
    </>
  );
}
