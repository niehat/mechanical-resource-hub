import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Search, Trash2, Upload } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';
import { deleteResource, listSemesters, listSubjectsAll, searchResources } from '../../lib/api';
import { CATEGORIES, categoryMeta } from '../../lib/constants';
import type { Category, ResourceDetail } from '../../lib/types';
import { Button, ConfirmDialog, EmptyState, ErrorState, Modal, PageLoader, Pagination } from '../../components/ui';
import { ResourceCard } from '../../components/ResourceCard';
import { ResourceForm } from '../../components/ResourceForm';

const PAGE = 10;

export default function ManageResources({ category }: { category?: Category }) {
  const { push } = useToast();
  const [q, setQ] = useState('');
  const dq = useDebounce(q, 350);
  const [semesterId, setSemesterId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [catFilter, setCatFilter] = useState<Category | ''>('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ResourceDetail | null>(null);
  const [deleting, setDeleting] = useState<ResourceDetail | null>(null);

  const activeCategory = category ?? catFilter;
  const semesters = useAsync(listSemesters, []);
  const subjects = useAsync(listSubjectsAll, []);
  const results = useAsync(
    () => searchResources({ q: dq, semesterId, subjectId, category: activeCategory, sort: 'newest', page, pageSize: PAGE }),
    [dq, semesterId, subjectId, activeCategory, page],
  );

  const subjectOptions = (subjects.data ?? []).filter((s) => !semesterId || s.semester_id === semesterId);
  const title = category ? `Manage ${categoryMeta(category).plural.toLowerCase()}` : 'Manage resources';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        <Link to="/admin/upload" className="btn btn-primary"><Upload className="h-4 w-4" aria-hidden /> Upload new resource</Link>
      </div>

      <div className="card mt-5 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-4">
          <label htmlFor="mr-q" className="sr-only">Search resources</label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" aria-hidden />
          <input id="mr-q" type="search" className="input pl-10" placeholder="Search by title, author, subject or teacher" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <div>
          <label htmlFor="mr-sem" className="label">Semester</label>
          <select id="mr-sem" className="input" value={semesterId} onChange={(e) => { setSemesterId(e.target.value); setSubjectId(''); setPage(1); }}>
            <option value="">All semesters</option>
            {(semesters.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="mr-sub" className="label">Subject</label>
          <select id="mr-sub" className="input" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setPage(1); }}>
            <option value="">All subjects</option>
            {subjectOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        {!category && (
          <div>
            <label htmlFor="mr-cat" className="label">Category</label>
            <select id="mr-cat" className="input" value={catFilter} onChange={(e) => { setCatFilter(e.target.value as Category | ''); setPage(1); }}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.plural}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {results.loading && !results.data && <PageLoader />}
        {results.error && <ErrorState message={results.error} onRetry={results.reload} />}
        {results.data && results.data.rows.length === 0 && <EmptyState title="No resources found" text="Change the filters, or upload a new resource." />}
        {results.data?.rows.map((r) => (
          <ResourceCard
            key={r.id}
            resource={r}
            showContext
            actions={
              <>
                <Button variant="ghost" className="btn-sm" onClick={() => setEditing(r)} aria-label={`Edit ${r.title}`}><Pencil className="h-4 w-4" aria-hidden /></Button>
                <Button variant="ghost" className="btn-sm text-red-700" onClick={() => setDeleting(r)} aria-label={`Delete ${r.title}`}><Trash2 className="h-4 w-4" aria-hidden /></Button>
              </>
            }
          />
        ))}
      </div>
      {results.data && <Pagination page={page} pageSize={PAGE} total={results.data.count} onChange={setPage} />}

      <Modal open={editing !== null} title="Edit resource" size="lg" onClose={() => setEditing(null)}>
        {editing && (
          <ResourceForm
            resource={editing}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              results.reload();
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this resource?"
        message={<>"{deleting?.title}" and its PDF file will be permanently deleted. This cannot be undone.</>}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await deleteResource(deleting);
          setDeleting(null);
          push('success', 'Resource deleted.');
          results.reload();
        }}
      />
    </div>
  );
}
