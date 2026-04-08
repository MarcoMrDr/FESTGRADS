'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

export type AppRole = 'superusuario' | 'usuario' | null;

type AuthContextType = {
  user: User | null;
  role: AppRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
};

const emptyAuthContext: AuthContextType = {
  user: null,
  role: null,
  loading: false,
  signIn: async () => ({ error: 'AuthProvider no está inicializado.' }),
  signUp: async () => ({ error: 'AuthProvider no está inicializado.' }),
  signOut: async () => {},
  refreshRole: async () => {}
};

const AuthContext = createContext<AuthContextType>(emptyAuthContext);

const SUPERUSER_EMAIL = process.env.NEXT_PUBLIC_SUPERUSER_EMAIL?.toLowerCase();

const getDefaultRole = (email?: string | null): Exclude<AppRole, null> => {
  const normalized = email?.toLowerCase();
  if (SUPERUSER_EMAIL && normalized === SUPERUSER_EMAIL) {
    return 'superusuario';
  }

  return 'usuario';
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);


  const ensureUsuarioRow = async (currentUser: User) => {
    if (!supabase || !currentUser.email) return;

    const defaultName = currentUser.email.split('@')[0] || 'usuario';

    const { error } = await supabase.from('usuarios').upsert(
      {
        email: currentUser.email,
        nombre: defaultName
      },
      {
        onConflict: 'email'
      }
    );

    if (error && error.code !== '23505') {
      console.warn('No se pudo sincronizar public.usuarios:', error.message);
    }
  };

  const ensureProfile = async (currentUser: User) => {
    if (!supabase) return;

    const defaultRole = getDefaultRole(currentUser.email);

    await supabase.from('perfiles').upsert({ id: currentUser.id, rol: defaultRole });
  };

  const loadRole = async (currentUser: User) => {
    if (!supabase) return;

    await ensureProfile(currentUser);
    await ensureUsuarioRow(currentUser);

    const { data } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', currentUser.id)
      .maybeSingle();

    const rol = data?.rol;
    if (rol === 'superusuario' || rol === 'usuario') {
      setRole(rol);
    } else {
      setRole(getDefaultRole(currentUser.email));
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const {
        data: { session }
      } = await supabase.auth.getSession();

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await loadRole(currentUser);
      }

      setLoading(false);
    };

    init();

    if (!supabase) return;

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await loadRole(currentUser);
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase no está configurado.' };

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: error.message };
    }

    return {};
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase no está configurado.' };

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      await ensureProfile(data.user);
      await ensureUsuarioRow(data.user);
    }

    return {
      message:
        'Cuenta creada. Si tienes confirmación por email activada en Supabase, revisa tu correo.'
    };
  };

  const signOut = async () => {
    if (!supabase) return;

    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  const refreshRole = async () => {
    if (user) {
      await loadRole(user);
    }
  };

  const value = useMemo(
    () => ({ user, role, loading, signIn, signUp, signOut, refreshRole }),
    [user, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
