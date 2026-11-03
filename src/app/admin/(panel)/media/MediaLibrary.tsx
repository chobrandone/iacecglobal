'use client';

import { useRef, useState } from 'react';
import { Copy, FileText, Loader2, RefreshCw, Search, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { deleteMedia, updateMedia } from '@/app/admin/_actions/admin';
import { uploadMedia } from '@/components/admin/MediaPicker';
import { Button, Card, Dialog, Input, Label, PageTitle } from '@/components/admin/ui';

type Item = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string;
  focalX: number;
  focalY: number;
  createdAt: string;
};

export function MediaLibrary({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);

  const visible = items.filter((m) => !query || `${m.filename} ${m.alt}`.toLowerCase().includes(query.toLowerCase()));

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    for (const file of Array.from(files)) {
      try {
        const m = await uploadMedia(file);
        setItems((list) => [{ ...m, createdAt: String(m.createdAt) } as unknown as Item, ...list]);
        toast.success(`Uploaded ${file.name}`);
      } catch (e) {
        toast.error(`${file.name}: ${(e as Error).message}`);
      }
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function replace(files: FileList | null) {
    if (!files?.length || !editing) return;
    setBusy(true);
    try {
      const m = (await uploadMedia(files[0], editing.id)) as unknown as Item;
      setItems((list) => list.map((x) => (x.id === m.id ? { ...x, ...m } : x)));
      setEditing({ ...editing, ...m });
      toast.success('Replaced everywhere it is used');
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
    if (replaceRef.current) replaceRef.current.value = '';
  }

  async function saveEdit() {
    if (!editing) return;
    const res = await updateMedia(editing.id, { alt: editing.alt, focalX: editing.focalX, focalY: editing.focalY });
    if (!res.ok) return toast.error(res.error);
    setItems((list) => list.map((x) => (x.id === editing.id ? editing : x)));
    toast.success('Saved');
    setEditing(null);
  }

  async function remove() {
    if (!editing || !window.confirm('Delete this file? Pages using it will show an empty space until you choose another image.')) return;
    const res = await deleteMedia(editing.id);
    if (!res.ok) return toast.error(res.error);
    setItems((list) => list.filter((x) => x.id !== editing.id));
    setEditing(null);
    toast.success('Deleted');
  }

  return (
    <>
      <PageTitle
        title="Media library"
        description="Photos and documents used across the website. Images are resized and optimised automatically."
        actions={
          <Button variant="gold" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload files
          </Button>
        }
      />
      <input ref={fileRef} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={(e) => upload(e.target.files)} />
      <div
        className="mb-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          upload(e.dataTransfer.files);
        }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search — or drop files here to upload" className="pl-9" aria-label="Search media" />
        </div>
      </div>
      {visible.length === 0 ? (
        <Card className="text-center text-sm text-ink/50">No files found.</Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {visible.map((m) => (
            <button key={m.id} type="button" onClick={() => setEditing(m)} className="overflow-hidden rounded-xl border border-navy/10 bg-white text-left hover:border-gold">
              <span className="block aspect-[4/3] bg-mist">
                {m.mimeType.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.alt} loading="lazy" className="h-full w-full object-cover" style={{ objectPosition: `${m.focalX}% ${m.focalY}%` }} />
                ) : (
                  <span className="flex h-full items-center justify-center text-navy/40">
                    <FileText className="h-8 w-8" />
                  </span>
                )}
              </span>
              <span className="block truncate px-2.5 py-2 text-xs text-ink/70">{m.alt || m.filename}</span>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing?.filename ?? ''} wide>
        {editing && (
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
            <div>
              {editing.mimeType.startsWith('image/') ? (
                <div
                  className="relative cursor-crosshair overflow-hidden rounded-lg bg-mist"
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    setEditing({
                      ...editing,
                      focalX: Math.round(((e.clientX - r.left) / r.width) * 100),
                      focalY: Math.round(((e.clientY - r.top) / r.height) * 100),
                    });
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={editing.url} alt={editing.alt} className="w-full" />
                  <span
                    className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-gold/70 shadow"
                    style={{ left: `${editing.focalX}%`, top: `${editing.focalY}%` }}
                  />
                </div>
              ) : (
                <a href={editing.url} target="_blank" rel="noreferrer" className="text-navy underline">
                  Open document
                </a>
              )}
              {editing.mimeType.startsWith('image/') && (
                <p className="mt-2 text-xs text-ink/50">Click the photo to set its focal point — the part kept in view when it is cropped.</p>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="m-alt" help="Describe what the image shows, for people using screen readers.">
                  Description (alt text)
                </Label>
                <Input id="m-alt" value={editing.alt} onChange={(e) => setEditing({ ...editing, alt: e.target.value })} />
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs text-ink/60">
                <dt>Size</dt>
                <dd>{(editing.size / 1024).toFixed(0)} KB</dd>
                {editing.width && (
                  <>
                    <dt>Dimensions</dt>
                    <dd>
                      {editing.width} × {editing.height}
                    </dd>
                  </>
                )}
                <dt>Focal point</dt>
                <dd>
                  {editing.focalX}% / {editing.focalY}%
                </dd>
              </dl>
              <div className="flex flex-wrap gap-2">
                <Button onClick={saveEdit}>Save</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(new URL(editing.url, window.location.origin).toString());
                    toast.success('Link copied');
                  }}
                >
                  <Copy className="h-4 w-4" /> Copy link
                </Button>
                <Button variant="outline" onClick={() => replaceRef.current?.click()} disabled={busy}>
                  <RefreshCw className="h-4 w-4" /> Replace file
                </Button>
                <Button variant="ghost" onClick={remove}>
                  <Trash2 className="h-4 w-4 text-red-600" /> Delete
                </Button>
              </div>
              <input ref={replaceRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => replace(e.target.files)} />
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
