import { useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { deleteTeacher, listTeachers, saveTeacher } from '../../lib/api';
import { errorMessage } from '../../lib/format';
import type { Teacher } from '../../lib/types';
import { Button, ConfirmDialog, EmptyState, ErrorState, Modal, PageLoader } from '../../components/ui';

export default function ManageTeachers() {
  const { push } = useToast();
  const query = useAsync(listTeachers, []);
  const [editing, setEditing] = useState<Teacher | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Teacher | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function open(target: Teacher | 'new') {
    setName(target === 'new' ? '' : target.name);
    setPhone(target === 'new' ? '' : target.phone ?? '');
    setEmail(target === 'new' ? '' : target.email ?? '');
    setError(null);
    setEditing(target);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !editing) return;
    if (!name.trim()) return setError('Enter the teacher name.');
    setBusy(true);
    setError(null);
    try {
      await saveTeacher({ name: name.trim(), phone: phone.trim() || null, email: email.trim() || null }, editing === 'new' ? undefined : editing.id);
      push('success', editing === 'new' ? 'Teacher added.' : 'Teacher updated.');
      setEditing(null);
      query.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const rows = query.data ?? [];
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Teachers and course information</h1>
          <p className="mt-1 text-sm text-slate-600">Add teachers here, then assign them to subjects under Manage subjects.</p>
        </div>
        <Button onClick={() => open('new')}><Plus className="h-4 w-4" aria-hidden /> Add teacher</Button>
      </div>

      <div className="mt-6">
        {query.loading && !query.data && <PageLoader />}
        {query.error && <ErrorState message={query.error} onRetry={query.reload} />}
        {query.data && rows.length === 0 && <EmptyState title="No teachers yet" text="Add a teacher to show their name and contact number on subject pages." action={<Button onClick={() => open('new')}>Add teacher</Button>} />}
        {rows.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-navy-100 bg-navy-50 text-navy-800">
                <tr><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Phone</th><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 font-medium text-navy-900">{t.name}</td>
                    <td className="px-4 py-3">{t.phone ?? '–'}</td>
                    <td className="px-4 py-3">{t.email ?? '–'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" className="btn-sm" onClick={() => open(t)} aria-label={`Edit ${t.name}`}><Pencil className="h-4 w-4" aria-hidden /></Button>
                        <Button variant="ghost" className="btn-sm text-red-700" onClick={() => setDeleting(t)} aria-label={`Delete ${t.name}`}><Trash2 className="h-4 w-4" aria-hidden /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={editing !== null} title={editing === 'new' ? 'Add teacher' : 'Edit teacher'} onClose={() => setEditing(null)} busy={busy}>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="t-name" className="label">Name</label>
            <input id="t-name" className="input" value={name} maxLength={120} disabled={busy} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="t-phone" className="label">Contact number</label>
            <input id="t-phone" className="input" type="tel" value={phone} maxLength={40} disabled={busy} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label htmlFor="t-email" className="label">Email <span className="font-normal text-slate-500">(optional)</span></label>
            <input id="t-email" className="input" type="email" value={email} maxLength={150} disabled={busy} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button>
            <Button type="submit" loading={busy}>Save</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this teacher?"
        message={<>"{deleting?.name}" will be removed. Their subjects stay, but will show "Not assigned" until you choose another teacher.</>}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await deleteTeacher(deleting.id);
          setDeleting(null);
          push('success', 'Teacher deleted.');
          query.reload();
        }}
      />
    </div>
  );
}
