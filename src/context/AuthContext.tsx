import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { checkIsAdmin } from '../lib/api';

interface AuthValue {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

interface AdminCheckResult {
  userId: string;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Store the admin check result together with its user ID.
  const [adminResult, setAdminResult] =
    useState<AdminCheckResult | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) {
        console.error('[Session Error]', error);
      }

      setSession(data.session);
      setSessionLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
      }
    );

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) {
      setAdminResult(null);
      return;
    }

    let cancelled = false;

    checkIsAdmin(userId)
      .then((value) => {
        if (cancelled) return;

        console.log('[Admin Authorization Completed]', {
          userId,
          isAdmin: value,
        });

        setAdminResult({
          userId,
          isAdmin: value,
        });
      })
      .catch((error) => {
        if (cancelled) return;

        console.error('[Admin Authorization Failed]', error);

        setAdminResult({
          userId,
          isAdmin: false,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // A result is valid only for the currently signed-in user.
  // This prevents the login page from making an early decision.
  const isAdmin =
    Boolean(userId) &&
    adminResult?.userId === userId &&
    adminResult.isAdmin;

  const adminLoading =
    Boolean(userId) &&
    adminResult?.userId !== userId;

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw new Error('Incorrect email or password.');
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user: session?.user ?? null,
      isAdmin,
      loading: sessionLoading || adminLoading,
      signIn,
      signOut,
    }),
    [
      session,
      isAdmin,
      sessionLoading,
      adminLoading,
      signIn,
      signOut,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return ctx;
}
