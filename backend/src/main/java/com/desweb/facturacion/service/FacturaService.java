package com.desweb.facturacion.service;

import com.desweb.facturacion.dto.FacturaItemRequestDto;
import com.desweb.facturacion.dto.FacturaRequestDto;
import com.desweb.facturacion.model.Cliente;
import com.desweb.facturacion.model.Factura;
import com.desweb.facturacion.model.FacturaDetalle;
import com.desweb.facturacion.model.Producto;
import com.desweb.facturacion.repository.ClienteRepository;
import com.desweb.facturacion.repository.FacturaRepository;
import com.desweb.facturacion.repository.ProductoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class FacturaService {

    private static final Logger log = LoggerFactory.getLogger(FacturaService.class);

    private final FacturaRepository facturaRepository;
    private final ClienteRepository clienteRepository;
    private final ProductoRepository productoRepository;

    public FacturaService(FacturaRepository facturaRepository, ClienteRepository clienteRepository, ProductoRepository productoRepository) {
        this.facturaRepository = facturaRepository;
        this.clienteRepository = clienteRepository;
        this.productoRepository = productoRepository;
    }

    @Transactional(readOnly = true)
    public List<Factura> getAllFacturas() {
        return facturaRepository.findAllByOrderByFechaDesc();
    }

    @Transactional(readOnly = true)
    public Optional<Factura> getFacturaById(Long id) {
        return facturaRepository.findById(id);
    }

    @Transactional
    public Factura createFactura(FacturaRequestDto request) {
        // 1. Validar Cliente
        Cliente cliente = clienteRepository.findById(request.getClienteId())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado con ID: " + request.getClienteId()));

        // 2. Crear Factura Encabezado
        Factura factura = new Factura();
        factura.setCliente(cliente);
        factura.setFecha(LocalDateTime.now());
        factura.setMetodoPago(request.getMetodoPago());
        factura.setSubtotalUsd(request.getTotales().getSubtotalUsd());
        factura.setIvaUsd(request.getTotales().getIvaUsd());
        factura.setTotalUsd(request.getTotales().getTotalUsd());
        factura.setTotalGtq(request.getTotales().getTotalGtq());
        factura.setTipoCambio(request.getTotales().getTipoCambio());

        // 3. Procesar y Validar cada Producto del Detalle
        for (FacturaItemRequestDto itemDto : request.getProductos()) {
            Producto producto = productoRepository.findById(itemDto.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + itemDto.getId()));

            // Validar stock disponible
            if (producto.getStock() < itemDto.getCantidad()) {
                throw new IllegalArgumentException(String.format(
                        "Stock insuficiente para el producto '%s' (Código: %s). Solicitado: %d, Disponible: %d",
                        producto.getNombre(), producto.getCodigo(), itemDto.getCantidad(), producto.getStock()
                ));
            }

            // Descontar stock
            producto.setStock(producto.getStock() - itemDto.getCantidad());
            productoRepository.save(producto);

            // Crear ítem de detalle
            FacturaDetalle detalle = new FacturaDetalle();
            detalle.setProducto(producto);
            detalle.setCantidad(itemDto.getCantidad());
            detalle.setPrecioUnitario(itemDto.getPrecioUnitario());
            detalle.setSubtotal(itemDto.getSubtotal());

            factura.addDetalle(detalle);
        }

        // 4. Guardar Factura con sus detalles (CascadeType.ALL)
        Factura facturaGuardada = facturaRepository.save(factura);
        log.info("Factura guardada exitosamente: ID={}, Cliente={}, Total USD={}",
                facturaGuardada.getId(), cliente.getNombre(), facturaGuardada.getTotalUsd());

        return facturaGuardada;
    }
}
