import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente } from '../models/cliente.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = `${environment.apiUrl}/clientes`;

  constructor(private http: HttpClient) {}

  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
  }

  getClienteByNit(nit: string): Observable<{ success: boolean; data?: Cliente; message?: string }> {
    return this.http.get<{ success: boolean; data?: Cliente; message?: string }>(`${this.apiUrl}/nit/${encodeURIComponent(nit)}`);
  }

  createCliente(cliente: Cliente): Observable<{ success: boolean; data?: Cliente; message?: string }> {
    return this.http.post<{ success: boolean; data?: Cliente; message?: string }>(this.apiUrl, cliente);
  }
}
