'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Role } from '@prisma/client';
import { KeyRound, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { inviteUser, resetUserPassword, updateUser } from '@/app/admin/_actions/admin';
import { Badge, Button, Card, Dialog, Input, Label, PageTitle, Select, Switch } from '@/components/admin/ui';

type U = { id: string; name: string; email: string; role: Role; active: boolean; lastLoginAt: string | null };

const roles = [
  { value: 'ADMIN', label: 'Administrator — everything' },
  { value: 'EDITOR', label: 'Editor — pages, collections, media' },
  { value: 'SPONSORSHIP_COORDINATOR', label: 'Sponsorship Coordinator — sponsorship submissions' },
];

export function UsersManager({ users, meId }: { users: U[]; meId: string }) {
  const router = useRouter();
  const [inviting, setInviting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'EDITOR' as Role });
  const [password, setPassword] = useState<string | null>(null);

  async function invite() {
    const res = await inviteUser(form);
    if (!res.ok) return toast.error(res.error);
    setInviting(false);
    setPassword(res.data!.password);
    setForm({ name: '', email: '', role: 'EDITOR' });
    router.refresh();
  }

  async function change(u: U, patch: Partial<U>) {
    const next = { ...u, ...patch };
    const res = await updateUser(u.id, { role: next.role, active: next.active, name: next.name });
    if (!res.ok) return toast.error(res.error);
    toast.success('Updated');
    router.refresh();
  }

  async function reset(u: U) {
    if (!window.confirm(`Reset the password for ${u.email}?`)) return;
    const res = await resetUserPassword(u.id);
    if (!res.ok) return toast.error(res.error);
    setPassword(res.data!.password);
  }

  return (
    <>
      <PageTitle
        title="Users"
        description="People who can sign in to this admin, and what they can do."
        actions={
          <Button onClick={() => setInviting(true)}>
            <UserPlus className="h-4 w-4" /> Invite someone
          </Button>
        }
      />
      <div className="space-y-3">
        {users.map((u) => (
          <Card key={u.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="font-semibold text-navy">
                {u.name} {u.id === meId && <Badge tone="gold">You</Badge>} {!u.active && <Badge tone="muted">Inactive</Badge>}
              </p>
              <p className="truncate text-sm text-ink/60">{u.email}</p>
              <p className="text-xs text-ink/45">Last sign-in: {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-GB') : 'never'}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select value={u.role} onChange={(v) => change(u, { role: v as Role })} options={roles} className="sm:w-80" />
              <Switch checked={u.active} onChange={(v) => change(u, { active: v })} label="Active" />
              <Button size="sm" variant="outline" onClick={() => reset(u)}>
                <KeyRound className="h-3.5 w-3.5" /> Reset password
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={inviting} onClose={() => setInviting(false)} title="Invite someone">
        <div className="space-y-4">
          <div>
            <Label htmlFor="u-name">Name</Label>
            <Input id="u-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="u-email">Email</Label>
            <Input id="u-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="u-role">Role</Label>
            <Select id="u-role" value={form.role} onChange={(v) => setForm({ ...form, role: v as Role })} options={roles} />
          </div>
          <p className="text-xs text-ink/55">They will receive an email with a temporary password (if email sending is configured). It is also shown to you once.</p>
          <Button onClick={invite} disabled={!form.name || !form.email}>
            Create account
          </Button>
        </div>
      </Dialog>

      <Dialog open={!!password} onClose={() => setPassword(null)} title="Temporary password">
        <p className="text-sm text-ink/70">Share this password securely. It is shown only once; ask them to change it on the “My account” page.</p>
        <p className="mt-3 select-all rounded-lg bg-mist px-3 py-2 font-mono text-lg text-navy">{password}</p>
      </Dialog>
    </>
  );
}
