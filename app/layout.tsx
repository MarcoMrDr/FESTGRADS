import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Providers } from '@/app/providers';

export const metadata: Metadata = {
  title: 'Gestión de Eventos',
  description: 'Gestión de eventos y compra de boletos con Supabase + Stripe'
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <Navbar />
          <main className="container">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
