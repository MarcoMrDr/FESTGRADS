export type Evento = {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  precio: number;
  limite_boletos: number;
};

export type ExtraProducto = {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
};

export type CartItem = {
  itemId: string;
  tipo: 'boleto' | 'extra';
  titulo: string;
  precio: number;
  cantidad: number;
  maxCantidad: number;
};

export type Perfil = {
  id: string;
  rol: 'superusuario' | 'usuario';
};
