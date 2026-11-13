import { Component, useEffect, useState, type ButtonHTMLAttributes, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, BookOpen, ChevronLeft, ChevronRight, ClipboardList, FileText, Folder, Inbox,
  ListChecks, Loader2, X, type LucideIcon,
} from 'lucide-react';
import type { Category } from '../lib/types';
import { errorMessage } from '../lib/format';

/* ---------- Button ---------- */

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
};

export function Button({
  variant = 'primary',
  loading = false,
  className = '',
  children,
  disabled,
  type,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button {...rest} type={type ?? 'button'} disabled={disabled || loading} className={`btn ${VARIANT_CLASS[variant]} ${className}`}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

/* ---------- Loading / empty / error ---------- */

export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-3 text-navy-600" role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span className="text-sm">{label}…</span>
    </div>
  );
}

export function EmptyState({
  title,
  text,
  icon: Icon = Inbox,
  action,
}: {
  title: string;
  text?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-navy-200 bg-navy-50/50 px-6 py-10 text-center">
      <Icon className="h-8 w-8 text-navy-400" aria-hidden />
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      {text && <p className="mt-1 max-w-md text-sm text-slate-600">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center" role="alert">
      <AlertTriangle className="h-8 w-8 text-red-500" aria-hidden />
      <h3 className="mt-3 text-lg font-semibold text-red-900">Could not load this page</h3>
      <p className="mt-1 max-w-md text-sm text-red-800">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function NotFoundPanel({ title = 'Page not found', text = 'The page you are looking for does not exist or has been removed.' }: { title?: string; text?: string }) {
  return (
    <div className="container-page py-16">
      <EmptyState
        title={title}
        text={text}
        action={
          <Link to="/" className="btn btn-primary">
            Back to home
          </Link>
        }
      />
    </div>
  );
}

/* ---------- Modal and confirm ---------- */

export function Modal({
  open,
  title,
  onClose,
  children,
  size = 'md',
  busy = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'md' | 'lg';
  busy?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, busy, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/50 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-lift sm:rounded-2xl ${size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
      >
        <div className="flex items-center justify-between border-b border-navy-100 px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="rounded-lg p-1.5 text-navy-500 hover:bg-navy-100 disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title={title} onClose={onCancel} busy={busy}>
      <div className="text-sm text-slate-700">{message}</div>
      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant="danger" onClick={confirm} loading={busy}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* ---------- Pagination ---------- */

export function Pagination({ page, pageSize, total, onChange }: { page: number; pageSize: number; total: number; onChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav className="mt-6 flex items-center justify-between gap-3" aria-label="Pagination">
      <Button variant="secondary" className="btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="h-4 w-4" aria-hidden /> Previous
      </Button>
      <p className="text-sm text-slate-600">
        Page {page} of {pages}
      </p>
      <Button variant="secondary" className="btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next <ChevronRight className="h-4 w-4" aria-hidden />
      </Button>
    </nav>
  );
}

/* ---------- Category visuals ---------- */

const CATEGORY_STYLE: Record<Category, { icon: LucideIcon; badge: string }> = {
  reference_book: { icon: BookOpen, badge: 'bg-brand-50 text-brand-800 ring-brand-200' },
  study_material: { icon: FileText, badge: 'bg-sky-50 text-sky-800 ring-sky-200' },
  suggestion: { icon: ListChecks, badge: 'bg-amber-50 text-amber-800 ring-amber-200' },
  assignment: { icon: ClipboardList, badge: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  other: { icon: Folder, badge: 'bg-slate-100 text-slate-700 ring-slate-200' },
};

export function CategoryIcon({ category, className = 'h-5 w-5' }: { category: Category; className?: string }) {
  const Icon = CATEGORY_STYLE[category].icon;
  return <Icon className={className} aria-hidden />;
}

export function CategoryBadge({ category, label }: { category: Category; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${CATEGORY_STYLE[category].badge}`}>
      <CategoryIcon category={category} className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

/* ---------- Error boundary ---------- */

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container-page py-16">
          <ErrorState message="An unexpected problem occurred. Reload the page to continue." onRetry={() => window.location.reload()} />
        </div>
      );
    }
    return this.props.children;
  }
}
