import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { fulfillCheckoutSession } from '@/lib/server/stripeFulfillment';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(request: Request) {
  if (!stripeSecretKey) {
    return NextResponse.json({ error: 'Falta STRIPE_SECRET_KEY en variables de entorno.' }, { status: 500 });
  }

  try {
    const { sessionId } = (await request.json()) as { sessionId?: string };
    if (!sessionId) {
      return NextResponse.json({ error: 'Falta sessionId.' }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'La sesión aún no está pagada.' }, { status: 409 });
    }

    const result = await fulfillCheckoutSession(session);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
