'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteSubscriber } from '@/app/admin/_actions/admin';
import { Button } from '@/components/admin/ui';

export function DeleteSubscriber({ id, email }: { id: string; email: string }) {
  const router = useRouter();
  return (
    <Button
      size="icon"
      variant="ghost"
      aria-label={`Remove ${email}`}
      onClick={async () => {
        if (!window.confirm(`Remove ${email} from the mailing list?`)) return;
        const res = await deleteSubscriber(id);
        if (res.ok) {
          toast.success('Removed');
          router.refresh();
        } else toast.error(res.error);
      }}
    >
      <Trash2 className="h-4 w-4 text-red-600" />
    </Button>
  );
}
