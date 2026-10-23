import { Routes } from '@angular/router';
import { FacturacionComponent } from './components/facturacion/facturacion.component';
import { CatalogoComponent } from './components/catalogo/catalogo.component';
import { HistorialComponent } from './components/historial/historial.component';

export const routes: Routes = [
  { path: '', redirectTo: 'facturacion', pathMatch: 'full' },
  { path: 'facturacion', component: FacturacionComponent },
  { path: 'catalogo', component: CatalogoComponent },
  { path: 'historial', component: HistorialComponent },
  { path: '**', redirectTo: 'facturacion' }
];
