import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacturaService } from '../../services/factura.service';
import { Factura } from '../../models/factura.model';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="historial-page">
      <div class="page-header glass-panel">
        <div>
          <span class="badge badge-aws mb-2">
            <i class="bi bi-archive-fill"></i> Registro Contable
          </span>
          <h1 class="page-title">Historial de Facturas Emitidas</h1>
          <p class="page-desc">Consulta de transacciones registradas en la base de datos relacional MySQL.</p>
        </div>
        <button class="btn btn-secondary" (click)="loadFacturas()">
          <i class="bi bi-arrow-repeat"></i> Actualizar
        </button>
      </div>

      <div *ngIf="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando facturas...</p>
      </div>

      <!-- Facturas Table -->
      <div *ngIf="!isLoading && facturas.length > 0" class="glass-panel table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th># Factura</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>NIT</th>
                <th>Método de Pago</th>
                <th>Total USD</th>
                <th>Total GTQ</th>
                <th class="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let f of facturas">
                <td class="font-bold">#{{ f.id }}</td>
                <td class="text-muted">{{ f.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
                <td class="font-bold text-white">{{ f.cliente.nombre }}</td>
                <td><span class="nit-tag">{{ f.cliente.nit }}</span></td>
                <td><span class="badge badge-secondary">{{ f.metodoPago }}</span></td>
                <td class="font-bold">\${{ f.totalUsd | number:'1.2-2' }}</td>
                <td class="font-bold text-emerald">Q{{ f.totalGtq | number:'1.2-2' }}</td>
                <td class="text-right">
                  <button class="btn btn-sm btn-primary" (click)="verDetalle(f)">
                    <i class="bi bi-eye"></i> Detalle
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="!isLoading && facturas.length === 0" class="empty-state glass-panel">
        <i class="bi bi-receipt-cutoff empty-icon"></i>
        <h3>Aún no hay facturas registradas</h3>
        <p>Las facturas emitidas en el módulo de facturación se listarán aquí automáticamente.</p>
      </div>

      <!-- Modal Detalle de Factura -->
      <div *ngIf="facturaSeleccionada" class="modal-backdrop" (click)="closeModalOnBackdrop($event)">
        <div class="modal-card glass-panel">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Factura #{{ facturaSeleccionada.id }}</h2>
              <p class="modal-subtitle">Fecha: {{ facturaSeleccionada.fecha | date:'medium' }}</p>
            </div>
            <button class="close-btn" (click)="facturaSeleccionada = null">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="info-grid">
              <div>
                <span class="info-label">Cliente:</span>
                <div class="font-bold">{{ facturaSeleccionada.cliente.nombre }}</div>
                <div class="text-muted text-sm">NIT: {{ facturaSeleccionada.cliente.nit }}</div>
              </div>
              <div class="text-right">
                <span class="info-label">Método de Pago:</span>
                <div class="font-bold">{{ facturaSeleccionada.metodoPago }}</div>
                <div class="text-muted text-sm">T/C: Q{{ facturaSeleccionada.tipoCambio | number:'1.2-2' }}</div>
              </div>
            </div>

            <div class="divider"></div>

            <h4 class="items-heading">Productos Facturados</h4>
            <div class="modal-items-list">
              <div *ngFor="let det of facturaSeleccionada.detalles" class="modal-item-row">
                <div class="modal-item-info">
                  <div class="modal-item-name">{{ det.producto.nombre }}</div>
                  <div class="text-muted text-sm">{{ det.cantidad }} x \${{ det.precioUnitario | number:'1.2-2' }}</div>
                </div>
                <div class="modal-item-subtotal font-bold">
                  \${{ det.subtotal | number:'1.2-2' }}
                </div>
              </div>
            </div>

            <div class="divider"></div>

            <div class="totals-summary-box">
              <div class="tot-row">
                <span>Subtotal USD:</span>
                <span>\${{ facturaSeleccionada.subtotalUsd | number:'1.2-2' }}</span>
              </div>
              <div class="tot-row">
                <span>IVA (12%):</span>
                <span>\${{ facturaSeleccionada.ivaUsd | number:'1.2-2' }}</span>
              </div>
              <div class="tot-row font-bold text-white text-base">
                <span>Total USD:</span>
                <span>\${{ facturaSeleccionada.totalUsd | number:'1.2-2' }}</span>
              </div>
              <div class="tot-row font-bold text-emerald text-lg mt-2">
                <span>Total Quetzales:</span>
                <span>Q{{ facturaSeleccionada.totalGtq | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="facturaSeleccionada = null">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .historial-page {
      max-width: 1300px;
      margin: 0 auto;
      padding: 0 24px 60px;
    }

    .page-header {
      padding: 28px;
      margin-bottom: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-title {
      font-size: 2rem;
      margin-bottom: 6px;
    }

    .page-desc {
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    .table-card {
      padding: 20px;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    .data-table th {
      padding: 12px 14px;
      text-align: left;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--text-dim);
      font-weight: 600;
      border-bottom: 1px solid var(--border-glass);
    }

    .data-table td {
      padding: 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      vertical-align: middle;
    }

    .nit-tag {
      background: rgba(255, 255, 255, 0.06);
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.8rem;
    }

    .badge-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-muted);
    }

    .text-emerald {
      color: #34d399;
    }

    .text-white {
      color: #fff;
    }

    .text-right {
      text-align: right;
    }

    .font-bold {
      font-weight: 700;
    }

    /* Modal */
    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-glass);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-body {
      padding: 20px 24px;
    }

    .info-grid {
      display: flex;
      justify-content: space-between;
    }

    .info-label {
      font-size: 0.72rem;
      color: var(--text-dim);
      text-transform: uppercase;
      font-weight: 600;
    }

    .text-sm {
      font-size: 0.8rem;
    }

    .divider {
      height: 1px;
      background: var(--border-glass);
      margin: 16px 0;
    }

    .items-heading {
      font-size: 0.95rem;
      margin-bottom: 12px;
    }

    .modal-item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .totals-summary-box {
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid var(--border-glass);
      border-radius: 10px;
      padding: 14px;
      margin-top: 16px;
    }

    .tot-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 0.9rem;
    }

    .text-base { font-size: 1rem; }
    .text-lg { font-size: 1.15rem; }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--border-glass);
      display: flex;
      justify-content: flex-end;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.2rem;
      cursor: pointer;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 60px 20px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }

    .empty-icon {
      font-size: 3rem;
      color: var(--text-dim);
      margin-bottom: 12px;
      display: block;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class HistorialComponent implements OnInit {
  facturas: Factura[] = [];
  isLoading = true;
  facturaSeleccionada: Factura | null = null;

  constructor(private facturaService: FacturaService) {}

  ngOnInit(): void {
    this.loadFacturas();
  }

  loadFacturas(): void {
    this.isLoading = true;
    this.facturaService.getFacturas().subscribe({
      next: (data) => {
        this.facturas = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  verDetalle(f: Factura): void {
    this.facturaSeleccionada = f;
  }

  closeModalOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.facturaSeleccionada = null;
    }
  }
}
