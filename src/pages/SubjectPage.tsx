import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, ClipboardList, Pencil, Phone, Plus, Trash2, UserRound, Mail } from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { useTitle } from '../hooks/useTitle';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { deleteResource, getResourcesForSubject, getSubject } from '../lib/api';
import { CATEGORIES, type CategoryMeta } from '../lib/constants';
import type { Resource } from '../lib/types';
import { Button, CategoryIcon, ConfirmDialog, EmptyState, ErrorState, Modal, NotFoundPanel, PageLoader } from '../components/ui';
import { ResourceCard } from '../components/ResourceCard';
import { ResourceForm } from '../components/ResourceForm';

const INITIAL_VISIBLE = 6;

function CategorySection({
  meta,
  items,
  isAdmin,
  onEdit,
  onDelete,
}: {
  meta: CategoryMeta;
  items: Resource[];
  isAdmin: boolean;
  onEdit: (r: Resource) => void;
  onDelete: (r: Resource) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? items : items.slice(0, INITIAL_VISIBLE);
  return (
    <section id={meta.value} aria-labelledby={`${meta.value}-heading`} className="scroll-mt-24">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <CategoryIcon category={meta.value} />
        </span>
        <div>
          <h2 id={`${meta.value}-heading`} className="text-xl font-semibold">
            {meta.plural} <span className="ml-1 font-sans text-base font-normal text-slate-500">({items.length})</span>
          </h2>
          <p className="text-sm text-slate-500">{meta.hint}</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <EmptyState title="Nothing here yet" text={meta.emptyText} />
        ) : (
          shown.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              actions={
                isAdmin && (
                  <>
                    <Button variant="ghost" className="btn-sm" onClick={() => onEdit(r)} aria-label={`Edit ${r.title}`}>
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button variant="ghost" className="btn-sm text-red-700" onClick={() => onDelete(r)} aria-label={`Delete ${r.title}`}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </>
                )
              }
            />
          ))
        )}
        {items.length > INITIAL_VISIBLE && (
          <Button variant="secondary" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Show fewer' : `Show all ${items.length}`}
          </Button>
        )}
      </div>
    </section>
  );
}

export default function SubjectPage() {
  const { subjectId = '' } = useParams();
  const { isAdmin } = useAuth();
  const { push } = useToast();
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [deleting, setDeleting] = useState<Resource | null>(null);

  const query = useAsync(async () => {
    const subject = await getSubject(subjectId);
    if (!subject) return null;
    const resources = await getResourcesForSubject(subjectId);
    return { subject, resources };
  }, [subjectId]);

  useTitle(query.data ? `${query.data.subject.name} | Mechanical Academic Resource Hub` : 'Subject | Mechanical Academic Resource Hub');

  if (query.loading && !query.data) return <PageLoader label="Loading subject" />;
  if (query.error) return <div className="container-page py-10"><ErrorState message={query.error} onRetry={query.reload} /></div>;
  if (!query.data) return <NotFoundPanel title="Subject not found" text="This subject does not exist or has been removed." />;

  const { subject, resources } = query.data;
  const byCategory = (value: string) => resources.filter((r) => r.category === value);
  const assignmentTotal = byCategory('assignment').length;

  return (
    <div className="container-page py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
        <Link to="/" className="hover:text-brand-700">Home</Link>
        <ChevronRight className="h-4 w-4" aria-hidden />
        <Link to={`/semester/${subject.semester_number}`} className="hover:text-brand-700">{subject.semester_name}</Link>
        <ChevronRight className="h-4 w-4" aria-hidden />
        <span className="text-navy-900">{subject.name}</span>
      </nav>

      <header className="card mt-4 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold sm:text-4xl">{subject.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              {subject.code && <span className="rounded-md bg-navy-100 px-2 py-1 font-medium text-navy-800">{subject.code}</span>}
              <span className="rounded-md bg-brand-50 px-2 py-1 font-medium text-brand-800">{subject.semester_name}</span>
              <span className="rounded-md bg-navy-50 px-2 py-1 text-navy-700">
                {subject.credit_hours != null ? `${subject.credit_hours} credit hours` : 'Credit hours not set'}
              </span>
            </div>
          </div>
          {isAdmin && (
            <Button onClick={() => setUploading(true)}>
              <Plus className="h-4 w-4" aria-hidden /> Add new resource
            </Button>
          )}
        </div>

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
          <div className="flex items-start gap-2.5">
            <UserRound className="mt-0.5 h-4 w-4 text-navy-500" aria-hidden />
            <div><dt className="text-slate-500">Teacher</dt><dd className="font-medium text-navy-900">{subject.teacher_name ?? 'Not assigned'}</dd></div>
          </div>
          <div className="flex items-start gap-2.5">
            <Phone className="mt-0.5 h-4 w-4 text-navy-500" aria-hidden />
            <div>
              <dt className="text-slate-500">Teacher contact</dt>
              <dd className="font-medium text-navy-900">
                {subject.teacher_phone ? <a href={`tel:${subject.teacher_phone}`} className="hover:text-brand-700">{subject.teacher_phone}</a> : 'Not provided'}
              </dd>
              {subject.teacher_email && (
                <dd className="mt-0.5 flex items-center gap-1.5 text-slate-600"><Mail className="h-3.5 w-3.5" aria-hidden /> <a href={`mailto:${subject.teacher_email}`} className="hover:text-brand-700">{subject.teacher_email}</a></dd>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <ClipboardList className="mt-0.5 h-4 w-4 text-navy-500" aria-hidden />
            <div><dt className="text-slate-500">Assignments</dt><dd className="font-medium text-navy-900">{assignmentTotal} total</dd></div>
          </div>
        </dl>

        <div className="mt-6 border-t border-navy-100 pt-5">
          <h2 className="font-sans text-sm font-semibold text-navy-900">Course description</h2>
          <p className="mt-1.5 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {subject.description ?? 'No course description has been added yet.'}
          </p>
        </div>
      </header>

      <nav aria-label="Resource categories" className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <a key={c.value} href={`#${c.value}`} className="shrink-0 rounded-full bg-navy-50 px-3.5 py-1.5 text-sm text-navy-800 ring-1 ring-inset ring-navy-100 hover:bg-navy-100">
            {c.plural} ({byCategory(c.value).length})
          </a>
        ))}
      </nav>

      <div className="mt-8 space-y-12">
        {CATEGORIES.map((c) => (
          <CategorySection key={c.value} meta={c} items={byCategory(c.value)} isAdmin={isAdmin} onEdit={setEditing} onDelete={setDeleting} />
        ))}
      </div>

      <Modal open={uploading} title="Add new resource" size="lg" onClose={() => setUploading(false)}>
        <ResourceForm
          fixedSubjectId={subject.id}
          onCancel={() => setUploading(false)}
          onSaved={() => {
            setUploading(false);
            query.reload();
          }}
        />
      </Modal>

      <Modal open={editing !== null} title="Edit resource" size="lg" onClose={() => setEditing(null)}>
        {editing && (
          <ResourceForm
            resource={editing}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              query.reload();
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
          query.reload();
        }}
      />
    </div>
  );
}
