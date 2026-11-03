'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Loader2, Search, Upload } from 'lucide-react';
import { toast } from 'sonner';
import type { Media } from '@prisma/client';
import { listMedia } from '@/app/admin/_actions/admin';
import { MAX_UPLOAD_BYTES } from '@/lib/utils';
import { Button, Dialog, Input } from './ui';

const MAX_WIDTH = 2400;
const TOO_LARGE = 'Files must be 4 MB or smaller.';

/** Large photos are shrunk in the browser so they fit under the upload limit. GIFs and PDFs cannot be, so they are refused. */
async function fitUploadLimit(file: File): Promise<File> {
  if (file.size <= MAX_UPLOAD_BYTES) return file;
  if (!file.type.startsWith('image/') || file.type === 'image/gif') throw new Error(TOO_LARGE);

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error('This image could not be read.');
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d')!;
  // Safari cannot encode WebP and falls back to PNG, so it gets JPEG, which needs a solid background.
  const encode = (type: string, quality: number) => new Promise<Blob | null>((done) => canvas.toBlob(done, type, quality));
  const type = (await encode('image/webp', 0.5))?.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
  if (type === 'image/jpeg') {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.92, 0.8, 0.65]) {
    const blob = await encode(type, quality);
    if (blob && blob.size <= MAX_UPLOAD_BYTES) {
      return new File([blob], file.name.replace(/.[^.]+$/, '') + (type === 'image/webp' ? '.webp' : '.jpg'), { type });
    }
  }
  throw new Error(TOO_LARGE);
}

export async function uploadMedia(file: File, replaceId?: string): Promise<Media> {
  const body = new FormData();
  body.append('file', await fitUploadLimit(file));
  if (replaceId) body.append('replaceId', replaceId);
  const res = await fetch('/api/admin/media', { method: 'POST', body });
  const json = await res.json().catch(() => ({})); // Vercel's own errors are not JSON
  if (!res.ok) throw new Error(json.error || 'Upload failed');
  return json as Media;
}

export function MediaPicker({
  open,
  onClose,
  onSelect,
  accept = 'image/*',
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (m: Media) => void;
  accept?: string;
}) {
  const [items, setItems] = useState<Media[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      setItems(await listMedia(q));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => load(query), 250);
    return () => clearTimeout(t);
  }, [open, query, load]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const m = await uploadMedia(files[0]);
      toast.success('Uploaded');
      onSelect(m);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Choose from the media library" wide>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or description" className="pl-9" />
        </div>
        <Button variant="gold" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload new
        </Button>
        <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={(e) => onFiles(e.target.files)} />
      </div>
      {loading && !items.length ? (
        <p className="py-10 text-center text-sm text-ink/50">Loading…</p>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink/50">No files yet. Upload one to get started.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {items.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m)}
              className="group overflow-hidden rounded-lg border border-navy/10 text-left transition hover:border-gold hover:ring-2 hover:ring-gold/30"
            >
              <span className="block aspect-[4/3] bg-mist">
                {m.mimeType.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.alt} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-full items-center justify-center text-navy/40">
                    <FileText className="h-8 w-8" />
                  </span>
                )}
              </span>
              <span className="block truncate px-2 py-1.5 text-xs text-ink/70">{m.alt || m.filename}</span>
            </button>
          ))}
        </div>
      )}
    </Dialog>
  );
}
