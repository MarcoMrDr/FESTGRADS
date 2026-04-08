'use client';

import { useState } from 'react';
import { useCart } from '@/components/CartProvider';
import { MANUAL_EXTRAS } from '@/lib/manualProducts';
import type { ExtraProducto } from '@/lib/types';

export default function ExtrasPage() {
  const { addExtraToCart } = useCart();
  const [mensaje, setMensaje] = useState('');

  const onAddExtra = (extra: ExtraProducto) => {
    const result = addExtraToCart(extra, 1);
    setMensaje(result);
  };

  return (
    <section className="card">
      <h2>Productos extras</h2>
      <p>
        Aquí se listan los extras para no sobrecargar la pantalla de eventos. Se siguen agregando al mismo carrito de
        compra.
      </p>

      <ul className="event-list">
        {MANUAL_EXTRAS.map((extra) => (
          <li key={extra.id}>
            <h3>{extra.nombre}</h3>
            <p>Precio: ${extra.precio.toFixed(2)}</p>
            <p>Disponibles: {extra.stock}</p>
            <button type="button" onClick={() => onAddExtra(extra)}>
              Agregar al carrito
            </button>
          </li>
        ))}
      </ul>

      {mensaje && <p>{mensaje}</p>}
    </section>
  );
}
