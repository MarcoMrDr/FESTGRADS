'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, role, user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === 'login') {
      const result = await signIn(email, password);

      if (result.error) {
        setMensaje(result.error);
        return;
      }

      setMensaje('Sesión iniciada correctamente.');
      router.push('/eventos');
      return;
    }

    const result = await signUp(email, password);

    if (result.error) {
      setMensaje(result.error);
      return;
    }

    setMensaje(result.message ?? 'Cuenta creada correctamente.');
    setMode('login');
  };

  if (loading) {
    return <section className="card">Cargando...</section>;
  }

  if (user) {
    return (
      <section className="card">
        <h2>Ya iniciaste sesión</h2>
        <p>Rol actual: {role ?? 'usuario'}</p>
      </section>
    );
  }

  return (
    <section className="card auth-card">
      <div className="auth-header">
        <h2>Acceso al sistema</h2>
        <p>
          {mode === 'login'
            ? 'Inicia sesión para comprar boletos o administrar eventos.'
            : 'Crea tu cuenta. El usuario se crea en auth.users y su rol en public.perfiles.'}
        </p>
      </div>

      <div className="auth-tabs">
        <button
          type="button"
          className={mode === 'login' ? 'tab active' : 'tab'}
          onClick={() => setMode('login')}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          className={mode === 'register' ? 'tab active' : 'tab'}
          onClick={() => setMode('register')}
        >
          Crear cuenta
        </button>
      </div>

      <form onSubmit={onSubmit} className="form-grid">
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit">{mode === 'login' ? 'Entrar' : 'Crear cuenta'}</button>
      </form>

      {mensaje && <p>{mensaje}</p>}
    </section>
  );
}
