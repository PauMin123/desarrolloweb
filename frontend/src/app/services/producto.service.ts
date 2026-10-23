import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../models/producto.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  getProductoById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  searchProductos(query: string): Observable<{ success: boolean; data: Producto[] }> {
    return this.http.get<{ success: boolean; data: Producto[] }>(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`);
  }

  createProducto(formData: FormData): Observable<{ success: boolean; message: string; data: Producto }> {
    return this.http.post<{ success: boolean; message: string; data: Producto }>(this.apiUrl, formData);
  }

  updateProducto(id: number, formData: FormData): Observable<{ success: boolean; message: string; data: Producto }> {
    return this.http.put<{ success: boolean; message: string; data: Producto }>(`${this.apiUrl}/${id}`, formData);
  }

  deleteProducto(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}
