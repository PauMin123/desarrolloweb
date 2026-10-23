package com.desweb.facturacion.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class FacturaTotalesDto {

    @NotNull
    @JsonProperty("subtotal_usd")
    private BigDecimal subtotalUsd;

    @NotNull
    @JsonProperty("iva_usd")
    private BigDecimal ivaUsd;

    @NotNull
    @JsonProperty("total_usd")
    private BigDecimal totalUsd;

    @NotNull
    @JsonProperty("total_gtq")
    private BigDecimal totalGtq;

    @NotNull
    @JsonProperty("tipo_cambio")
    private BigDecimal tipoCambio;

    public FacturaTotalesDto() {
    }

    public FacturaTotalesDto(BigDecimal subtotalUsd, BigDecimal ivaUsd, BigDecimal totalUsd, BigDecimal totalGtq, BigDecimal tipoCambio) {
        this.subtotalUsd = subtotalUsd;
        this.ivaUsd = ivaUsd;
        this.totalUsd = totalUsd;
        this.totalGtq = totalGtq;
        this.tipoCambio = tipoCambio;
    }

    public BigDecimal getSubtotalUsd() {
        return subtotalUsd;
    }

    public void setSubtotalUsd(BigDecimal subtotalUsd) {
        this.subtotalUsd = subtotalUsd;
    }

    public BigDecimal getIvaUsd() {
        return ivaUsd;
    }

    public void setIvaUsd(BigDecimal ivaUsd) {
        this.ivaUsd = ivaUsd;
    }

    public BigDecimal getTotalUsd() {
        return totalUsd;
    }

    public void setTotalUsd(BigDecimal totalUsd) {
        this.totalUsd = totalUsd;
    }

    public BigDecimal getTotalGtq() {
        return totalGtq;
    }

    public void setTotalGtq(BigDecimal totalGtq) {
        this.totalGtq = totalGtq;
    }

    public BigDecimal getTipoCambio() {
        return tipoCambio;
    }

    public void setTipoCambio(BigDecimal tipoCambio) {
        this.tipoCambio = tipoCambio;
    }
}
