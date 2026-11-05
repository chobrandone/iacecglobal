'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { setStatus } from '@/app/admin/(panel)/sponsorship/_actions';
import { Button, Input, Select } from '@/components/admin/ui';

export function StatusControl({ id, status, options, exitReasons, canEmail }: { id: string; status: string; options: { value: string; label: string }[]; exitReasons: string[]; canEmail: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [exitReason, setExitReason] = useState('');
  const [other, setOther] = useState('');
  const [email, setEmail] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const res = await setStatus(id, value, exitReason === 'Other' ? other : exitReason, email);
    setBusy(false);
    if (!res.ok) return void toast.error(res.error ?? 'This could not be saved.');
    toast.success('Status updated');
    setExitReason('');
    setOther('');
    setEmail(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select id="status" value={value} onChange={setValue} options={options} className="w-auto" />
      {value === 'EXITED' && (
        <Select id="exit-reason" value={exitReason} onChange={setExitReason} options={[{ value: '', label: 'Exit reason…' }, ...exitReasons.map((r) => ({ value: r, label: r }))]} className="w-auto" />
      )}
      {value === 'EXITED' && exitReason === 'Other' && <Input aria-label="Other exit reason" placeholder="Please say why" value={other} onChange={(e) => setOther(e.target.value)} className="w-48" />}
      {canEmail && value !== status && (
        <label className="flex items-center gap-1.5 text-xs text-ink/70">
          <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} className="accent-gold" /> Email the caretaker
        </label>
      )}
      <Button variant="outline" onClick={save} disabled={busy || value === status}>
        Update status
      </Button>
    </div>
  );
}
