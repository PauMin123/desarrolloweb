import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';
import { TipoCambioService } from '../../services/tipo-cambio.service';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="catalogo-page">
      <!-- Header -->
      <div class="header-section glass-panel">
        <div class="header-content">
          <div>
            <span class="badge badge-aws mb-2">
              <i class="bi bi-box-seam"></i> Inventario & Catálogo
            </span>
            <h1 class="page-title">Catálogo de Productos</h1>
            <p class="page-desc">
              Imágenes multimedia alojadas en <strong class="aws-text">Amazon AWS S3</strong> y gestionadas vía Spring Boot.
            </p>
          </div>
          <button class="btn btn-primary" (click)="openCreateModal()">
            <i class="bi bi-plus-lg"></i>
            <span>Nuevo Producto</span>
          </button>
        </div>

        <!-- Search Bar -->
        <div class="search-bar">
          <div class="search-input-wrapper">
            <i class="bi bi-search search-icon"></i>
            <input
              type="text"
              class="form-control search-input"
              placeholder="Buscar por código o nombre de producto..."
              [(ngModel)]="searchQuery"
              (input)="onSearch()"
            />
          </div>
          <div class="stock-stats">
            <span class="stat-badge">
              <strong>{{ filteredProductos.length }}</strong> productos listados
            </span>
          </div>
        </div>
      </div>

      <!-- Loading / Error States -->
      <div *ngIf="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando catálogo desde el backend...</p>
      </div>

      <div *ngIf="errorMessage" class="error-banner">
        <i class="bi bi-exclamation-triangle-fill"></i>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Products Grid -->
      <div *ngIf="!isLoading && filteredProductos.length > 0" class="products-grid">
        <div *ngFor="let p of filteredProductos" class="product-card glass-panel">
          <!-- Image Container -->
          <div class="image-wrapper">
            <img
              [src]="p.imagenUrl || fallbackImage"
              [alt]="p.nombre"
              class="product-image"
              (error)="onImageError($event)"
              loading="lazy"
            />
            <div class="image-overlay">
              <span class="s3-tag" *ngIf="p.s3Key">
                <i class="bi bi-cloud-arrow-up-fill"></i> S3
              </span>
            </div>
            <!-- Stock Badge -->
            <div class="stock-badge-wrapper">
              <span class="badge" [ngClass]="getStockBadgeClass(p.stock)">
                <i class="bi" [ngClass]="p.stock > 10 ? 'bi-check-circle-fill' : (p.stock > 0 ? 'bi-exclamation-circle-fill' : 'bi-x-circle-fill')"></i>
                {{ p.stock > 0 ? p.stock + ' en stock' : 'Agotado' }}
              </span>
            </div>
          </div>

          <!-- Product Details -->
          <div class="card-body">
            <div class="card-meta">
              <span class="product-code">{{ p.codigo }}</span>
            </div>
            <h3 class="product-name" [title]="p.nombre">{{ p.nombre }}</h3>
            <p class="product-desc">{{ p.descripcion || 'Sin descripción adicional' }}</p>

            <div class="price-container">
              <div>
                <span class="currency-label">Precio Unitario</span>
                <div class="price-usd">\${{ p.precioUnitario | number:'1.2-2' }} <small>USD</small></div>
              </div>
              <div class="price-gtq text-right">
                <span class="currency-label">Aprox. GTQ</span>
                <div class="gtq-val">Q{{ (p.precioUnitario * tipoCambioVenta) | number:'1.2-2' }}</div>
              </div>
            </div>

            <div class="card-actions">
              <button class="btn btn-sm btn-danger" (click)="deleteProducto(p)" title="Eliminar producto">
                <i class="bi bi-trash"></i> Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && filteredProductos.length === 0" class="empty-state glass-panel">
        <i class="bi bi-inbox empty-icon"></i>
        <h3>No se encontraron productos</h3>
        <p>No hay productos registrados o que coincidan con la búsqueda.</p>
        <button class="btn btn-primary mt-3" (click)="openCreateModal()">
          <i class="bi bi-plus-circle"></i> Registrar primer producto
        </button>
      </div>

      <!-- Modal Crear Producto -->
      <div *ngIf="showModal" class="modal-backdrop" (click)="closeModalOnBackdrop($event)">
        <div class="modal-card glass-panel">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Registrar Nuevo Producto</h2>
              <p class="modal-subtitle">La fotografía se subirá automáticamente a Amazon AWS S3</p>
            </div>
            <button class="close-btn" (click)="closeModal()">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <form (ngSubmit)="saveProducto()" class="modal-form">
            <!-- Image Picker / Preview -->
            <div class="form-group image-upload-group">
              <label class="form-label">Fotografía del Producto (AWS S3)</label>
              
              <div class="image-dropzone" (click)="fileInput.click()">
                <input
                  #fileInput
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  (change)="onFileSelected($event)"
                  style="display: none;"
                />

                <div *ngIf="!imagePreview" class="dropzone-placeholder">
                  <i class="bi bi-cloud-arrow-up drop-icon"></i>
                  <span class="drop-text">Haz clic para seleccionar fotografía</span>
                  <span class="drop-hint">PNG, JPG, WEBP hasta 10MB</span>
                </div>

                <div *ngIf="imagePreview" class="dropzone-preview">
                  <img [src]="imagePreview" alt="Vista previa" class="preview-img" />
                  <div class="preview-overlay">
                    <i class="bi bi-arrow-repeat"></i> Cambiar imagen
                  </div>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group col-md-6">
                <label class="form-label">Código Único *</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Ej: P100-AZ"
                  [(ngModel)]="newProducto.codigo"
                  name="codigo"
                  required
                />
              </div>

              <div class="form-group col-md-6">
                <label class="form-label">Stock Inicial *</label>
                <input
                  type="number"
                  min="0"
                  class="form-control"
                  placeholder="0"
                  [(ngModel)]="newProducto.stock"
                  name="stock"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Nombre del Producto *</label>
              <input
                type="text"
                class="form-control"
                placeholder="Ej: Café Gourmet 500g"
                [(ngModel)]="newProducto.nombre"
                name="nombre"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Descripción</label>
              <textarea
                class="form-control"
                rows="2"
                placeholder="Detalles sobre presentación, peso o características..."
                [(ngModel)]="newProducto.descripcion"
                name="descripcion"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group col-md-6">
                <label class="form-label">Precio Unitario (USD) *</label>
                <div class="input-prefix-wrapper">
                  <span class="input-prefix">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    class="form-control with-prefix"
                    placeholder="0.00"
                    [(ngModel)]="newProducto.precioUnitario"
                    name="precioUnitario"
                    required
                  />
                </div>
              </div>

              <div class="form-group col-md-6">
                <label class="form-label">Aproximado en Quetzales</label>
                <div class="gtq-preview-box">
                  Q{{ ((newProducto.precioUnitario || 0) * tipoCambioVenta) | number:'1.2-2' }}
                </div>
              </div>
            </div>

            <div *ngIf="modalError" class="modal-error">
              <i class="bi bi-exclamation-circle-fill"></i>
              <span>{{ modalError }}</span>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()" [disabled]="isSaving">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="isSaving || !isFormValid()">
                <span *ngIf="isSaving" class="spinner-sm"></span>
                <i *ngIf="!isSaving" class="bi bi-cloud-arrow-up"></i>
                <span>{{ isSaving ? 'Subiendo a S3 y Guardando...' : 'Guardar y Subir a S3' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .catalogo-page {
      max-width: 1300px;
      margin: 0 auto;
      padding: 0 24px 60px;
    }

    .header-section {
      padding: 28px;
      margin-bottom: 32px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      margin-bottom: 24px;
    }

    .page-title {
      font-size: 2rem;
      margin-bottom: 6px;
    }

    .page-desc {
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    .aws-text {
      color: #fb923c;
    }

    .search-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .search-input-wrapper {
      position: relative;
      flex: 1;
      max-width: 500px;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-dim);
    }

    .search-input {
      padding-left: 40px;
    }

    .stat-badge {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .stat-badge strong {
      color: #fff;
    }

    /* Grid */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .product-card {
      display: flex;
      flex-direction: column;
      transition: var(--transition);
      border-radius: 14px;
    }

    .product-card:hover {
      transform: translateY(-4px);
      border-color: rgba(99, 102, 241, 0.35);
      box-shadow: 0 16px 30px rgba(0, 0, 0, 0.5);
    }

    .image-wrapper {
      position: relative;
      width: 100%;
      height: 200px;
      background: #1f2937;
      overflow: hidden;
      border-radius: 14px 14px 0 0;
    }

    .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }

    .product-card:hover .product-image {
      transform: scale(1.05);
    }

    .image-overlay {
      position: absolute;
      top: 10px;
      left: 10px;
    }

    .s3-tag {
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(4px);
      color: #fb923c;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      border: 1px solid rgba(249, 115, 22, 0.3);
    }

    .stock-badge-wrapper {
      position: absolute;
      top: 10px;
      right: 10px;
    }

    .card-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .card-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .product-code {
      font-size: 0.75rem;
      font-weight: 700;
      color: #818cf8;
      background: rgba(99, 102, 241, 0.1);
      padding: 2px 8px;
      border-radius: 6px;
    }

    .product-name {
      font-size: 1.15rem;
      margin-bottom: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .product-desc {
      font-size: 0.85rem;
      color: var(--text-dim);
      margin-bottom: 16px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      height: 2.6em;
    }

    .price-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 12px 14px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-glass);
      border-radius: 10px;
      margin-top: auto;
      margin-bottom: 16px;
    }

    .currency-label {
      font-size: 0.7rem;
      color: var(--text-dim);
      text-transform: uppercase;
      font-weight: 600;
    }

    .price-usd {
      font-family: var(--font-heading);
      font-size: 1.35rem;
      font-weight: 800;
      color: #fff;
    }

    .price-usd small {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .price-gtq .gtq-val {
      font-family: var(--font-heading);
      font-size: 1rem;
      font-weight: 700;
      color: #34d399;
    }

    .text-right {
      text-align: right;
    }

    .card-actions {
      display: flex;
      justify-content: flex-end;
    }

    /* Modal Styles */
    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-glass);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-title {
      font-size: 1.3rem;
    }

    .modal-subtitle {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.1rem;
      cursor: pointer;
      padding: 4px;
    }

    .close-btn:hover {
      color: #fff;
    }

    .modal-form {
      padding: 20px 24px;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .col-md-6 {
      flex: 1;
    }

    /* Dropzone */
    .image-dropzone {
      border: 2px dashed rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      cursor: pointer;
      background: rgba(17, 24, 39, 0.6);
      transition: var(--transition);
      min-height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .image-dropzone:hover {
      border-color: var(--primary);
      background: rgba(99, 102, 241, 0.05);
    }

    .dropzone-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .drop-icon {
      font-size: 2rem;
      color: var(--primary);
    }

    .drop-text {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-main);
    }

    .drop-hint {
      font-size: 0.75rem;
      color: var(--text-dim);
    }

    .dropzone-preview {
      position: relative;
      width: 100%;
      height: 140px;
      border-radius: 8px;
      overflow: hidden;
    }

    .preview-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .preview-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 600;
      font-size: 0.85rem;
      gap: 6px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .dropzone-preview:hover .preview-overlay {
      opacity: 1;
    }

    .input-prefix-wrapper {
      position: relative;
    }

    .input-prefix {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-weight: 700;
    }

    .with-prefix {
      padding-left: 28px;
    }

    .gtq-preview-box {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 10px;
      padding: 11px 16px;
      font-family: var(--font-heading);
      font-weight: 700;
      font-size: 1.1rem;
      color: #34d399;
      display: flex;
      align-items: center;
    }

    .modal-error {
      background: rgba(244, 63, 94, 0.1);
      border: 1px solid rgba(244, 63, 94, 0.3);
      color: #fb7185;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
    }

    .spinner, .spinner-sm {
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .spinner {
      width: 40px;
      height: 40px;
      margin: 0 auto 16px;
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
      border-width: 2px;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 60px 20px;
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

    @media (max-width: 640px) {
      .header-content, .search-bar, .form-row {
        flex-direction: column;
      }
      .search-input-wrapper {
        max-width: 100%;
      }
    }
  `]
})
export class CatalogoComponent implements OnInit {
  productos: Producto[] = [];
  filteredProductos: Producto[] = [];
  searchQuery = '';
  isLoading = true;
  errorMessage = '';

  tipoCambioVenta = 7.8;
  fallbackImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60';

  // Modal
  showModal = false;
  isSaving = false;
  modalError = '';
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  newProducto: Producto = {
    codigo: '',
    nombre: '',
    descripcion: '',
    precioUnitario: 0,
    stock: 0
  };

  constructor(
    private productoService: ProductoService,
    private tipoCambioService: TipoCambioService
  ) {}

  ngOnInit(): void {
    this.loadTipoCambio();
    this.loadProductos();
  }

  loadTipoCambio(): void {
    this.tipoCambioService.getTipoCambio().subscribe({
      next: (res) => {
        if (res && res.venta) {
          this.tipoCambioVenta = res.venta;
        }
      }
    });
  }

  loadProductos(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.productoService.getProductos().subscribe({
      next: (data) => {
        this.productos = data;
        this.filteredProductos = [...data];
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'No se pudo conectar con el backend. Asegúrate de que Spring Boot esté ejecutándose.';
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.filteredProductos = [...this.productos];
    } else {
      this.filteredProductos = this.productos.filter(
        (p) => p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q)
      );
    }
  }

  getStockBadgeClass(stock: number): string {
    if (stock > 10) return 'badge-in-stock';
    if (stock > 0) return 'badge-low-stock';
    return 'badge-out-stock';
  }

  onImageError(event: any): void {
    event.target.src = this.fallbackImage;
  }

  openCreateModal(): void {
    this.newProducto = {
      codigo: '',
      nombre: '',
      descripcion: '',
      precioUnitario: 0,
      stock: 10
    };
    this.selectedFile = null;
    this.imagePreview = null;
    this.modalError = '';
    this.showModal = true;
  }

  closeModal(): void {
    if (!this.isSaving) {
      this.showModal = false;
    }
  }

  closeModalOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal();
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  isFormValid(): boolean {
    return (
      !!this.newProducto.codigo &&
      !!this.newProducto.nombre &&
      this.newProducto.precioUnitario > 0 &&
      this.newProducto.stock >= 0
    );
  }

  saveProducto(): void {
    if (!this.isFormValid()) {
      this.modalError = 'Por favor completa todos los campos obligatorios.';
      return;
    }

    this.isSaving = true;
    this.modalError = '';

    const formData = new FormData();
    formData.append('codigo', this.newProducto.codigo);
    formData.append('nombre', this.newProducto.nombre);
    formData.append('descripcion', this.newProducto.descripcion || '');
    formData.append('precioUnitario', this.newProducto.precioUnitario.toString());
    formData.append('stock', this.newProducto.stock.toString());

    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile);
    }

    this.productoService.createProducto(formData).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.showModal = false;
        this.loadProductos();
      },
      error: (err) => {
        this.isSaving = false;
        this.modalError = err.error?.message || 'Error al guardar el producto o subir a AWS S3.';
      }
    });
  }

  deleteProducto(p: Producto): void {
    if (!p.id) return;
    if (confirm(`¿Estás seguro de eliminar el producto "${p.nombre}"?`)) {
      this.productoService.deleteProducto(p.id).subscribe({
        next: () => {
          this.loadProductos();
        },
        error: (err) => {
          alert('Error al eliminar producto: ' + (err.error?.message || 'Error del servidor'));
        }
      });
    }
  }
}
