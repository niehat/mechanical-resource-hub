import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, Download, ExternalLink } from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { useTitle } from '../hooks/useTitle';
import { getResource, publicUrl } from '../lib/api';
import { categoryMeta } from '../lib/constants';
import { formatBytes, formatDate } from '../lib/format';
import { CategoryBadge, ErrorState, NotFoundPanel, PageLoader } from '../components/ui';

const IS_MOBILE = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export default function ResourceViewer() {
  const { id = '' } = useParams();
  const query = useAsync(() => getResource(id), [id]);
  const [compat, setCompat] = useState(IS_MOBILE);
  useTitle(query.data ? `${query.data.title} | Mechanical Academic Resource Hub` : 'PDF viewer | Mechanical Academic Resource Hub');

  if (query.loading && !query.data) return <PageLoader label="Opening document" />;
  if (query.error) return <div className="container-page py-10"><ErrorState message={query.error} onRetry={query.reload} /></div>;
  if (!query.data) return <NotFoundPanel title="Document not found" text="This resource does not exist or has been removed." />;

  const r = query.data;
  const url = publicUrl(r.file_path);
  const downloadUrl = publicUrl(r.file_path, r.file_name);
  const embedSrc = compat ? `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}` : `${url}#toolbar=1&navpanes=0`;

  return (
    <div className="container-page py-6 sm:py-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
        <Link to={`/semester/${r.semester_number}`} className="hover:text-brand-700">{r.semester_name}</Link>
        <ChevronRight className="h-4 w-4" aria-hidden />
        <Link to={`/semester/${r.semester_number}/subject/${r.subject_id}`} className="hover:text-brand-700">{r.subject_name}</Link>
      </nav>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold sm:text-3xl">{r.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600">
            <CategoryBadge category={r.category} label={categoryMeta(r.category).label} />
            <span>{r.subject_name}{r.subject_code ? `, ${r.subject_code}` : ''}</span>
            <span>Uploaded {formatDate(r.created_at)}</span>
            {r.file_size ? <span>{formatBytes(r.file_size)}</span> : null}
          </div>
          {r.description && <p className="mt-3 max-w-3xl text-sm text-slate-600">{r.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={downloadUrl} download={r.file_name} className="btn btn-primary"><Download className="h-4 w-4" aria-hidden /> Download</a>
          <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary"><ExternalLink className="h-4 w-4" aria-hidden /> Open in new tab</a>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-navy-100 bg-navy-50 shadow-card">
        <iframe
          key={embedSrc}
          title={`PDF: ${r.title}`}
          src={embedSrc}
          className="block w-full bg-white"
          style={{ height: 'max(480px, calc(100vh - 260px))' }}
        />
      </div>

      <p className="mt-3 text-sm text-slate-600">
        {compat ? 'Showing the compatibility viewer, which works on most phones. ' : 'Not displaying correctly on your device? '}
        <button type="button" className="font-medium text-brand-700 underline-offset-2 hover:underline" onClick={() => setCompat((v) => !v)}>
          {compat ? 'Switch to the browser viewer' : 'Try the compatibility viewer'}
        </button>
        . You can always use Download or Open in new tab.
      </p>
    </div>
  );
}
