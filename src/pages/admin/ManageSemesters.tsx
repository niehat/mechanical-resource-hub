import { useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { deleteSemester, getSemesterOverview, saveSemester } from '../../lib/api';
import { errorMessage, ordinalName } from '../../lib/format';
import type { SemesterOverview } from '../../lib/types';
import { Button, ConfirmDialog, EmptyState, ErrorState, Modal, PageLoader } from '../../components/ui';

export default function ManageSemesters() {
  const { push } = useToast();
  const query = useAsync(getSemesterOverview, []);
  const [editing, setEditing] = useState<SemesterOverview | 'new' | null>(null);
  const [deleting, setDeleting] = useState<SemesterOverview | null>(null);
  const [number, setNumber] = useState(1);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = query.data ?? [];
  const freeNumbers = [1, 2, 3, 4, 5, 6, 7, 8].filter((n) => !rows.some((r) => r.number === n));

  function openNew() {
    const first = freeNumbers[0] ?? 1;
    setNumber(first);
    setName(ordinalName(first));
    setError(null);
    setEditing('new');
  }
  function openEdit(row: SemesterOverview) {
    setNumber(row.number);
    setName(row.name);
    setError(null);
    setEditing(row);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !editing) return;
    if (!name.trim()) return setError('Enter a semester name.');
    setBusy(true);
    setError(null);
    try {
      await saveSemester({ number, name: name.trim() }, editing === 'new' ? undefined : editing.id);
      push('success', editing === 'new' ? 'Semester added.' : 'Semester updated.');
      setEditing(null);
      query.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Manage semesters</h1>
          <p className="mt-1 text-sm text-slate-600">The site supports semesters 1 to 8. Rename them, or re-add one you deleted.</p>
        </div>
        <Button onClick={openNew} disabled={freeNumbers.length === 0}><Plus className="h-4 w-4" aria-hidden /> Add semester</Button>
      </div>

      <div className="mt-6">
        {query.loading && !query.data && <PageLoader />}
        {query.error && <ErrorState message={query.error} onRetry={query.reload} />}
        {query.data && rows.length === 0 && <EmptyState title="No semesters" text="Use Add semester to create one." />}
        {rows.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead className="border-b border-navy-100 bg-navy-50 text-navy-800">
                <tr><th className="px-4 py-3 font-medium">Number</th><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Subjects</th><th className="px-4 py-3 font-medium">Resources</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">{r.number}</td>
                    <td className="px-4 py-3 font-medium text-navy-900">{r.name}</td>
                    <td className="px-4 py-3">{r.subject_count}</td>
                    <td className="px-4 py-3">{r.resource_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" className="btn-sm" onClick={() => openEdit(r)} aria-label={`Edit ${r.name}`}><Pencil className="h-4 w-4" aria-hidden /></Button>
                        <Button variant="ghost" className="btn-sm text-red-700" onClick={() => setDeleting(r)} aria-label={`Delete ${r.name}`}><Trash2 className="h-4 w-4" aria-hidden /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={editing !== null} title={editing === 'new' ? 'Add semester' : 'Edit semester'} onClose={() => setEditing(null)} busy={busy}>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="sem-number" className="label">Semester number</label>
            <select
              id="sem-number"
              className="input"
              value={number}
              disabled={editing !== 'new' || busy}
              onChange={(e) => {
                const n = Number(e.target.value);
                setNumber(n);
                setName(ordinalName(n));
              }}
            >
              {(editing === 'new' ? freeNumbers : [number]).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="sem-name" className="label">Display name</label>
            <input id="sem-name" className="input" value={name} maxLength={60} disabled={busy} onChange={(e) => setName(e.target.value)} />
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
        title="Delete this semester?"
        message={<>"{deleting?.name}" will be removed. A semester that still has subjects cannot be deleted; delete or move its subjects first.</>}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await deleteSemester(deleting.id);
          setDeleting(null);
          push('success', 'Semester deleted.');
          query.reload();
        }}
      />
    </div>
  );
}
