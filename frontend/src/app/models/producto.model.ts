export interface Producto {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  precioUnitario: number;
  stock: number;
  imagenUrl?: string;
  s3Key?: string;
  createdAt?: string;
}
