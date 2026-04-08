'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { CartItem, Evento, ExtraProducto } from '@/lib/types';

type CartContextType = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addEventTicketToCart: (evento: Evento, cantidad?: number) => string;
  addExtraToCart: (extra: ExtraProducto, cantidad?: number) => string;
  updateQuantity: (itemId: string, cantidad: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = 'instancias_cart_v1';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      setItems(JSON.parse(cached));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItemToCart = (itemToAdd: CartItem, cantidad = 1) => {
    let message = 'Producto agregado al carrito.';

    setItems((prev) => {
      const found = prev.find((item) => item.itemId === itemToAdd.itemId);

      if (found) {
        const newQty = Math.min(found.cantidad + cantidad, found.maxCantidad);
        if (newQty === found.cantidad) {
          message = 'Ya alcanzaste el límite disponible para este producto.';
          return prev;
        }

        return prev.map((item) =>
          item.itemId === itemToAdd.itemId ? { ...item, cantidad: newQty } : item
        );
      }

      return [
        ...prev,
        {
          ...itemToAdd,
          cantidad: Math.min(cantidad, itemToAdd.maxCantidad)
        }
      ];
    });

    return message;
  };

  const addEventTicketToCart = (evento: Evento, cantidad = 1) => {
    return addItemToCart(
      {
        itemId: `boleto-${evento.id}`,
        tipo: 'boleto',
        titulo: evento.titulo,
        precio: evento.precio,
        cantidad: 0,
        maxCantidad: evento.limite_boletos
      },
      cantidad
    );
  };

  const addExtraToCart = (extra: ExtraProducto, cantidad = 1) => {
    return addItemToCart(
      {
        itemId: extra.id,
        tipo: 'extra',
        titulo: extra.nombre,
        precio: extra.precio,
        cantidad: 0,
        maxCantidad: extra.stock
      },
      cantidad
    );
  };

  const updateQuantity = (itemId: string, cantidad: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.itemId === itemId
            ? {
                ...item,
                cantidad: Math.min(Math.max(cantidad, 1), item.maxCantidad)
              }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.itemId !== itemId));
  };

  const clearCart = () => setItems([]);

  const totalItems = useMemo(
    () => items.reduce((acc, item) => acc + item.cantidad, 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((acc, item) => acc + item.cantidad * item.precio, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        addEventTicketToCart,
        addExtraToCart,
        updateQuantity,
        removeItem,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }
  return context;
}
