<?php
header('Content-Type: application/json');
require_once 'db.php';

$action = $_GET['action'] ?? '';

if ($action === 'get_client') {
    $nit = $_GET['nit'] ?? '';
    if (empty($nit)) {
        echo json_encode(['success' => false, 'message' => 'NIT required']);
        exit;
    }
    
    $stmt = $pdo->prepare("SELECT id, nombre, ciudad, metodo_pago_preferido FROM clientes WHERE nit = ? LIMIT 1");
    $stmt->execute([$nit]);
    $client = $stmt->fetch();
    
    if ($client) {
        echo json_encode(['success' => true, 'data' => $client]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Client not found']);
    }
    exit;
}

if ($action === 'create_client') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || empty($data['nit']) || empty($data['nombre'])) {
        echo json_encode(['success' => false, 'message' => 'NIT y Nombre son obligatorios']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO clientes (nit, nombre, ciudad, metodo_pago_preferido) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $data['nit'], 
            $data['nombre'], 
            $data['ciudad'] ?? '', 
            'Efectivo'
        ]);
        $id = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true, 
            'data' => [
                'id' => $id, 
                'nit' => $data['nit'], 
                'nombre' => $data['nombre'], 
                'ciudad' => $data['ciudad'], 
                'metodo_pago_preferido' => 'Efectivo'
            ]
        ]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Duplicate entry
            echo json_encode(['success' => false, 'message' => 'El NIT ya está registrado en el sistema.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
    }
    exit;
}
if ($action === 'search_products') {
    $q = $_GET['q'] ?? '';
    if (empty($q)) {
        echo json_encode(['success' => true, 'data' => []]);
        exit;
    }
    
    $stmt = $pdo->prepare("SELECT id, codigo, descripcion, precio_unitario FROM productos WHERE codigo LIKE ? OR descripcion LIKE ? LIMIT 10");
    $term = "%$q%";
    $stmt->execute([$term, $term]);
    $products = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'data' => $products]);
    exit;
}

if ($action === 'save_invoice') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['cliente_id'], $data['productos'], $data['totales'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid data payload']);
        exit;
    }

    try {
        $pdo->beginTransaction();
        
        // Insert factura
        $stmt = $pdo->prepare("
            INSERT INTO facturas (cliente_id, metodo_pago, subtotal_usd, iva_usd, total_usd, total_gtq, tipo_cambio)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['cliente_id'],
            $data['metodo_pago'],
            $data['totales']['subtotal_usd'],
            $data['totales']['iva_usd'],
            $data['totales']['total_usd'],
            $data['totales']['total_gtq'],
            $data['totales']['tipo_cambio']
        ]);
        
        $factura_id = $pdo->lastInsertId();
        
        // Insert detalles
        $stmtDetalle = $pdo->prepare("
            INSERT INTO factura_detalles (factura_id, producto_id, cantidad, precio_unitario, subtotal)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        foreach ($data['productos'] as $prod) {
            $stmtDetalle->execute([
                $factura_id,
                $prod['id'],
                $prod['cantidad'],
                $prod['precio_unitario'],
                $prod['subtotal']
            ]);
        }
        
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Factura guardada exitosamente', 'factura_id' => $factura_id]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Error saving invoice: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
?>
