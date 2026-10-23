-- =====================================================================
-- SISTEMA DE FACTURACIÓN WEB E INTEGRACIÓN CON AWS S3 (FASE 2)
-- Script de Base de Datos MySQL (Compatible con local XAMPP y Cloud DB)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS pos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pos_db;

-- 1. Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nit VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    ciudad VARCHAR(100),
    metodo_pago_preferido VARCHAR(50) DEFAULT 'Efectivo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla de Productos
CREATE TABLE IF NOT EXISTS productos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(255),
    precio_unitario DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    imagen_url VARCHAR(500) NULL,
    s3_key VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de Facturas
CREATE TABLE IF NOT EXISTS facturas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    metodo_pago VARCHAR(50) NOT NULL,
    subtotal_usd DECIMAL(10, 2) NOT NULL,
    iva_usd DECIMAL(10, 2) NOT NULL,
    total_usd DECIMAL(10, 2) NOT NULL,
    total_gtq DECIMAL(10, 2) NOT NULL,
    tipo_cambio DECIMAL(10, 5) NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla de Detalle de Factura
CREATE TABLE IF NOT EXISTS factura_detalles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    factura_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos Semilla
INSERT IGNORE INTO clientes (nit, nombre, ciudad, metodo_pago_preferido) VALUES 
('1234567-8', 'Juan Pérez', 'Ciudad de Guatemala', 'Efectivo'),
('8765432-1', 'María García', 'Antigua Guatemala', 'Tarjeta'),
('CF', 'Consumidor Final', 'Ciudad de Guatemala', 'Efectivo'),
('9988776-5', 'Distribuidora Los Volcanes S.A.', 'Quetzaltenango', 'Transferencia');

INSERT IGNORE INTO productos (codigo, nombre, descripcion, precio_unitario, stock, imagen_url, s3_key) VALUES 
('P001-AZ', 'Arroz Blanco Extra 2lb', 'Arroz de grano largo seleccionado premium bolsa 2lb', 2.50, 45, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60', 'seed-arroz.jpg'),
('P023-LC', 'Leche Entera 1 Litro', 'Leche pasteurizada enriquecida con vitaminas A y D', 3.10, 30, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=60', 'seed-leche.jpg'),
('P105-PH', 'Papel Higiénico 4 Pack', 'Papel higiénico doble hoja ultra suave y resistente', 4.25, 20, 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=500&auto=format&fit=crop&q=60', 'seed-papel.jpg'),
('P999-CO', 'Bebida Refrescante Cola 2L', 'Refresco de cola botella familiar retornable 2 Litros', 2.00, 50, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60', 'seed-cola.jpg'),
('P542-AC', 'Aceite Vegetal 800ml', 'Aceite vegetal comestible puro para cocinar 800ml', 3.75, 25, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60', 'seed-aceite.jpg'),
('P201-CF', 'Café Tostado y Molido Gourmet 400g', 'Café 100% arábica de estricta altura cosechado en Antigua Guatemala bolsa 400g', 5.50, 35, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&auto=format&fit=crop&q=60', 'seed-cafe.jpg'),
('P310-AV', 'Granola con Avena, Almendras y Miel 500g', 'Granola horneada con hojuelas de avena integral almendras y miel pura', 4.20, 28, 'https://images.unsplash.com/photo-1517093157656-b9ec81c626eb?w=500&auto=format&fit=crop&q=60', 'seed-granola.jpg'),
('P112-PS', 'Pasta Spaghetti Clásico 500g', 'Pasta de sémola de trigo candeal importada paquete de 500g', 1.85, 60, 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=500&auto=format&fit=crop&q=60', 'seed-pasta.jpg'),
('P405-JG', 'Jugo de Naranja 100% Puro 1 Litro', 'Jugo de naranja exprimido 100% puro sin azúcar añadida ni conservantes', 2.95, 40, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=60', 'seed-jugo.jpg'),
('P614-QS', 'Queso Mozzarella Rebanado 400g', 'Queso mozzarella semiduro tajado ideal para sándwiches y pizzas', 4.80, 22, 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=500&auto=format&fit=crop&q=60', 'seed-queso.jpg'),
('P720-GL', 'Galletas de Chocolate Artesanales 300g', 'Galletas crocantes de chocolate con chispas y crema de vainilla', 2.15, 55, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=60', 'seed-galletas.jpg'),
('P811-DT', 'Detergente Líquido Ropa 2L', 'Detergente para ropa blanca y de color con aroma fresco floral galón 2L', 6.90, 18, 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=500&auto=format&fit=crop&q=60', 'seed-detergente.jpg'),
('P150-MZ', 'Manzanas Rojas Frescas 1kg', 'Manzanas rojas frescas y crujientes seleccionadas de primera calidad bolsa 1kg', 3.40, 30, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=60', 'seed-manzanas.jpg');
