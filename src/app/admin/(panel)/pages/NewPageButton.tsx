'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createPage } from '@/app/admin/_actions/content';
import { Button, Dialog, Input, Label } from '@/components/admin/ui';
import { slugify } from '@/lib/utils';

export function NewPageButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    const res = await createPage({ title, slug });
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success('Page created as a draft');
    router.push(`/admin/pages/${res.data!.id}`);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New page
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="New page">
        <div className="space-y-4">
          <div>
            <Label htmlFor="np-title">Title</Label>
            <Input id="np-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="np-slug" help="The page will be available at iacecglobal.com/your-address">
              Web address
            </Label>
            <Input id="np-slug" value={slug} placeholder={slugify(title)} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <Button onClick={create} disabled={busy || !title}>
            Create page
          </Button>
        </div>
      </Dialog>
    </>
  );
}
