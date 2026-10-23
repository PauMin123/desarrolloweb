export interface Cliente {
  id?: number;
  nit: string;
  nombre: string;
  ciudad?: string;
  metodoPagoPreferido?: string;
  createdAt?: string;
}
