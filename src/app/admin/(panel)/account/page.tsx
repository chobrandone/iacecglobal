'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { changeOwnPassword } from '@/app/admin/_actions/admin';
import { Button, Card, Input, Label, PageTitle } from '@/components/admin/ui';

export default function AccountPage() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) return toast.error('The new passwords do not match.');
    const res = await changeOwnPassword({ current, next });
    if (!res.ok) return toast.error(res.error);
    toast.success('Password changed');
    setCurrent('');
    setNext('');
    setConfirm('');
  }

  return (
    <>
      <PageTitle title="My account" description="Change your password." />
      <Card className="max-w-md">
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label htmlFor="pw-current">Current password</Label>
            <Input id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pw-new" help="At least 10 characters.">
              New password
            </Label>
            <Input id="pw-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pw-confirm">Repeat new password</Label>
            <Input id="pw-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <Button type="submit">Change password</Button>
        </form>
      </Card>
    </>
  );
}
