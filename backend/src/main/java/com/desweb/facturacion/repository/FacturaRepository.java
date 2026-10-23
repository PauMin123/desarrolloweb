package com.desweb.facturacion.repository;

import com.desweb.facturacion.model.Factura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacturaRepository extends JpaRepository<Factura, Long> {
    List<Factura> findAllByOrderByFechaDesc();
    List<Factura> findByClienteIdOrderByFechaDesc(Long clienteId);
}
