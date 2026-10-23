package com.desweb.facturacion.controller;

import com.desweb.facturacion.dto.FacturaRequestDto;
import com.desweb.facturacion.model.Factura;
import com.desweb.facturacion.service.FacturaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/facturas")
public class FacturaController {

    private final FacturaService facturaService;

    public FacturaController(FacturaService facturaService) {
        this.facturaService = facturaService;
    }

    @GetMapping
    public ResponseEntity<List<Factura>> getAllFacturas() {
        return ResponseEntity.ok(facturaService.getAllFacturas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getFacturaById(@PathVariable Long id) {
        return facturaService.getFacturaById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createFactura(@Valid @RequestBody FacturaRequestDto request) {
        try {
            Factura factura = facturaService.createFactura(request);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Factura guardada exitosamente");
            response.put("factura_id", factura.getId());
            response.put("data", factura);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error al procesar la factura: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
