<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SISTEMA POS - FACTURACIÓN</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>
<body>
    <div class="container">
        <header>
            <h1>SISTEMA POS - FACTURACIÓN</h1>
            <div class="header-info">
                Conexión BD: <span class="status-online">● En línea</span><br>
                Fecha: <span id="current-date">--/--/----</span><br>
                Cajero: Usuario Demo
            </div>
        </header>

        <!-- 1. DATOS DEL CLIENTE -->
        <div class="section-card">
            <h3>1. DATOS DEL CLIENTE</h3>
            <div class="form-row">
                <div class="form-group" style="flex: 2;">
                    <input type="text" id="client-nit" placeholder="NIT (Ej. 1234567-8)" value="1234567-8">
                </div>
                <button type="button" class="btn-primary" id="btn-search-client">Buscar</button>
                <button type="button" class="btn-success" id="btn-new-client">+ Nuevo Cliente</button>
            </div>
            <div class="form-row">
                <div class="form-group" style="flex: 2;">
                    <input type="text" id="client-name" placeholder="Nombre" disabled>
                </div>
                <div class="form-group" style="flex: 2;">
                    <input type="text" id="client-city" placeholder="Ciudad" disabled>
                </div>
                <div class="form-group" style="flex: 1;">
                    <select id="payment-method">
                        <option value="Efectivo">Pago: Efectivo</option>
                        <option value="Tarjeta">Pago: Tarjeta</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- 2. AGREGAR PRODUCTOS -->
        <div class="section-card">
            <h3>2. AGREGAR PRODUCTOS A LA VENTA</h3>
            <div class="form-row relative">
                <div class="form-group" style="flex: 3;">
                    <input type="text" id="product-search" placeholder="Escanear código de barras o ingresar nombre del producto..." autocomplete="off">
                    <div id="product-results" class="search-results" style="display:none;"></div>
                </div>
                <button type="button" class="btn-primary" id="btn-add-product">Agregar Producto</button>
            </div>
        </div>

        <!-- 3. DETALLE DE LA FACTURA -->
        <div class="section-card">
            <h3>3. DETALLE DE LA FACTURA</h3>
            <table>
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Descripción</th>
                        <th style="width: 80px;">Cant.</th>
                        <th>Precio Unit. ($)</th>
                        <th>Subtotal ($)</th>
                        <th style="width: 60px;">Acción</th>
                    </tr>
                </thead>
                <tbody id="invoice-tbody">
                    <!-- Products will be dynamically added here -->
                </tbody>
            </table>

            <div class="summary-container">
                <div class="exchange-rate-card">
                    <h4>Tipo de Cambio Interno:</h4>
                    <div class="exchange-rate-val">
                        1 USD = Q <span id="ws-rate">Cargando...</span> GTQ
                    </div>
                    <div class="exchange-rate-sub">
                        Consultado desde Banco de Guatemala (WS)
                        <br><span id="ws-date"></span>
                    </div>
                </div>
                <div class="totals-card">
                    <div class="total-row">
                        <span>Sub-Total:</span>
                        <span>$ <span id="summary-subtotal">0.00</span></span>
                    </div>
                    <div class="total-row">
                        <span>Impuesto (IVA 12%):</span>
                        <span>$ <span id="summary-iva">0.00</span></span>
                    </div>
                    <div class="total-row main-total-usd">
                        <span>Total USD:</span>
                        <span>$ <span id="summary-total-usd">0.00</span></span>
                    </div>
                    <div class="total-row main-total-gtq">
                        <span>Total Local (GTQ):</span>
                        <span>Q <span id="summary-total-gtq">0.00</span></span>
                    </div>
                    <div style="margin-top: 15px; text-align: right;">
                        <button class="btn-success" id="btn-save-invoice" style="font-size: 16px; padding: 12px 25px;">Guardar Factura</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="app.js"></script>
</body>
</html>
