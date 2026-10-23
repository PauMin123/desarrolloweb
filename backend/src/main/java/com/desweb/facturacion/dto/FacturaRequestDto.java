package com.desweb.facturacion.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class FacturaRequestDto {

    @NotNull(message = "El ID del cliente es obligatorio")
    @JsonProperty("cliente_id")
    private Long clienteId;

    @NotBlank(message = "El método de pago es obligatorio")
    @JsonProperty("metodo_pago")
    private String metodoPago;

    @NotEmpty(message = "La factura debe incluir al menos un producto")
    @Valid
    private List<FacturaItemRequestDto> productos;

    @NotNull(message = "Los totales de la factura son obligatorios")
    @Valid
    private FacturaTotalesDto totales;

    public FacturaRequestDto() {
    }

    public FacturaRequestDto(Long clienteId, String metodoPago, List<FacturaItemRequestDto> productos, FacturaTotalesDto totales) {
        this.clienteId = clienteId;
        this.metodoPago = metodoPago;
        this.productos = productos;
        this.totales = totales;
    }

    public Long getClienteId() {
        return clienteId;
    }

    public void setClienteId(Long clienteId) {
        this.clienteId = clienteId;
    }

    public String getMetodoPago() {
        return metodoPago;
    }

    public void setMetodoPago(String metodoPago) {
        this.metodoPago = metodoPago;
    }

    public List<FacturaItemRequestDto> getProductos() {
        return productos;
    }

    public void setProductos(List<FacturaItemRequestDto> productos) {
        this.productos = productos;
    }

    public FacturaTotalesDto getTotales() {
        return totales;
    }

    public void setTotales(FacturaTotalesDto totales) {
        this.totales = totales;
    }
}
