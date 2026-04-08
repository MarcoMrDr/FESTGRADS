import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

type CheckoutItem = {
  itemId: string;
  tipo: 'boleto' | 'extra';
  titulo: string;
  precio: number;
  cantidad: number;
};

export async function POST(request: Request) {
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: 'Falta STRIPE_SECRET_KEY en variables de entorno.' },
      { status: 500 }
    );
  }

  if (!stripeSecretKey.startsWith('sk_')) {
    return NextResponse.json(
      {
        error:
          'STRIPE_SECRET_KEY inválida. Debe iniciar con sk_test_ (pruebas) o sk_live_ (producción). No uses la publishable key en el backend.'
      },
      { status: 500 }
    );
  }

  const requestOrigin = request.headers.get('origin');
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const baseUrlRaw = configuredAppUrl || requestOrigin;
  const baseUrl = baseUrlRaw?.replace(/\/+$/, '');

  if (!baseUrl) {
    return NextResponse.json(
      { error: 'Falta NEXT_PUBLIC_APP_URL y tampoco se recibió Origin en la petición.' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  try {
    const { items } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío.' }, { status: 400 });
    }

    const normalizedItems = items as CheckoutItem[];

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = normalizedItems.map((item) => ({
      quantity: item.cantidad,
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(item.precio * 100),
        product_data: {
          name: item.titulo
        }
      }
    }));

    const compactCart = normalizedItems.map((item) => ({
      itemId: item.itemId,
      tipo: item.tipo,
      cantidad: item.cantidad
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${baseUrl}/carrito?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/carrito?status=cancel`,
      metadata: {
        cart: JSON.stringify(compactCart)
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: `No se pudo crear sesión de Stripe: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
