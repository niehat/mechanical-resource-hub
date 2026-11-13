import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTitle } from '../hooks/useTitle';
import { errorMessage } from '../lib/format';
import { Button } from '../components/ui';

export default function AdminLogin() {
  useTitle('Administrator sign in | Mechanical Academic Resource Hub');
  const { user, isAdmin, loading, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (isAdmin) {
      navigate('/admin', { replace: true });
    } else if (user) {
      setError('This account is not authorized to manage the website.');
      void signOut();
    }
  }, [loading, isAdmin, user, navigate, signOut]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page flex justify-center py-14">
      <form onSubmit={submit} className="card w-full max-w-md p-7" noValidate>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-white"><ShieldCheck className="h-5 w-5" aria-hidden /></span>
        <h1 className="mt-4 text-2xl font-semibold">Administrator sign in</h1>
        <p className="mt-1 text-sm text-slate-600">Only the authorized administrator can manage content. Students do not need to sign in.</p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="label">Email</label>
            <input id="login-email" type="email" autoComplete="username" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="login-password" className="label">Password</label>
            <input id="login-password" type="password" autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{error}</p>}
        <Button type="submit" className="mt-6 w-full" loading={busy || (loading && Boolean(user))} disabled={!email || !password}>Sign in</Button>
      </form>
    </div>
  );
}
