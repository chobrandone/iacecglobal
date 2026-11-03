'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { SubmissionStatus } from '@prisma/client';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteSubmission, updateSubmission } from '@/app/admin/_actions/admin';
import { Button, Card, Label, Select, Textarea } from '@/components/admin/ui';

export function SubmissionActions({ id, status: initialStatus, notes: initialNotes }: { id: string; status: SubmissionStatus; notes: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const res = await updateSubmission(id, { status, notes });
    setBusy(false);
    if (res.ok) {
      toast.success('Saved');
      router.refresh();
    } else toast.error(res.error);
  }

  async function remove() {
    if (!window.confirm('Delete this submission permanently?')) return;
    const res = await deleteSubmission(id);
    if (res.ok) {
      toast.success('Deleted');
      router.push('/admin/submissions');
    } else toast.error(res.error);
  }

  return (
    <Card className="h-fit space-y-4">
      <div>
        <Label htmlFor="sub-status">Status</Label>
        <Select
          id="sub-status"
          value={status}
          onChange={(v) => setStatus(v as SubmissionStatus)}
          options={[
            { value: 'NEW', label: 'New' },
            { value: 'IN_PROGRESS', label: 'In progress' },
            { value: 'DONE', label: 'Done' },
            { value: 'ARCHIVED', label: 'Archived' },
          ]}
        />
      </div>
      <div>
        <Label htmlFor="sub-notes" help="Only visible to staff.">
          Internal notes
        </Label>
        <Textarea id="sub-notes" rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="flex justify-between">
        <Button onClick={save} disabled={busy}>
          Save
        </Button>
        <Button variant="ghost" onClick={remove}>
          <Trash2 className="h-4 w-4 text-red-600" /> Delete
        </Button>
      </div>
    </Card>
  );
}
