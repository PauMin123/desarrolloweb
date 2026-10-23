import { Cliente } from './cliente.model';
import { Producto } from './producto.model';

export interface FacturaDetalleItem {
  id?: number;
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface FacturaItemRequest {
  id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface FacturaTotales {
  subtotal_usd: number;
  iva_usd: number;
  total_usd: number;
  total_gtq: number;
  tipo_cambio: number;
}

export interface FacturaRequest {
  cliente_id: number;
  metodo_pago: string;
  productos: FacturaItemRequest[];
  totales: FacturaTotales;
}

export interface Factura {
  id?: number;
  cliente: Cliente;
  fecha: string;
  metodoPago: string;
  subtotalUsd: number;
  ivaUsd: number;
  totalUsd: number;
  totalGtq: number;
  tipoCambio: number;
  detalles: FacturaDetalleItem[];
}
