'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { useCart } from '@/components/CartProvider';
import type { Evento } from '@/lib/types';

const EVENTS_FETCH_TIMEOUT_MS = 20000;
const EVENTS_FETCH_TIMEOUT_MS = 12000;

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const { addEventTicketToCart } = useCart();

  const fetchEventos = async () => {
    if (!supabase) {
      setMensaje('Configura Supabase para visualizar eventos.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EVENTS_FETCH_TIMEOUT_MS);

    setLoading(true);
    setMensaje('');

    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('id, titulo, descripcion, fecha, precio, limite_boletos')
        .order('fecha', { ascending: true })
        .abortSignal(controller.signal);
      const fetchPromise = supabase
        .from('eventos')
        .select('id, titulo, descripcion, fecha, precio, limite_boletos')
        .order('fecha', { ascending: true });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Tiempo de espera agotado al cargar eventos.')), EVENTS_FETCH_TIMEOUT_MS);
      });

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) {
        setMensaje(`No se pudieron cargar eventos: ${error.message}`);
        return;
      }

      const rows = (data as Evento[]) ?? [];
      setEventos(rows);
      if (rows.length === 0) {
        setMensaje('No hay eventos registrados.');
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        setMensaje('La carga tardó demasiado. Intenta nuevamente con Recargar eventos.');
      } else {
        setMensaje((error as Error).message);
      }
    } finally {
      clearTimeout(timeoutId);
      setMensaje((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchEventos();
  }, []);

  const onAddTicket = (evento: Evento) => {
    if (evento.limite_boletos <= 0) {
      setMensaje('Este evento ya no tiene boletos disponibles.');
      return;
    }

    const result = addEventTicketToCart(evento, 1);
    setMensaje(result);
  };

  return (
    <section className="card">
      <h2>Visualizar eventos</h2>
      {!isSupabaseConfigured && (
        <p className="warning">Faltan variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.</p>
      )}

      <button type="button" className="secondary" onClick={fetchEventos} disabled={loading}>
        {loading ? 'Cargando...' : 'Recargar eventos'}
      </button>

      {loading && <p>Cargando eventos...</p>}
      {mensaje && <p>{mensaje}</p>}
      {eventos.length > 0 && (
        <ul className="event-list">
          {eventos.map((evento) => (
            <li key={evento.id}>
              <h3>{evento.titulo}</h3>
              <p>{evento.descripcion}</p>
              <small>Fecha: {new Date(evento.fecha).toLocaleDateString('es-ES')}</small>
              <p>Precio boleto: ${evento.precio.toFixed(2)}</p>
              <p>Boletos disponibles: {evento.limite_boletos}</p>
              <button type="button" onClick={() => onAddTicket(evento)} disabled={evento.limite_boletos <= 0}>
                {evento.limite_boletos <= 0 ? 'Agotado' : 'Agregar 1 boleto al carrito'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p style={{ marginTop: '1.5rem' }}>
        ¿Buscas consumibles y paquetes? <Link href="/extras">Ver productos extras</Link>.
      </p>
    </section>
  );
}
