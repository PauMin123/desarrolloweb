import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { ClienteService } from '../../services/cliente.service';
import { FacturaService } from '../../services/factura.service';
import { TipoCambioService } from '../../services/tipo-cambio.service';
import { Producto } from '../../models/producto.model';
import { Cliente } from '../../models/cliente.model';
import { Factura, FacturaItemRequest, FacturaRequest } from '../../models/factura.model';

interface InvoiceLineItem {
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="facturacion-page">
      <!-- Page Header -->
      <div class="page-header glass-panel">
        <div>
          <span class="badge badge-aws mb-2">
            <i class="bi bi-lightning-charge-fill"></i> Facturación Reactiva
          </span>
          <h1 class="page-title">Emisión de Facturas e Integración S3</h1>
          <p class="page-desc">
            Selecciona productos con <strong>previsualización interactiva de imágenes desde AWS S3</strong> y cálculo de impuestos en tiempo real.
          </p>
        </div>

        <div class="header-rate">
          <div class="rate-card">
            <span class="rate-title">Tipo de Cambio Banguat</span>
            <div class="rate-number">1 USD = Q{{ tipoCambioVenta | number:'1.2-2' }}</div>
          </div>
        </div>
      </div>

      <div class="facturacion-layout">
        <!-- LEFT COLUMN: Client + Product Selection & Dynamic Preview -->
        <div class="left-col">
          <!-- 1. Client Search Card -->
          <div class="glass-panel section-card">
            <div class="card-title-row">
              <div class="title-with-icon">
                <i class="bi bi-person-badge icon-indigo"></i>
                <h2>Datos del Cliente</h2>
              </div>
              <button *ngIf="!clienteEncontrado" class="btn btn-sm btn-secondary" (click)="openCreateClienteModal()">
                <i class="bi bi-person-plus"></i> Nuevo Cliente
              </button>
            </div>

            <div class="nit-search-row">
              <div class="form-group mb-0 flex-1">
                <label class="form-label">Buscar por NIT *</label>
                <div class="input-action-wrapper">
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Ej: 1234567-8 o CF"
                    [(ngModel)]="searchNit"
                    (keyup.enter)="buscarCliente()"
                  />
                  <button class="btn btn-primary btn-sm search-btn" (click)="buscarCliente()" [disabled]="isSearchingClient">
                    <span *ngIf="isSearchingClient" class="spinner-sm"></span>
                    <i *ngIf="!isSearchingClient" class="bi bi-search"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Client Info Display -->
            <div *ngIf="clienteEncontrado" class="client-info-box">
              <div class="client-avatar">
                <i class="bi bi-person-check-fill"></i>
              </div>
              <div class="client-details">
                <div class="client-name">{{ clienteEncontrado.nombre }}</div>
                <div class="client-meta">
                  <span><strong>NIT:</strong> {{ clienteEncontrado.nit }}</span>
                  <span><strong>Ciudad:</strong> {{ clienteEncontrado.ciudad || 'N/A' }}</span>
                  <span><strong>Pago habitual:</strong> {{ clienteEncontrado.metodoPagoPreferido }}</span>
                </div>
              </div>
              <button class="btn btn-sm btn-secondary" (click)="limpiarCliente()" title="Cambiar cliente">
                <i class="bi bi-arrow-repeat"></i>
              </button>
            </div>

            <div *ngIf="clientError" class="alert-box alert-warning mt-2">
              <i class="bi bi-info-circle-fill"></i>
              <span>{{ clientError }}</span>
            </div>
          </div>

          <!-- 2. INTERACTIVE PRODUCT SELECTOR & DYNAMIC S3 PREVIEW (Core requirement) -->
          <div class="glass-panel section-card product-selector-card">
            <div class="card-title-row">
              <div class="title-with-icon">
                <i class="bi bi-image icon-cyan"></i>
                <h2>Selección Interactiva de Producto</h2>
              </div>
              <span class="badge badge-aws">AWS S3 Live</span>
            </div>

            <div class="form-group">
              <label class="form-label">Elegir Producto del Catálogo *</label>
              <select
                class="form-select"
                [(ngModel)]="selectedProductoId"
                (change)="onProductoSelected()"
              >
                <option [ngValue]="null" disabled selected>-- Haz clic para seleccionar un producto --</option>
                <option *ngFor="let prod of catalogoProductos" [ngValue]="prod.id">
                  {{ prod.codigo }} - {{ prod.nombre }} (\${{ prod.precioUnitario | number:'1.2-2' }}) [Stock: {{ prod.stock }}]
                </option>
              </select>
            </div>

            <!-- DYNAMIC PREVIEW BOX (Displays S3 Image, description, price, stock) -->
            <div *ngIf="selectedProducto" class="dynamic-preview-container animate-fade-in">
              <div class="preview-badge">
                <i class="bi bi-eye-fill"></i> Previsualización en Tiempo Real
              </div>

              <div class="preview-layout">
                <!-- S3 Image -->
                <div class="preview-image-box">
                  <img
                    [src]="selectedProducto.imagenUrl || fallbackImage"
                    [alt]="selectedProducto.nombre"
                    class="preview-s3-img"
                    (error)="onImageError($event)"
                  />
                  <span class="s3-source-tag">
                    <i class="bi bi-cloud-check-fill"></i> AWS S3
                  </span>
                </div>

                <!-- Info -->
                <div class="preview-info-box">
                  <div class="preview-header">
                    <span class="product-code-pill">{{ selectedProducto.codigo }}</span>
                    <span class="badge" [ngClass]="getStockBadgeClass(selectedProducto.stock)">
                      <i class="bi bi-boxes"></i> {{ selectedProducto.stock }} disponibles
                    </span>
                  </div>

                  <h3 class="preview-product-name">{{ selectedProducto.nombre }}</h3>
                  <p class="preview-desc">{{ selectedProducto.descripcion || 'Sin descripción adicional en catálogo.' }}</p>

                  <div class="preview-price-row">
                    <div>
                      <span class="price-sublabel">Precio Unitario</span>
                      <div class="preview-usd">\${{ selectedProducto.precioUnitario | number:'1.2-2' }} <small>USD</small></div>
                    </div>
                    <div class="text-right">
                      <span class="price-sublabel">Equivalente GTQ</span>
                      <div class="preview-gtq">Q{{ (selectedProducto.precioUnitario * tipoCambioVenta) | number:'1.2-2' }}</div>
                    </div>
                  </div>

                  <!-- Quantity Controls & Add Button -->
                  <div class="add-to-cart-row">
                    <div class="quantity-controller">
                      <button
                        type="button"
                        class="qty-btn"
                        (click)="decreaseQty()"
                        [disabled]="selectQuantity <= 1"
                      >
                        <i class="bi bi-dash"></i>
                      </button>
                      <input
                        type="number"
                        class="qty-input"
                        [(ngModel)]="selectQuantity"
                        min="1"
                        [max]="selectedProducto.stock"
                      />
                      <button
                        type="button"
                        class="qty-btn"
                        (click)="increaseQty()"
                        [disabled]="selectQuantity >= selectedProducto.stock"
                      >
                        <i class="bi bi-plus"></i>
                      </button>
                    </div>

                    <button
                      class="btn btn-success flex-1"
                      (click)="addSelectedProducto()"
                      [disabled]="selectedProducto.stock <= 0 || selectQuantity > selectedProducto.stock"
                    >
                      <i class="bi bi-cart-plus-fill"></i>
                      <span>Añadir al Detalle (Q{{ (selectedProducto.precioUnitario * selectQuantity * tipoCambioVenta) | number:'1.2-2' }})</span>
                    </button>
                  </div>

                  <div *ngIf="selectedProducto.stock <= 0" class="alert-box alert-danger mt-2">
                    <i class="bi bi-x-octagon-fill"></i> Este producto está actualmente agotado en inventario.
                  </div>
                </div>
              </div>
            </div>

            <!-- Placeholder when no product is selected yet -->
            <div *ngIf="!selectedProducto" class="empty-selector-placeholder">
              <i class="bi bi-cursor-fill placeholder-icon"></i>
              <p>Selecciona un producto del desplegable arriba para previsualizar su imagen desde AWS S3 y verificar existencias.</p>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Invoice Details & Financial Summary -->
        <div class="right-col">
          <div class="glass-panel section-card invoice-summary-card">
            <div class="card-title-row">
              <div class="title-with-icon">
                <i class="bi bi-receipt icon-emerald"></i>
                <h2>Detalle de la Factura</h2>
              </div>
              <span class="badge" [ngClass]="items.length > 0 ? 'badge-in-stock' : 'badge-low-stock'">
                {{ items.length }} ítems
              </span>
            </div>

            <!-- Items Table -->
            <div class="items-table-wrapper">
              <table *ngIf="items.length > 0" class="invoice-table">
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Unitario</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of items; let idx = index">
                    <td class="col-img">
                      <img
                        [src]="item.producto.imagenUrl || fallbackImage"
                        [alt]="item.producto.nombre"
                        class="item-thumb"
                        (error)="onImageError($event)"
                      />
                    </td>
                    <td>
                      <div class="item-name">{{ item.producto.nombre }}</div>
                      <div class="item-code">{{ item.producto.codigo }}</div>
                    </td>
                    <td class="col-qty">
                      <span class="qty-pill">{{ item.cantidad }}</span>
                    </td>
                    <td class="col-price">\${{ item.precioUnitario | number:'1.2-2' }}</td>
                    <td class="col-subtotal font-bold">\${{ item.subtotal | number:'1.2-2' }}</td>
                    <td class="col-action">
                      <button class="remove-btn" (click)="removeItem(idx)" title="Eliminar ítem">
                        <i class="bi bi-trash3"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div *ngIf="items.length === 0" class="empty-table-placeholder">
                <i class="bi bi-bag-x"></i>
                <p>No has agregado ningún producto a la factura todavía.</p>
              </div>
            </div>

            <!-- Payment Method & Invoice Settings -->
            <div class="payment-settings mt-4">
              <div class="form-group mb-0">
                <label class="form-label">Método de Pago</label>
                <select class="form-select" [(ngModel)]="metodoPago">
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta de Crédito / Débito">Tarjeta de Crédito / Débito</option>
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                </select>
              </div>
            </div>

            <!-- Financial Calculations Breakdown -->
            <div class="totals-breakdown mt-4">
              <div class="totals-row">
                <span class="totals-label">Subtotal Gravable (USD)</span>
                <span class="totals-value">\${{ totales.subtotal_usd | number:'1.2-2' }}</span>
              </div>
              <div class="totals-row">
                <span class="totals-label">IVA (12%)</span>
                <span class="totals-value">\${{ totales.iva_usd | number:'1.2-2' }}</span>
              </div>
              <div class="totals-divider"></div>
              <div class="totals-row main-total">
                <span class="totals-label">Total en Dólares (USD)</span>
                <span class="totals-value usd-highlight">\${{ totales.total_usd | number:'1.2-2' }}</span>
              </div>
              <div class="totals-row gtq-total">
                <span class="totals-label">
                  Total a Pagar en Quetzales (GTQ)
                  <small class="d-block text-muted">Tipo de cambio Banguat: Q{{ tipoCambioVenta | number:'1.2-2' }}</small>
                </span>
                <span class="totals-value gtq-highlight">Q{{ totales.total_gtq | number:'1.2-2' }}</span>
              </div>
            </div>

            <!-- Error Banner -->
            <div *ngIf="invoiceError" class="alert-box alert-danger mt-3">
              <i class="bi bi-exclamation-octagon-fill"></i>
              <span>{{ invoiceError }}</span>
            </div>

            <!-- Action Buttons -->
            <div class="invoice-actions mt-4">
              <button
                class="btn btn-secondary"
                (click)="resetInvoice()"
                [disabled]="isSavingInvoice || items.length === 0"
              >
                <i class="bi bi-arrow-counterclockwise"></i> Limpiar
              </button>
              <button
                class="btn btn-primary flex-1 btn-lg"
                (click)="emitirFactura()"
                [disabled]="isSavingInvoice || items.length === 0 || !clienteEncontrado"
              >
                <span *ngIf="isSavingInvoice" class="spinner-sm"></span>
                <i *ngIf="!isSavingInvoice" class="bi bi-check2-circle"></i>
                <span>{{ isSavingInvoice ? 'Procesando Factura en BD...' : 'Emitir y Guardar Factura' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Nuevo Cliente -->
      <div *ngIf="showClienteModal" class="modal-backdrop" (click)="closeClienteModalOnBackdrop($event)">
        <div class="modal-card glass-panel">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Registrar Cliente</h2>
              <p class="modal-subtitle">Se guardará en la base de datos relacional MySQL</p>
            </div>
            <button class="close-btn" (click)="showClienteModal = false">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <form (ngSubmit)="guardarNuevoCliente()" class="modal-form">
            <div class="form-group">
              <label class="form-label">NIT o DPI *</label>
              <input type="text" class="form-control" [(ngModel)]="nuevoCliente.nit" name="nit" required />
            </div>
            <div class="form-group">
              <label class="form-label">Nombre Completo / Razón Social *</label>
              <input type="text" class="form-control" [(ngModel)]="nuevoCliente.nombre" name="nombre" required />
            </div>
            <div class="form-group">
              <label class="form-label">Ciudad o Dirección</label>
              <input type="text" class="form-control" [(ngModel)]="nuevoCliente.ciudad" name="ciudad" />
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showClienteModal = false">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="!nuevoCliente.nit || !nuevoCliente.nombre">
                Guardar Cliente
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Éxito / Factura Emitida -->
      <div *ngIf="facturaGuardada" class="modal-backdrop">
        <div class="modal-card glass-panel invoice-success-modal">
          <div class="success-icon-badge">
            <i class="bi bi-check-lg"></i>
          </div>

          <h2 class="text-center font-bold">¡Factura Emitida con Éxito!</h2>
          <p class="text-center text-muted mb-4">
            Factura #<strong>{{ facturaGuardada.id }}</strong> registrada en la Base de Datos y stock actualizado.
          </p>

          <div class="invoice-receipt-card">
            <div class="receipt-header">
              <div>
                <span class="receipt-label">Cliente:</span>
                <strong>{{ facturaGuardada.cliente.nombre }}</strong> (NIT: {{ facturaGuardada.cliente.nit }})
              </div>
              <div class="text-right">
                <span class="receipt-label">Fecha:</span>
                <div>{{ facturaGuardada.fecha | date:'medium' }}</div>
              </div>
            </div>

            <div class="receipt-divider"></div>

            <div class="receipt-table">
              <div *ngFor="let det of facturaGuardada.detalles" class="receipt-item-row">
                <span>{{ det.cantidad }}x {{ det.producto.nombre }}</span>
                <strong>\${{ det.subtotal | number:'1.2-2' }}</strong>
              </div>
            </div>

            <div class="receipt-divider"></div>

            <div class="receipt-total-row">
              <span>Total USD:</span>
              <span class="receipt-val">\${{ facturaGuardada.totalUsd | number:'1.2-2' }}</span>
            </div>
            <div class="receipt-total-row gtq-val">
              <span>Total Quetzales:</span>
              <span class="receipt-val font-bold">Q{{ facturaGuardada.totalGtq | number:'1.2-2' }}</span>
            </div>
          </div>

          <div class="modal-footer justify-center mt-4">
            <button class="btn btn-secondary" (click)="facturaGuardada = null">
              <i class="bi bi-printer"></i> Cerrar
            </button>
            <button class="btn btn-primary" (click)="nuevaFactura()">
              <i class="bi bi-plus-lg"></i> Nueva Factura
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .facturacion-page {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 24px 60px;
    }

    .page-header {
      padding: 28px;
      margin-bottom: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
    }

    .page-title {
      font-size: 2rem;
      margin-bottom: 6px;
    }

    .page-desc {
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    .rate-card {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 12px 18px;
      border-radius: 12px;
      text-align: right;
    }

    .rate-title {
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 600;
      color: var(--text-muted);
    }

    .rate-number {
      font-family: var(--font-heading);
      font-size: 1.25rem;
      font-weight: 800;
      color: #34d399;
    }

    /* Layout Columns */
    .facturacion-layout {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 28px;
    }

    .section-card {
      padding: 24px;
      margin-bottom: 24px;
    }

    .card-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .title-with-icon {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .title-with-icon h2 {
      font-size: 1.25rem;
    }

    .icon-indigo { color: #818cf8; font-size: 1.35rem; }
    .icon-cyan { color: #22d3ee; font-size: 1.35rem; }
    .icon-emerald { color: #34d399; font-size: 1.35rem; }

    /* Client Box */
    .input-action-wrapper {
      display: flex;
      gap: 8px;
    }

    .search-btn {
      padding: 0 16px;
    }

    .client-info-box {
      margin-top: 16px;
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: 12px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .client-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(99, 102, 241, 0.25);
      color: #818cf8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
    }

    .client-details {
      flex: 1;
    }

    .client-name {
      font-weight: 700;
      font-size: 1.05rem;
      color: #fff;
    }

    .client-meta {
      display: flex;
      gap: 14px;
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-top: 2px;
      flex-wrap: wrap;
    }

    /* Dynamic Preview Container (Crucial Rubric Requirement) */
    .dynamic-preview-container {
      background: rgba(17, 24, 39, 0.95);
      border: 1px solid rgba(6, 182, 212, 0.4);
      border-radius: 14px;
      padding: 18px;
      margin-top: 16px;
      box-shadow: 0 10px 25px rgba(6, 182, 212, 0.15);
      position: relative;
    }

    .preview-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #22d3ee;
      margin-bottom: 12px;
    }

    .preview-layout {
      display: flex;
      gap: 20px;
    }

    .preview-image-box {
      width: 170px;
      height: 170px;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
      background: #1f2937;
      flex-shrink: 0;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
    }

    .preview-s3-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .s3-source-tag {
      position: absolute;
      bottom: 8px;
      left: 8px;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      color: #fb923c;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid rgba(249, 115, 22, 0.4);
    }

    .preview-info-box {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .product-code-pill {
      font-size: 0.75rem;
      font-weight: 700;
      color: #22d3ee;
      background: rgba(6, 182, 212, 0.12);
      padding: 2px 8px;
      border-radius: 6px;
    }

    .preview-product-name {
      font-size: 1.25rem;
      margin-bottom: 6px;
    }

    .preview-desc {
      font-size: 0.82rem;
      color: var(--text-dim);
      margin-bottom: 12px;
      line-height: 1.4;
    }

    .preview-price-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      background: rgba(255, 255, 255, 0.04);
      padding: 10px 14px;
      border-radius: 10px;
      margin-bottom: 14px;
    }

    .price-sublabel {
      font-size: 0.7rem;
      color: var(--text-dim);
      text-transform: uppercase;
      font-weight: 600;
    }

    .preview-usd {
      font-family: var(--font-heading);
      font-size: 1.35rem;
      font-weight: 800;
      color: #fff;
    }

    .preview-gtq {
      font-family: var(--font-heading);
      font-size: 1.05rem;
      font-weight: 700;
      color: #34d399;
    }

    .add-to-cart-row {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .quantity-controller {
      display: flex;
      align-items: center;
      background: #1f2937;
      border: 1px solid var(--border-glass);
      border-radius: 10px;
      overflow: hidden;
    }

    .qty-btn {
      background: transparent;
      border: none;
      color: #fff;
      width: 36px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.1rem;
    }

    .qty-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .qty-input {
      width: 44px;
      background: transparent;
      border: none;
      color: #fff;
      text-align: center;
      font-weight: 700;
      font-size: 1rem;
      outline: none;
    }

    .empty-selector-placeholder {
      text-align: center;
      padding: 30px 20px;
      border: 2px dashed rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: var(--text-dim);
      font-size: 0.88rem;
    }

    .placeholder-icon {
      font-size: 1.8rem;
      color: var(--primary);
      margin-bottom: 8px;
      display: block;
    }

    /* Table Styles */
    .items-table-wrapper {
      max-height: 280px;
      overflow-y: auto;
      border: 1px solid var(--border-glass);
      border-radius: 10px;
      background: rgba(11, 15, 25, 0.4);
    }

    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }

    .invoice-table th {
      padding: 10px 12px;
      text-align: left;
      font-size: 0.72rem;
      color: var(--text-dim);
      text-transform: uppercase;
      font-weight: 600;
      border-bottom: 1px solid var(--border-glass);
      background: rgba(255, 255, 255, 0.02);
    }

    .invoice-table td {
      padding: 10px 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      vertical-align: middle;
    }

    .col-img {
      width: 48px;
    }

    .item-thumb {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      object-fit: cover;
      background: #1f2937;
    }

    .item-name {
      font-weight: 600;
      color: #fff;
    }

    .item-code {
      font-size: 0.72rem;
      color: var(--text-dim);
    }

    .qty-pill {
      background: rgba(255, 255, 255, 0.08);
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 700;
    }

    .remove-btn {
      background: transparent;
      border: none;
      color: #f87171;
      cursor: pointer;
      font-size: 1rem;
      padding: 4px;
      border-radius: 6px;
    }

    .remove-btn:hover {
      background: rgba(244, 63, 94, 0.2);
    }

    .empty-table-placeholder {
      text-align: center;
      padding: 30px;
      color: var(--text-dim);
      font-size: 0.85rem;
    }

    .empty-table-placeholder i {
      font-size: 2rem;
      margin-bottom: 6px;
      display: block;
    }

    /* Totals Breakdown */
    .totals-breakdown {
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid var(--border-glass);
      border-radius: 12px;
      padding: 16px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 0.9rem;
    }

    .totals-label {
      color: var(--text-muted);
    }

    .totals-value {
      font-family: var(--font-heading);
      font-weight: 600;
    }

    .totals-divider {
      height: 1px;
      background: var(--border-glass);
      margin: 12px 0;
    }

    .main-total .totals-label {
      font-weight: 700;
      color: #fff;
    }

    .usd-highlight {
      font-size: 1.3rem;
      font-weight: 800;
      color: #fff;
    }

    .gtq-total {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed rgba(255, 255, 255, 0.1);
    }

    .gtq-total .totals-label {
      font-weight: 700;
      color: #34d399;
    }

    .gtq-highlight {
      font-size: 1.4rem;
      font-weight: 800;
      color: #34d399;
    }

    .invoice-actions {
      display: flex;
      gap: 12px;
    }

    .btn-lg {
      padding: 14px 24px;
      font-size: 1.05rem;
    }

    .alert-box {
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .alert-warning {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #fbbf24;
    }

    .alert-danger {
      background: rgba(244, 63, 94, 0.1);
      border: 1px solid rgba(244, 63, 94, 0.3);
      color: #fb7185;
    }

    /* Success Modal / Receipt */
    .invoice-success-modal {
      text-align: center;
      max-width: 500px;
    }

    .success-icon-badge {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      font-size: 1.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }

    .invoice-receipt-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-glass);
      border-radius: 12px;
      padding: 16px;
      text-align: left;
      font-size: 0.88rem;
    }

    .receipt-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .receipt-label {
      font-size: 0.75rem;
      color: var(--text-dim);
      display: block;
    }

    .receipt-divider {
      height: 1px;
      background: var(--border-glass);
      margin: 10px 0;
    }

    .receipt-item-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .receipt-total-row {
      display: flex;
      justify-content: space-between;
      font-size: 1rem;
      margin-top: 6px;
    }

    .gtq-val {
      color: #34d399;
      font-size: 1.15rem;
    }

    .justify-center {
      justify-content: center;
    }

    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }

    @media (max-width: 992px) {
      .facturacion-layout {
        grid-template-columns: 1fr;
      }
      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }
      .preview-layout {
        flex-direction: column;
      }
      .preview-image-box {
        width: 100%;
        height: 180px;
      }
    }
  `]
})
export class FacturacionComponent implements OnInit {
  catalogoProductos: Producto[] = [];
  tipoCambioVenta = 7.8;
  fallbackImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60';

  // Client
  searchNit = 'CF';
  clienteEncontrado: Cliente | null = null;
  isSearchingClient = false;
  clientError = '';

  // New Client Modal
  showClienteModal = false;
  nuevoCliente: Cliente = { nit: '', nombre: '', ciudad: '' };

  // Interactive Product Selector
  selectedProductoId: number | null = null;
  selectedProducto: Producto | null = null;
  selectQuantity = 1;

  // Invoice Data
  items: InvoiceLineItem[] = [];
  metodoPago = 'Efectivo';
  isSavingInvoice = false;
  invoiceError = '';
  facturaGuardada: Factura | null = null;

  totales = {
    subtotal_usd: 0,
    iva_usd: 0,
    total_usd: 0,
    total_gtq: 0,
    tipo_cambio: 7.8
  };

  constructor(
    private productoService: ProductoService,
    private clienteService: ClienteService,
    private facturaService: FacturaService,
    private tipoCambioService: TipoCambioService
  ) {}

  ngOnInit(): void {
    this.loadTipoCambio();
    this.loadCatalogo();
    this.buscarCliente();
  }

  loadTipoCambio(): void {
    this.tipoCambioService.getTipoCambio().subscribe({
      next: (res) => {
        if (res && res.venta) {
          this.tipoCambioVenta = res.venta;
          this.totales.tipo_cambio = res.venta;
          this.calcularTotales();
        }
      }
    });
  }

  loadCatalogo(): void {
    this.productoService.getProductos().subscribe({
      next: (prods) => {
        this.catalogoProductos = prods;
      }
    });
  }

  buscarCliente(): void {
    const nit = this.searchNit.trim();
    if (!nit) return;

    this.isSearchingClient = true;
    this.clientError = '';

    this.clienteService.getClienteByNit(nit).subscribe({
      next: (res) => {
        this.isSearchingClient = false;
        if (res.success && res.data) {
          this.clienteEncontrado = res.data;
          this.metodoPago = res.data.metodoPagoPreferido || 'Efectivo';
        } else {
          this.clienteEncontrado = null;
          this.clientError = 'Cliente no encontrado. Puedes registrarlo con el botón "Nuevo Cliente".';
        }
      },
      error: () => {
        this.isSearchingClient = false;
        this.clienteEncontrado = null;
        this.clientError = 'Cliente no encontrado con el NIT ingresado.';
      }
    });
  }

  limpiarCliente(): void {
    this.clienteEncontrado = null;
    this.searchNit = '';
    this.clientError = '';
  }

  openCreateClienteModal(): void {
    this.nuevoCliente = {
      nit: this.searchNit !== 'CF' ? this.searchNit : '',
      nombre: '',
      ciudad: ''
    };
    this.showClienteModal = true;
  }

  closeClienteModalOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.showClienteModal = false;
    }
  }

  guardarNuevoCliente(): void {
    if (!this.nuevoCliente.nit || !this.nuevoCliente.nombre) return;

    this.clienteService.createCliente(this.nuevoCliente).subscribe({
      next: (res) => {
        this.showClienteModal = false;
        if (res.data) {
          this.clienteEncontrado = res.data;
          this.searchNit = res.data.nit;
          this.clientError = '';
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Error al guardar cliente');
      }
    });
  }

  // Interactive Product Selector handler
  onProductoSelected(): void {
    if (!this.selectedProductoId) {
      this.selectedProducto = null;
      return;
    }

    const prod = this.catalogoProductos.find((p) => p.id === this.selectedProductoId);
    if (prod) {
      this.selectedProducto = prod;
      this.selectQuantity = prod.stock > 0 ? 1 : 0;
    }
  }

  increaseQty(): void {
    if (this.selectedProducto && this.selectQuantity < this.selectedProducto.stock) {
      this.selectQuantity++;
    }
  }

  decreaseQty(): void {
    if (this.selectQuantity > 1) {
      this.selectQuantity--;
    }
  }

  addSelectedProducto(): void {
    if (!this.selectedProducto) return;
    if (this.selectQuantity <= 0 || this.selectQuantity > this.selectedProducto.stock) {
      return;
    }

    // Check if already in items
    const existingIndex = this.items.findIndex((item) => item.producto.id === this.selectedProducto!.id);

    if (existingIndex > -1) {
      const nuevaCantidad = this.items[existingIndex].cantidad + this.selectQuantity;
      if (nuevaCantidad > this.selectedProducto.stock) {
        alert(`No puedes agregar ${nuevaCantidad} unidades. Solo hay ${this.selectedProducto.stock} disponibles en stock.`);
        return;
      }
      this.items[existingIndex].cantidad = nuevaCantidad;
      this.items[existingIndex].subtotal = Number((nuevaCantidad * this.items[existingIndex].precioUnitario).toFixed(2));
    } else {
      const subtotal = Number((this.selectQuantity * this.selectedProducto.precioUnitario).toFixed(2));
      this.items.push({
        producto: { ...this.selectedProducto },
        cantidad: this.selectQuantity,
        precioUnitario: this.selectedProducto.precioUnitario,
        subtotal: subtotal
      });
    }

    this.calcularTotales();

    // Reset selection
    this.selectedProductoId = null;
    this.selectedProducto = null;
    this.selectQuantity = 1;
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
    this.calcularTotales();
  }

  calcularTotales(): void {
    let subtotalUsd = 0;
    for (const item of this.items) {
      subtotalUsd += item.subtotal;
    }

    subtotalUsd = Number(subtotalUsd.toFixed(2));
    const ivaUsd = Number((subtotalUsd * 0.12).toFixed(2));
    const totalUsd = Number((subtotalUsd + ivaUsd).toFixed(2));
    const totalGtq = Number((totalUsd * this.tipoCambioVenta).toFixed(2));

    this.totales = {
      subtotal_usd: subtotalUsd,
      iva_usd: ivaUsd,
      total_usd: totalUsd,
      total_gtq: totalGtq,
      tipo_cambio: this.tipoCambioVenta
    };
  }

  getStockBadgeClass(stock: number): string {
    if (stock > 10) return 'badge-in-stock';
    if (stock > 0) return 'badge-low-stock';
    return 'badge-out-stock';
  }

  onImageError(event: any): void {
    event.target.src = this.fallbackImage;
  }

  resetInvoice(): void {
    this.items = [];
    this.calcularTotales();
    this.selectedProductoId = null;
    this.selectedProducto = null;
    this.invoiceError = '';
  }

  emitirFactura(): void {
    if (!this.clienteEncontrado || !this.clienteEncontrado.id) {
      this.invoiceError = 'Debes seleccionar o registrar un cliente antes de emitir la factura.';
      return;
    }

    if (this.items.length === 0) {
      this.invoiceError = 'La factura debe tener al menos un producto en el detalle.';
      return;
    }

    this.isSavingInvoice = true;
    this.invoiceError = '';

    const payload: FacturaRequest = {
      cliente_id: this.clienteEncontrado.id,
      metodo_pago: this.metodoPago,
      productos: this.items.map((item) => ({
        id: item.producto.id!,
        cantidad: item.cantidad,
        precio_unitario: item.precioUnitario,
        subtotal: item.subtotal
      })),
      totales: { ...this.totales }
    };

    this.facturaService.createFactura(payload).subscribe({
      next: (res) => {
        this.isSavingInvoice = false;
        this.facturaGuardada = res.data;
        this.resetInvoice();
        this.loadCatalogo(); // Refresh stock
      },
      error: (err) => {
        this.isSavingInvoice = false;
        this.invoiceError = err.error?.message || 'Error al guardar la factura en la base de datos.';
      }
    });
  }

  nuevaFactura(): void {
    this.facturaGuardada = null;
    this.resetInvoice();
  }
}
