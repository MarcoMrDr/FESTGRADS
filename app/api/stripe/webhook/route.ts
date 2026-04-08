import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { fulfillCheckoutSession } from '@/lib/server/stripeFulfillment';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!stripeSecretKey || !stripeWebhookSecret) {
    return NextResponse.json(
      {
        error:
          'Faltan variables: STRIPE_SECRET_KEY o STRIPE_WEBHOOK_SECRET (además de las de Supabase en server).'
      },
      { status: 500 }
    );
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Falta header stripe-signature.' }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: `Firma inválida de webhook: ${(error as Error).message}` },
      { status: 400 }
    );
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  try {
    const session = event.data.object as Stripe.Checkout.Session;
    const result = await fulfillCheckoutSession(session);
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
