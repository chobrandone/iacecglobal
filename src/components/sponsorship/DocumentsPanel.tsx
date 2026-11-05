'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Download, ExternalLink, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { addDocument, replaceDocument, setDocumentVerified } from '@/app/admin/(panel)/sponsorship/_actions';
import { Badge, Button, Card } from '@/components/admin/ui';
import { uploadFile } from './upload';

export type DocRow = { id: string; type: string; filename: string; verified: boolean };
export type Slot = { type: string; label: string; required: boolean };

function FilePicker({ label, disabled, onFile }: { label: string; disabled: boolean; onFile: (file: File) => void }) {
  return (
    <label className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-navy/20 px-3 font-heading text-xs font-semibold text-navy hover:bg-navy/[0.04] ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
      <Upload className="h-3.5 w-3.5" aria-hidden="true" /> {label}
      <input
        type="file"
        accept="image/*,application/pdf"
        aria-label={label}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
    </label>
  );
}

export function DocumentsPanel({ applicationId, slots, documents }: { applicationId: string; slots: Slot[]; documents: DocRow[] }) {
  const router = useRouter();
  const token = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(work: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    try {
      const res = await work();
      if (!res.ok) toast.error(res.error ?? 'This could not be saved.');
      else router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  }

  async function upload(file: File) {
    const done = await uploadFile(file, token.current, () => undefined);
    token.current = done.token;
    return done.ref;
  }

  const add = (type: string, file: File) => run(async () => addDocument(applicationId, type, await upload(file), token.current));
  const replace = (id: string, file: File) => run(async () => replaceDocument(id, await upload(file), token.current));

  const others = documents.filter((d) => !slots.some((s) => s.type === d.type));
  const row = (d: DocRow) => (
    <li key={d.id} className="flex flex-wrap items-center gap-2 border-t border-navy/[0.06] py-2 text-sm">
      <span className="min-w-0 flex-1 truncate text-ink/75">{d.filename}</span>
      {d.verified && <Badge tone="green">Verified</Badge>}
      <a href={`/api/sponsorship/files/${d.id}`} target="_blank" rel="noreferrer" aria-label={`Open ${d.filename}`}>
        <Button size="sm" variant="ghost">
          <ExternalLink className="h-3.5 w-3.5" /> Open
        </Button>
      </a>
      <a href={`/api/sponsorship/files/${d.id}?download=1`} aria-label={`Download ${d.filename}`}>
        <Button size="sm" variant="ghost">
          <Download className="h-3.5 w-3.5" /> Download
        </Button>
      </a>
      <Button size="sm" variant={d.verified ? 'ghost' : 'secondary'} disabled={busy} onClick={() => run(() => setDocumentVerified(d.id, !d.verified))}>
        <Check className="h-3.5 w-3.5" /> {d.verified ? 'Unverify' : 'Mark verified'}
      </Button>
      <FilePicker label="Replace" disabled={busy} onFile={(f) => replace(d.id, f)} />
    </li>
  );

  return (
    <div className="space-y-3">
      {slots.map((slot) => {
        const files = documents.filter((d) => d.type === slot.type);
        return (
          <Card key={slot.type}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="min-w-0 flex-1 font-heading text-sm font-semibold text-navy">
                {slot.label}
                {slot.required && ' *'}
              </p>
              {files.length === 0 ? <Badge tone="red">Missing</Badge> : files.every((f) => f.verified) ? <Badge tone="green">Verified</Badge> : <Badge tone="gold">To verify</Badge>}
              <FilePicker label="Add file" disabled={busy} onFile={(f) => add(slot.type, f)} />
            </div>
            {files.length > 0 && <ul className="mt-3">{files.map(row)}</ul>}
          </Card>
        );
      })}
      <Card>
        <div className="flex items-center justify-between gap-2">
          <p className="font-heading text-sm font-semibold text-navy">Other files</p>
          <FilePicker label="Add file" disabled={busy} onFile={(f) => add('OTHER', f)} />
        </div>
        {others.length > 0 && <ul className="mt-3">{others.map(row)}</ul>}
      </Card>
    </div>
  );
}
