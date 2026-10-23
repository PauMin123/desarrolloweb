import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TipoCambio } from '../models/tipo-cambio.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TipoCambioService {
  private apiUrl = `${environment.apiUrl}/tipo-cambio`;

  constructor(private http: HttpClient) {}

  getTipoCambio(): Observable<TipoCambio> {
    return this.http.get<TipoCambio>(this.apiUrl);
  }
}
