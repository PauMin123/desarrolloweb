<?php
header('Content-Type: application/json');

try {
    // The Banguat WS WSDL URL
    $wsdl = "https://banguat.gob.gt/variables/ws/TipoCambio.asmx?WSDL";
    
    if (!extension_loaded('soap')) {
        echo json_encode([
            'success' => false,
            'message' => 'SOAP extension is not enabled in php.ini',
            'fallback_rate' => 7.80
        ]);
        exit;
    }

    // Create the SOAP client
    $client = new SoapClient($wsdl, [
        'trace' => true,
        'exceptions' => true,
    ]);
    
    // Call the TipoCambioDia method
    $response = $client->TipoCambioDia();
    
    // The response structure: 
    // $response->TipoCambioDiaResult->CambioDolar->VarDolar->referencia (date), ->venta, ->compra
    if (isset($response->TipoCambioDiaResult->CambioDolar->VarDolar)) {
        $data = $response->TipoCambioDiaResult->CambioDolar->VarDolar;
        
        // We typically use the "venta" rate for transactions, or an average. Let's provide both.
        echo json_encode([
            'success' => true,
            'fecha' => $data->fecha,
            'compra' => $data->compra,
            'venta' => $data->venta,
            'moneda' => 'GTQ'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid response from Banguat']);
    }
} catch (SoapFault $e) {
    // Fallback if WS fails, or SOAP extension not loaded
    echo json_encode([
        'success' => false, 
        'message' => $e->getMessage(),
        'fallback_rate' => 7.80 // Safe fallback
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
