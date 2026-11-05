import type { FileRef } from '@/lib/sponsorship/fields';
import { MAX_FILE_BYTES } from '@/lib/sponsorship/schema';

const COMPRESS_OVER = 1024 * 1024;
const MAX_WIDTH = 2400;

/** Phone photos are shrunk before upload, which matters most on slow connections. */
async function compress(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.size <= COMPRESS_OVER) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_WIDTH / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, 'image/jpeg', 0.82));
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
}

function send(url: string, body: FormData, onProgress: (percent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('The upload did not finish. Please try again.')));
    xhr.onerror = () => reject(new Error('The connection was lost. Please try again.'));
    xhr.send(body);
  });
}

export async function uploadFile(original: File, token: string | null, onProgress: (percent: number) => void): Promise<{ ref: FileRef; token: string }> {
  const file = await compress(original);
  if (file.size > MAX_FILE_BYTES) throw new Error('Each file can be up to 10 MB.');

  const res = await fetch('/api/sponsorship/uploads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: token ?? undefined, mimeType: file.type, size: file.size }),
  });
  const target = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(target.error || 'This file could not be uploaded.');

  const body = new FormData();
  for (const [name, value] of Object.entries(target.fields as Record<string, string>)) body.append(name, value);
  body.append('file', file);
  await send(target.url, body, onProgress);
  return { token: target.token, ref: { key: target.key, filename: file.name.slice(0, 200), mimeType: file.type, size: file.size } };
}
