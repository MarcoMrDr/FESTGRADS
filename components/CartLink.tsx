'use client';

import Link from 'next/link';
import { useCart } from '@/components/CartProvider';

export function CartLink() {
  const { totalItems } = useCart();

  return <Link href="/carrito">Carrito ({totalItems})</Link>;
}
