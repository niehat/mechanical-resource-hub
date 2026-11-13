import { Settings } from 'lucide-react';

export function ConfigMissing() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-50 px-4">
      <div className="card max-w-lg p-8">
        <Settings className="h-8 w-8 text-brand-600" aria-hidden />
        <h1 className="mt-4 text-2xl font-semibold">Connect Supabase to finish setup</h1>
        <p className="mt-2 text-sm text-slate-600">
          This website needs two environment variables before it can load data. Add them in your hosting settings
          (or in a local <code className="rounded bg-navy-100 px-1">.env</code> file), then rebuild.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-navy-900 p-4 text-xs text-navy-100">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key`}
        </pre>
        <p className="mt-4 text-sm text-slate-600">The README explains where to find both values.</p>
      </div>
    </div>
  );
}
