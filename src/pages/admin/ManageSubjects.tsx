import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { deleteSubject, listSemesters, listSubjectsAll } from '../../lib/api';
import type { SubjectOverview } from '../../lib/types';
import { Button, ConfirmDialog, EmptyState, ErrorState, Modal, PageLoader } from '../../components/ui';
import { SubjectForm } from '../../components/SubjectForm';

export default function ManageSubjects() {
  const { push } = useToast();
  const subjects = useAsync(listSubjectsAll, []);
  const semesters = useAsync(listSemesters, []);
  const [semesterId, setSemesterId] = useState('');
  const [editing, setEditing] = useState<SubjectOverview | 'new' | null>(null);
  const [deleting, setDeleting] = useState<SubjectOverview | null>(null);

  const rows = useMemo(() => (subjects.data ?? []).filter((s) => !semesterId || s.semester_id === semesterId), [subjects.data, semesterId]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Manage subjects</h1>
          <p className="mt-1 text-sm text-slate-600">Subject names, codes, credit hours, teachers and descriptions.</p>
        </div>
        <Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" aria-hidden /> Add subject</Button>
      </div>

      <div className="mt-5 max-w-xs">
        <label htmlFor="ms-semester" className="label">Filter by semester</label>
        <select id="ms-semester" className="input" value={semesterId} onChange={(e) => setSemesterId(e.target.value)}>
          <option value="">All semesters</option>
          {(semesters.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="mt-6">
        {subjects.loading && !subjects.data && <PageLoader />}
        {subjects.error && <ErrorState message={subjects.error} onRetry={subjects.reload} />}
        {subjects.data && rows.length === 0 && (
          <EmptyState title="No subjects yet" text="Add the first subject for a semester to get started." action={<Button onClick={() => setEditing('new')}>Add subject</Button>} />
        )}
        {rows.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-navy-100 bg-navy-50 text-navy-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Subject</th><th className="px-4 py-3 font-medium">Code</th><th className="px-4 py-3 font-medium">Semester</th>
                  <th className="px-4 py-3 font-medium">Credits</th><th className="px-4 py-3 font-medium">Teacher</th><th className="px-4 py-3 font-medium">Resources</th><th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium text-navy-900"><Link className="hover:text-brand-700" to={`/semester/${s.semester_number}/subject/${s.id}`}>{s.name}</Link></td>
                    <td className="px-4 py-3">{s.code ?? '–'}</td>
                    <td className="px-4 py-3">{s.semester_name}</td>
                    <td className="px-4 py-3">   {s.credit_hours != null ? String(Number(s.credit_hours)) : '–'} </td>
                    <td className="px-4 py-3">{s.teacher_name ?? '–'}</td>
                    <td className="px-4 py-3">{s.resource_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" className="btn-sm" onClick={() => setEditing(s)} aria-label={`Edit ${s.name}`}><Pencil className="h-4 w-4" aria-hidden /></Button>
                        <Button variant="ghost" className="btn-sm text-red-700" onClick={() => setDeleting(s)} aria-label={`Delete ${s.name}`}><Trash2 className="h-4 w-4" aria-hidden /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={editing !== null} title={editing === 'new' ? 'Add subject' : 'Edit subject'} size="lg" onClose={() => setEditing(null)}>
        {editing && (
          <SubjectForm
            subject={editing === 'new' ? undefined : editing}
            fixedSemesterId={undefined}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              subjects.reload();
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this subject?"
        message={<>"{deleting?.name}" will be deleted together with all {deleting?.resource_count ?? 0} of its resources and their PDF files. This cannot be undone.</>}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await deleteSubject(deleting.id);
          setDeleting(null);
          push('success', 'Subject deleted.');
          subjects.reload();
        }}
      />
    </div>
  );
}
