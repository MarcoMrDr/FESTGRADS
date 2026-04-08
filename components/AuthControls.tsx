'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export function AuthControls() {
  const { user, role, signOut } = useAuth();

  if (!user) {
    return <Link href="/login">Iniciar sesión</Link>;
  }

  return (
    <div className="auth-controls">
      <small>{role === 'superusuario' ? 'Superusuario' : 'Usuario'}</small>
      <button type="button" onClick={signOut} className="secondary">
        Cerrar sesión
      </button>
    </div>
  );
}
