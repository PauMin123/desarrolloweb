import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TipoCambioService } from '../../services/tipo-cambio.service';
import { TipoCambio } from '../../models/tipo-cambio.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  template: `
    <nav class="navbar glass-panel">
      <div class="nav-container">
        <!-- Logo -->
        <a routerLink="/" class="nav-brand">
          <div class="brand-icon">
            <i class="bi bi-receipt-cutoff"></i>
          </div>
          <div class="brand-text">
            <span class="brand-title">Factura<span class="highlight">Cloud</span></span>
            <span class="brand-subtitle">AWS S3 & Spring Boot</span>
          </div>
        </a>

        <!-- Links -->
        <div class="nav-links">
          <a routerLink="/facturacion" routerLinkActive="active" class="nav-link">
            <i class="bi bi-cart-check"></i>
            <span>Facturación Interactiva</span>
          </a>
          <a routerLink="/catalogo" routerLinkActive="active" class="nav-link">
            <i class="bi bi-grid-3x3-gap"></i>
            <span>Catálogo & S3</span>
          </a>
          <a routerLink="/historial" routerLinkActive="active" class="nav-link">
            <i class="bi bi-clock-history"></i>
            <span>Historial</span>
          </a>
        </div>

        <!-- Exchange Rate Badge -->
        <div class="nav-actions">
          <div class="rate-pill" title="Tipo de cambio oficial Banguat">
            <span class="rate-dot"></span>
            <span class="rate-label">USD/GTQ:</span>
            <span class="rate-value">Q{{ tipoCambio?.venta ? (tipoCambio?.venta | number:'1.2-2') : '7.80' }}</span>
          </div>

          <div class="s3-pill" title="Almacenamiento en AWS S3 Activo">
            <i class="bi bi-cloud-check-fill"></i>
            <span>AWS S3</span>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      margin: 16px 24px;
      padding: 12px 24px;
      position: sticky;
      top: 16px;
      z-index: 50;
      border-radius: 14px;
    }

    .nav-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
    }

    .brand-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      color: #fff;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-family: var(--font-heading);
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #fff;
      line-height: 1.1;
    }

    .highlight {
      background: linear-gradient(90deg, #6366f1, #06b6d4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-subtitle {
      font-size: 0.72rem;
      color: var(--text-dim);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 8px;
      color: var(--text-muted);
      font-family: var(--font-heading);
      font-weight: 600;
      font-size: 0.9rem;
      transition: var(--transition);
      text-decoration: none;
    }

    .nav-link i {
      font-size: 1.05rem;
    }

    .nav-link:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.05);
    }

    .nav-link.active {
      color: #fff;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .rate-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 9999px;
      font-size: 0.8rem;
    }

    .rate-dot {
      width: 7px;
      height: 7px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 8px #10b981;
    }

    .rate-label {
      color: var(--text-muted);
      font-weight: 500;
    }

    .rate-value {
      color: #34d399;
      font-weight: 700;
      font-family: var(--font-heading);
    }

    .s3-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(249, 115, 22, 0.12);
      border: 1px solid rgba(249, 115, 22, 0.3);
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #fb923c;
    }

    @media (max-width: 768px) {
      .navbar {
        margin: 10px;
        padding: 10px 14px;
      }
      .brand-subtitle, .nav-link span, .rate-label {
        display: none;
      }
    }
  `]
})
export class NavbarComponent implements OnInit {
  tipoCambio: TipoCambio | null = null;

  constructor(private tipoCambioService: TipoCambioService) {}

  ngOnInit(): void {
    this.tipoCambioService.getTipoCambio().subscribe({
      next: (data) => (this.tipoCambio = data),
      error: () => {
        this.tipoCambio = {
          success: true,
          fecha: new Date().toLocaleDateString(),
          compra: 7.8,
          venta: 7.8,
          moneda: 'GTQ'
        };
      }
    });
  }
}
