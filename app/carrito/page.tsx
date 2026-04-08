'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import { useAuth } from '@/components/AuthProvider';

const CONFIRM_TIMEOUT_MS = 15000;

export default function CarritoPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { items, totalPrice, updateQuantity, removeItem, clearCart } = useCart();
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const confirmingSessionRef = useRef<string | null>(null);

  const status = searchParams.get('status');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (status !== 'success' || !sessionId) {
      return;
    }

    const confirmedKey = `checkout-confirmed-${sessionId}`;
    if (sessionStorage.getItem(confirmedKey) === '1') {
      return;
    }

    if (confirmingSessionRef.current === sessionId) {
      return;
    }

    confirmingSessionRef.current = sessionId;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIRM_TIMEOUT_MS);

    const confirmPayment = async () => {
      try {
        setConfirmingPayment(true);

        const response = await fetch('/api/checkout/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
          signal: controller.signal
        });

        const data = await response.json();
        if (!response.ok) {
          setMensaje(data.error ?? 'El pago se realizó pero no pudimos confirmar los boletos.');
          return;
        }

        sessionStorage.setItem(confirmedKey, '1');
        clearCart();
        setMensaje(
          data.duplicate
            ? 'Pago confirmado. Esta compra ya estaba registrada anteriormente.'
            : 'Pago confirmado y boletos descontados correctamente.'
        );

        window.history.replaceState(null, '', '/carrito?status=success');
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          setMensaje('La confirmación tardó demasiado. Intenta recargar el carrito.');
          return;
        }

        setMensaje(`No se pudo confirmar el pago: ${(error as Error).message}`);
      } finally {
        clearTimeout(timeoutId);
        confirmingSessionRef.current = null;
        setConfirmingPayment(false);
      }
    };

    void confirmPayment();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [status, sessionId, clearCart]);

  const paymentStatusMessage = useMemo(() => {
    if (status === 'success') return 'Pago completado con éxito.';
    if (status === 'cancel') return 'Pago cancelado.';
    return '';
  }, [status]);

  const checkout = async () => {
    if (!user) {
      setMensaje('Debes iniciar sesión para comprar.');
      return;
    }

    try {
      setLoading(true);
      setMensaje('');

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });

      const data = await response.json();
      if (!response.ok) {
        setMensaje(data.error ?? 'No se pudo iniciar el checkout.');
        return;
      }

      if (!data.url) {
        setMensaje('Stripe no devolvió una URL de checkout.');
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      setMensaje(`Error al iniciar pago: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>Carrito de compra</h2>
      {!user && <p className="warning">Inicia sesión para completar la compra.</p>}
      {paymentStatusMessage && <p>{paymentStatusMessage}</p>}
      {confirmingPayment && <p>Confirmando pago...</p>}
      {items.length === 0 ? (
        <p>No hay productos en el carrito.</p>
      ) : (
        <>
          <ul className="event-list">
            {items.map((item) => (
              <li key={item.itemId}>
                <h3>{item.titulo}</h3>
                <p>Tipo: {item.tipo === 'boleto' ? 'Boleto' : 'Extra'}</p>
                <p>Precio: ${item.precio.toFixed(2)}</p>
                <label>
                  Cantidad
                  <input
                    type="number"
                    min="1"
                    max={item.maxCantidad}
                    value={item.cantidad}
                    onChange={(e) => updateQuantity(item.itemId, Number(e.target.value))}
                  />
                </label>
                <button type="button" onClick={() => removeItem(item.itemId)}>
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <p className="total">Total: ${totalPrice.toFixed(2)}</p>
          <div className="cart-actions">
            <button type="button" onClick={checkout} disabled={loading || confirmingPayment || !user}>
              {loading ? 'Redirigiendo...' : confirmingPayment ? 'Confirmando pago...' : 'Pagar con Stripe'}
            </button>
            <button type="button" onClick={clearCart} className="secondary">
              Vaciar carrito
            </button>
          </div>
        </>
      )}
      {mensaje && <p>{mensaje}</p>}
    </section>
  );
}
