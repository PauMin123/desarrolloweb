<?php
$host = '127.0.0.1';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create DB
    $pdo->exec("CREATE DATABASE IF NOT EXISTS pos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "Database pos_db created successfully.<br>";
    
    $pdo->exec("USE pos_db");
    
    // Create Tables
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS clientes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nit VARCHAR(20) UNIQUE NOT NULL,
            nombre VARCHAR(100) NOT NULL,
            ciudad VARCHAR(100),
            metodo_pago_preferido VARCHAR(50) DEFAULT 'Efectivo'
        )
    ");
    echo "Table clientes created successfully.<br>";

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS productos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            codigo VARCHAR(20) UNIQUE NOT NULL,
            descripcion VARCHAR(255) NOT NULL,
            precio_unitario DECIMAL(10, 2) NOT NULL
        )
    ");
    echo "Table productos created successfully.<br>";
    
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS facturas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            cliente_id INT NOT NULL,
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
            metodo_pago VARCHAR(50) NOT NULL,
            subtotal_usd DECIMAL(10, 2) NOT NULL,
            iva_usd DECIMAL(10, 2) NOT NULL,
            total_usd DECIMAL(10, 2) NOT NULL,
            total_gtq DECIMAL(10, 2) NOT NULL,
            tipo_cambio DECIMAL(10, 5) NOT NULL,
            FOREIGN KEY (cliente_id) REFERENCES clientes(id)
        )
    ");
    echo "Table facturas created successfully.<br>";

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS factura_detalles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            factura_id INT NOT NULL,
            producto_id INT NOT NULL,
            cantidad INT NOT NULL,
            precio_unitario DECIMAL(10, 2) NOT NULL,
            subtotal DECIMAL(10, 2) NOT NULL,
            FOREIGN KEY (factura_id) REFERENCES facturas(id),
            FOREIGN KEY (producto_id) REFERENCES productos(id)
        )
    ");
    echo "Table factura_detalles created successfully.<br>";

    // Insert dummy data
    $pdo->exec("
        INSERT IGNORE INTO clientes (nit, nombre, ciudad, metodo_pago_preferido) VALUES 
        ('1234567-8', 'Juan Pérez', 'Ciudad, Guatemala', 'Efectivo'),
        ('8765432-1', 'Maria Garcia', 'Antigua Guatemala', 'Tarjeta'),
        ('CF', 'Consumidor Final', 'Ciudad, Guatemala', 'Efectivo')
    ");
    echo "Dummy clients inserted.<br>";

    $pdo->exec("
        INSERT IGNORE INTO productos (codigo, descripcion, precio_unitario) VALUES 
        ('P001-AZ', 'Arroz Gold 2lb', 2.50),
        ('P023-LC', 'Leche Entera 1L', 3.10),
        ('P105-PH', 'Papel Higiénico 4pk', 4.25),
        ('P999-CO', 'Coca Cola 2L', 2.00)
    ");
    echo "Dummy products inserted.<br>";

} catch (PDOException $e) {
    die("DB Error: " . $e->getMessage());
}
?>
