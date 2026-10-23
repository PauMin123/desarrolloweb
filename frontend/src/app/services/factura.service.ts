import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Factura, FacturaRequest } from '../models/factura.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FacturaService {
  private apiUrl = `${environment.apiUrl}/facturas`;

  constructor(private http: HttpClient) {}

  getFacturas(): Observable<Factura[]> {
    return this.http.get<Factura[]>(this.apiUrl);
  }

  getFacturaById(id: number): Observable<Factura> {
    return this.http.get<Factura>(`${this.apiUrl}/${id}`);
  }

  createFactura(request: FacturaRequest): Observable<{ success: boolean; message: string; factura_id: number; data: Factura }> {
    return this.http.post<{ success: boolean; message: string; factura_id: number; data: Factura }>(this.apiUrl, request);
  }
}
