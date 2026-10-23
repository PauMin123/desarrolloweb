package com.desweb.facturacion.repository;

import com.desweb.facturacion.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findByNit(String nit);
    boolean existsByNit(String nit);
}
