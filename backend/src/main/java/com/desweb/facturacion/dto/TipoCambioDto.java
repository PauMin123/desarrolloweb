package com.desweb.facturacion.dto;

import java.math.BigDecimal;

public class TipoCambioDto {
    private boolean success;
    private String fecha;
    private BigDecimal compra;
    private BigDecimal venta;
    private String moneda = "GTQ";

    public TipoCambioDto() {
    }

    public TipoCambioDto(boolean success, String fecha, BigDecimal compra, BigDecimal venta, String moneda) {
        this.success = success;
        this.fecha = fecha;
        this.compra = compra;
        this.venta = venta;
        this.moneda = moneda;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getFecha() {
        return fecha;
    }

    public void setFecha(String fecha) {
        this.fecha = fecha;
    }

    public BigDecimal getCompra() {
        return compra;
    }

    public void setCompra(BigDecimal compra) {
        this.compra = compra;
    }

    public BigDecimal getVenta() {
        return venta;
    }

    public void setVenta(BigDecimal venta) {
        this.venta = venta;
    }

    public String getMoneda() {
        return moneda;
    }

    public void setMoneda(String moneda) {
        this.moneda = moneda;
    }
}
