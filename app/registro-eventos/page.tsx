'use client';

import { FormEvent, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';

export default function RegistroEventosPage() {
  const { role, loading } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [precio, setPrecio] = useState('');
  const [limiteBoletos, setLimiteBoletos] = useState('');
  const [mensaje, setMensaje] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (role !== 'superusuario') {
      setMensaje('No tienes permisos para registrar eventos.');
      return;
    }

    if (!supabase) {
      setMensaje('Configura Supabase para guardar eventos.');
      return;
    }

    const { error } = await supabase.from('eventos').insert({
      titulo,
      descripcion,
      fecha,
      precio: Number(precio),
      limite_boletos: Number(limiteBoletos)
    });

    if (error) {
      setMensaje(`Error: ${error.message}`);
      return;
    }

    setTitulo('');
    setDescripcion('');
    setFecha('');
    setPrecio('');
    setLimiteBoletos('');
    setMensaje('Evento registrado correctamente.');
  };

  if (loading) return <section className="card">Cargando...</section>;

  if (role !== 'superusuario') {
    return (
      <section className="card">
        <h2>Acceso restringido</h2>
        <p>Solo el superusuario puede registrar eventos.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Registro de eventos</h2>
      {!isSupabaseConfigured && (
        <p className="warning">Faltan variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.</p>
      )}
      <form onSubmit={onSubmit} className="form-grid">
        <label>
          Título
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        </label>
        <label>
          Descripción
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
        </label>
        <label>
          Fecha
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </label>
        <label>
          Precio por boleto (USD)
          <input
            type="number"
            min="1"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
          />
        </label>
        <label>
          Límite de boletos
          <input
            type="number"
            min="1"
            step="1"
            value={limiteBoletos}
            onChange={(e) => setLimiteBoletos(e.target.value)}
            required
          />
        </label>
        <button type="submit">Guardar evento</button>
      </form>
      {mensaje && <p>{mensaje}</p>}
    </section>
  );
}
