package com.desweb.facturacion.dto;

import jakarta.validation.constraints.NotBlank;

public class ClienteDto {
    private Long id;

    @NotBlank(message = "El NIT es obligatorio")
    private String nit;

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    private String ciudad;
    private String metodoPagoPreferido = "Efectivo";

    public ClienteDto() {
    }

    public ClienteDto(Long id, String nit, String nombre, String ciudad, String metodoPagoPreferido) {
        this.id = id;
        this.nit = nit;
        this.nombre = nombre;
        this.ciudad = ciudad;
        this.metodoPagoPreferido = metodoPagoPreferido;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNit() {
        return nit;
    }

    public void setNit(String nit) {
        this.nit = nit;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getCiudad() {
        return ciudad;
    }

    public void setCiudad(String ciudad) {
        this.ciudad = ciudad;
    }

    public String getMetodoPagoPreferido() {
        return metodoPagoPreferido;
    }

    public void setMetodoPagoPreferido(String metodoPagoPreferido) {
        this.metodoPagoPreferido = metodoPagoPreferido;
    }
}
