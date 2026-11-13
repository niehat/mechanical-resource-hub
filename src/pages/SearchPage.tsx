import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { useDebounce } from '../hooks/useDebounce';
import { useTitle } from '../hooks/useTitle';
import { listSemesters, listSubjectsAll, listTeachers, searchResources } from '../lib/api';
import { CATEGORIES, PAGE_SIZE } from '../lib/constants';
import type { Category } from '../lib/types';
import { Button, EmptyState, ErrorState, Pagination } from '../components/ui';
import { ResourceCard } from '../components/ResourceCard';

export default function SearchPage() {
  useTitle('Search resources | Mechanical Academic Resource Hub');
  const [params, setParams] = useSearchParams();

  const q = params.get('q') ?? '';
  const semesterId = params.get('semester') ?? '';
  const subjectId = params.get('subject') ?? '';
  const category = (params.get('category') ?? '') as Category | '';
  const teacherId = params.get('teacher') ?? '';
  const fileType = params.get('type') ?? '';
  const sort = params.get('sort') === 'alpha' ? 'alpha' : 'newest';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const [input, setInput] = useState(q);
  const debounced = useDebounce(input, 350);
  const [filtersOpen, setFiltersOpen] = useState(false);

  function update(patch: Record<string, string>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  }

  useEffect(() => {
    if (debounced.trim() !== q.trim()) update({ q: debounced.trim(), page: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const semesters = useAsync(listSemesters, []);
  const subjects = useAsync(listSubjectsAll, []);
  const teachers = useAsync(listTeachers, []);
  const subjectOptions = useMemo(
    () => (subjects.data ?? []).filter((s) => !semesterId || s.semester_id === semesterId),
    [subjects.data, semesterId],
  );

  const results = useAsync(
    () => searchResources({ q, semesterId, subjectId, category, teacherId, fileType, sort, page, pageSize: PAGE_SIZE }),
    [q, semesterId, subjectId, category, teacherId, fileType, sort, page],
  );

  const hasFilters = Boolean(q || semesterId || subjectId || category || teacherId || fileType);
  function clearAll() {
    setInput('');
    setParams(new URLSearchParams(), { replace: true });
  }

  const filters = (
    <div className="space-y-4">
      <div>
        <label htmlFor="f-semester" className="label">Semester</label>
        <select id="f-semester" className="input" value={semesterId} onChange={(e) => update({ semester: e.target.value, subject: '', page: '' })}>
          <option value="">All semesters</option>
          {(semesters.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="f-subject" className="label">Subject</label>
        <select id="f-subject" className="input" value={subjectId} onChange={(e) => update({ subject: e.target.value, page: '' })}>
          <option value="">All subjects</option>
          {subjectOptions.map((s) => <option key={s.id} value={s.id}>{s.code ? `${s.name} (${s.code})` : s.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="f-category" className="label">Resource category</label>
        <select id="f-category" className="input" value={category} onChange={(e) => update({ category: e.target.value, page: '' })}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.plural}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="f-teacher" className="label">Teacher</label>
        <select id="f-teacher" className="input" value={teacherId} onChange={(e) => update({ teacher: e.target.value, page: '' })}>
          <option value="">All teachers</option>
          {(teachers.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="f-type" className="label">File type</label>
        <select id="f-type" className="input" value={fileType} onChange={(e) => update({ type: e.target.value, page: '' })}>
          <option value="">All types</option>
          <option value="pdf">PDF</option>
        </select>
      </div>
      <div>
        <label htmlFor="f-sort" className="label">Sort by</label>
        <select id="f-sort" className="input" value={sort} onChange={(e) => update({ sort: e.target.value === 'alpha' ? 'alpha' : '', page: '' })}>
          <option value="newest">Newest uploaded</option>
          <option value="alpha">Alphabetical (A to Z)</option>
        </select>
      </div>
      <Button variant="secondary" className="w-full" onClick={clearAll} disabled={!hasFilters && sort === 'newest'}>
        <X className="h-4 w-4" aria-hidden /> Clear all filters
      </Button>
    </div>
  );

  return (
    <div className="container-page py-8 sm:py-10">
      <h1 className="text-3xl font-semibold sm:text-4xl">Search resources</h1>
      <p className="mt-1 text-slate-600">Search across every semester, subject, teacher and document.</p>

      <div className="mt-6 flex gap-2">
        <div className="relative flex-1">
          <label htmlFor="search-input" className="sr-only">Search keyword</label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" aria-hidden />
          <input
            id="search-input"
            type="search"
            className="input py-3 pl-11"
            placeholder="Type a subject, code, teacher, book title or topic"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus={!q}
          />
        </div>
        <Button variant="secondary" className="lg:hidden" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen}>
          <SlidersHorizontal className="h-4 w-4" aria-hidden /> Filters
        </Button>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className={`${filtersOpen ? 'block' : 'hidden'} lg:block`} aria-label="Filters">
          <div className="card p-4 lg:sticky lg:top-24">{filters}</div>
        </aside>

        <section aria-live="polite">
          {results.loading && !results.data && <p className="py-10 text-center text-sm text-slate-500">Searching…</p>}
          {results.error && <ErrorState message={results.error} onRetry={results.reload} />}
          {results.data && (
            <>
              <p className="mb-4 text-sm text-slate-600">
                {results.data.count} {results.data.count === 1 ? 'result' : 'results'}
                {q && <> for <strong className="text-navy-900">{q}</strong></>}
              </p>
              {results.data.rows.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="No matching resources"
                  text={hasFilters ? 'Try a shorter keyword or remove some filters.' : 'No resources have been uploaded yet.'}
                  action={hasFilters ? <Button variant="secondary" onClick={clearAll}>Clear all filters</Button> : undefined}
                />
              ) : (
                <div className={`space-y-3 transition-opacity ${results.loading ? 'opacity-60' : ''}`}>
                  {results.data.rows.map((r) => <ResourceCard key={r.id} resource={r} showContext />)}
                </div>
              )}
              <Pagination page={page} pageSize={PAGE_SIZE} total={results.data.count} onChange={(p) => { update({ page: p > 1 ? String(p) : '' }); window.scrollTo({ top: 0 }); }} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
