package com.desweb.facturacion.controller;

import com.desweb.facturacion.dto.TipoCambioDto;
import com.desweb.facturacion.service.TipoCambioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tipo-cambio")
public class TipoCambioController {

    private final TipoCambioService tipoCambioService;

    public TipoCambioController(TipoCambioService tipoCambioService) {
        this.tipoCambioService = tipoCambioService;
    }

    @GetMapping
    public ResponseEntity<TipoCambioDto> getTipoCambio() {
        return ResponseEntity.ok(tipoCambioService.getTipoCambioDia());
    }
}
