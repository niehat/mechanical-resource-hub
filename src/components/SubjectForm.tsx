import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '../hooks/useAsync';
import { listSemesters, listTeachers, saveSubject } from '../lib/api';
import { errorMessage } from '../lib/format';
import type { SubjectOverview } from '../lib/types';
import { useToast } from '../context/ToastContext';
import { Button } from './ui';

interface Props {
  subject?: SubjectOverview;
  fixedSemesterId?: string;
  onSaved: () => void;
  onCancel: () => void;
}

export function SubjectForm({ subject, fixedSemesterId, onSaved, onCancel }: Props) {
  const { push } = useToast();
  const semesters = useAsync(listSemesters, []);
  const teachers = useAsync(listTeachers, []);

  const [semesterId, setSemesterId] = useState(subject?.semester_id ?? fixedSemesterId ?? '');
  const [name, setName] = useState(subject?.name ?? '');
  const [code, setCode] = useState(subject?.code ?? '');
  const [credits, setCredits] = useState(subject?.credit_hours != null ? String(subject.credit_hours) : '');
  const [teacherId, setTeacherId] = useState(subject?.teacher_id ?? '');
  const [description, setDescription] = useState(subject?.description ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    if (!semesterId) return setError('Choose a semester.');
    if (!name.trim()) return setError('Enter the subject name.');
    let creditHours: number | null = null;
    if (credits.trim()) {
      creditHours = Number(credits);
      if (!Number.isFinite(creditHours) || creditHours < 0 || creditHours > 99.9) return setError('Credit hours must be a number between 0 and 99.9.');
    }
    setBusy(true);
    try {
      await saveSubject(
        {
          semester_id: semesterId,
          teacher_id: teacherId || null,
          name: name.trim(),
          code: code.trim() || null,
          credit_hours: creditHours,
          description: description.trim() || null,
        },
        subject?.id,
      );
      push('success', subject ? 'Subject updated.' : 'Subject added.');
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {!fixedSemesterId && (
        <div>
          <label htmlFor="sf-semester" className="label">Semester</label>
          <select id="sf-semester" className="input" value={semesterId} disabled={busy} onChange={(e) => setSemesterId(e.target.value)}>
            <option value="">Select a semester</option>
            {(semesters.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label htmlFor="sf-name" className="label">Subject name</label>
        <input id="sf-name" className="input" value={name} maxLength={150} disabled={busy} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sf-code" className="label">Subject code</label>
          <input id="sf-code" className="input" value={code} maxLength={30} disabled={busy} onChange={(e) => setCode(e.target.value)} />
        </div>
        <div>
          <label htmlFor="sf-credits" className="label">Credit hours</label>
          <input id="sf-credits" className="input" inputMode="decimal" value={credits} disabled={busy} onChange={(e) => setCredits(e.target.value)} />
        </div>
      </div>
      <div>
        <label htmlFor="sf-teacher" className="label">Teacher</label>
        <select id="sf-teacher" className="input" value={teacherId} disabled={busy} onChange={(e) => setTeacherId(e.target.value)}>
          <option value="">No teacher assigned</option>
          {(teachers.data ?? []).map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-slate-500">
          Teacher missing from the list? Add them under <Link to="/admin/teachers" className="text-brand-700 underline">Teachers and course information</Link>.
        </p>
      </div>
      <div>
        <label htmlFor="sf-description" className="label">Course description</label>
        <textarea id="sf-description" className="input min-h-[100px]" value={description} maxLength={2000} disabled={busy} onChange={(e) => setDescription(e.target.value)} />
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button type="submit" loading={busy}>{subject ? 'Save changes' : 'Add subject'}</Button>
      </div>
    </form>
  );
}
