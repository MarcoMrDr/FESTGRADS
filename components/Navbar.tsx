'use client';

import Link from 'next/link';
import { CartLink } from '@/components/CartLink';
import { AuthControls } from '@/components/AuthControls';
import { useAuth } from '@/components/AuthProvider';

const defaultLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/eventos', label: 'Visualizar eventos' },
  { href: '/extras', label: 'Productos extras' }
];

const adminLinks = [{ href: '/registro-eventos', label: 'Registro de eventos' }];

export function Navbar() {
  const { role } = useAuth();

  return (
    <header className="header">
      <nav className="nav container">
        <h1 className="logo">Gestión de Eventos</h1>
        <ul>
          {defaultLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}

          {role === 'superusuario' &&
            adminLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}

          <li>
            <CartLink />
          </li>
          <li>
            <AuthControls />
          </li>
        </ul>
      </nav>
    </header>
  );
}
