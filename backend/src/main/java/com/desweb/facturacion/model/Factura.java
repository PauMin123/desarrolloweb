package com.desweb.facturacion.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "facturas")
public class Factura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "El cliente es obligatorio")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @NotBlank(message = "El método de pago es obligatorio")
    @Column(name = "metodo_pago", nullable = false, length = 50)
    private String metodoPago;

    @NotNull
    @Column(name = "subtotal_usd", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotalUsd;

    @NotNull
    @Column(name = "iva_usd", nullable = false, precision = 10, scale = 2)
    private BigDecimal ivaUsd;

    @NotNull
    @Column(name = "total_usd", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalUsd;

    @NotNull
    @Column(name = "total_gtq", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalGtq;

    @NotNull
    @Column(name = "tipo_cambio", nullable = false, precision = 10, scale = 5)
    private BigDecimal tipoCambio;

    @JsonManagedReference
    @OneToMany(mappedBy = "factura", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<FacturaDetalle> detalles = new ArrayList<>();

    public Factura() {
    }

    public void addDetalle(FacturaDetalle detalle) {
        detalles.add(detalle);
        detalle.setFactura(this);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public String getMetodoPago() {
        return metodoPago;
    }

    public void setMetodoPago(String metodoPago) {
        this.metodoPago = metodoPago;
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

    public List<FacturaDetalle> getDetalles() {
        return detalles;
    }

    public void setDetalles(List<FacturaDetalle> detalles) {
        this.detalles = detalles;
    }
}
