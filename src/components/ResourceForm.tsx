import { useState, type ChangeEvent, type FormEvent } from 'react';
import { FileUp } from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { createResource, listSemesters, listSubjectsAll, updateResource, validatePdf } from '../lib/api';
import { CATEGORIES, MAX_PDF_MB } from '../lib/constants';
import { errorMessage, formatBytes } from '../lib/format';
import type { Category, Resource } from '../lib/types';
import { useToast } from '../context/ToastContext';
import { Button } from './ui';

interface Props {
  /** When set, the subject is fixed and the semester/subject pickers are hidden. */
  fixedSubjectId?: string;
  /** When set, the form edits this resource instead of creating a new one. */
  resource?: Resource;
  defaultCategory?: Category;
  onSaved: () => void;
  onCancel?: () => void;
}

export function ResourceForm({ fixedSubjectId, resource, defaultCategory, onSaved, onCancel }: Props) {
  const { push } = useToast();
  const subjectsQuery = useAsync(listSubjectsAll, []);
  const semestersQuery = useAsync(listSemesters, []);

  const [subjectId, setSubjectId] = useState(fixedSubjectId ?? resource?.subject_id ?? '');
  const [pickedSemester, setPickedSemester] = useState('');
  const [title, setTitle] = useState(resource?.title ?? '');
  const [author, setAuthor] = useState(resource?.author ?? '');
  const [description, setDescription] = useState(resource?.description ?? '');
  const [category, setCategory] = useState<Category>(resource?.category ?? defaultCategory ?? 'reference_book');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const subjects = subjectsQuery.data ?? [];
  const semesters = semestersQuery.data ?? [];
  const semesterId = pickedSemester || subjects.find((s) => s.id === subjectId)?.semester_id || '';
  const visibleSubjects = semesterId ? subjects.filter((s) => s.semester_id === semesterId) : [];

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const chosen = input.files?.[0] ?? null;
    if (!chosen) {
      setFile(null);
      return;
    }
    try {
      await validatePdf(chosen);
      setFile(chosen);
      setError(null);
    } catch (err) {
      setFile(null);
      input.value = '';
      setError(errorMessage(err));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return; // prevents duplicate submissions
    setError(null);
    if (!subjectId) return setError('Choose a semester and a subject.');
    if (!title.trim()) return setError('Enter a title for this resource.');
    if (!resource && !file) return setError('Choose a PDF file to upload.');

    setBusy(true);
    setProgress(0);
    try {
      const input = {
        subject_id: subjectId,
        title: title.trim(),
        author: author.trim() || null,
        description: description.trim() || null,
        category,
      };
      if (resource) {
        await updateResource(resource, input, file, setProgress);
        push('success', 'Resource updated.');
      } else {
        await createResource(input, file as File, setProgress);
        push('success', 'Resource uploaded. It now appears in its subject.');
      }
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {!fixedSubjectId && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rf-semester" className="label">Semester</label>
            <select
              id="rf-semester"
              className="input"
              value={semesterId}
              disabled={busy}
              onChange={(e) => {
                setPickedSemester(e.target.value);
                setSubjectId('');
              }}
            >
              <option value="">Select a semester</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rf-subject" className="label">Subject</label>
            <select id="rf-subject" className="input" value={subjectId} disabled={busy || !semesterId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">{semesterId ? 'Select a subject' : 'Choose a semester first'}</option>
              {visibleSubjects.map((s) => (
                <option key={s.id} value={s.id}>{s.code ? `${s.name} (${s.code})` : s.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      {!fixedSubjectId && semesterId && visibleSubjects.length === 0 && !subjectsQuery.loading && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">This semester has no subjects yet. Add a subject first.</p>
      )}

      <div>
        <label htmlFor="rf-title" className="label">Resource title</label>
        <input id="rf-title" className="input" value={title} maxLength={200} disabled={busy} onChange={(e) => setTitle(e.target.value)} placeholder="For example: Chapter 3 lecture notes" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rf-category" className="label">Category</label>
          <select id="rf-category" className="input" value={category} disabled={busy} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="rf-author" className="label">Author name <span className="font-normal text-slate-500">(optional)</span></label>
          <input id="rf-author" className="input" value={author} maxLength={150} disabled={busy} onChange={(e) => setAuthor(e.target.value)} />
        </div>
      </div>

      <div>
        <label htmlFor="rf-description" className="label">Short description</label>
        <textarea id="rf-description" className="input min-h-[90px]" value={description} maxLength={1000} disabled={busy} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div>
        <label htmlFor="rf-file" className="label">
          {resource ? 'Replace PDF file (optional)' : 'PDF file'}
        </label>
        <label htmlFor="rf-file" className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-navy-300 bg-navy-50/60 px-4 py-4 text-sm hover:bg-navy-50">
          <FileUp className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-navy-800">
            {file ? `${file.name} (${formatBytes(file.size)})` : resource ? `Current file: ${resource.file_name}` : `Choose a PDF, up to ${MAX_PDF_MB} MB`}
          </span>
        </label>
        <input id="rf-file" type="file" accept="application/pdf,.pdf" className="sr-only" disabled={busy} onChange={onFileChange} />
        <p className="mt-1.5 text-xs text-slate-500">The upload date is added automatically.</p>
      </div>

      {busy && file && (
        <div aria-live="polite">
          <div className="h-2 overflow-hidden rounded-full bg-navy-100">
            <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-600">{progress < 100 ? `Uploading… ${progress}%` : 'Saving…'}</p>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{error}</p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button>
        )}
        <Button type="submit" loading={busy}>{resource ? 'Save changes' : 'Upload resource'}</Button>
      </div>
    </form>
  );
}
