package com.desweb.facturacion.repository;

import com.desweb.facturacion.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    Optional<Producto> findByCodigo(String codigo);
    boolean existsByCodigo(String codigo);
    List<Producto> findByCodigoContainingIgnoreCaseOrNombreContainingIgnoreCase(String codigo, String nombre);
    List<Producto> findAllByOrderByNombreAsc();
}
