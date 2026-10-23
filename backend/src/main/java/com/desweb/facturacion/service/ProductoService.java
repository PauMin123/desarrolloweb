package com.desweb.facturacion.service;

import com.desweb.facturacion.dto.ProductoDto;
import com.desweb.facturacion.dto.S3UploadResponse;
import com.desweb.facturacion.model.Producto;
import com.desweb.facturacion.repository.ProductoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@Service
public class ProductoService {

    private static final Logger log = LoggerFactory.getLogger(ProductoService.class);

    private final ProductoRepository productoRepository;
    private final S3Service s3Service;

    public ProductoService(ProductoRepository productoRepository, S3Service s3Service) {
        this.productoRepository = productoRepository;
        this.s3Service = s3Service;
    }

    @Transactional(readOnly = true)
    public List<Producto> getAllProductos() {
        return productoRepository.findAllByOrderByNombreAsc();
    }

    @Transactional(readOnly = true)
    public Optional<Producto> getProductoById(Long id) {
        return productoRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Producto> getProductoByCodigo(String codigo) {
        return productoRepository.findByCodigo(codigo);
    }

    @Transactional(readOnly = true)
    public List<Producto> searchProductos(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllProductos();
        }
        return productoRepository.findByCodigoContainingIgnoreCaseOrNombreContainingIgnoreCase(query.trim(), query.trim());
    }

    @Transactional
    public Producto createProducto(ProductoDto dto, MultipartFile imagen) {
        if (productoRepository.existsByCodigo(dto.getCodigo().trim())) {
            throw new IllegalArgumentException("Ya existe un producto con el código '" + dto.getCodigo() + "'");
        }

        Producto producto = new Producto();
        producto.setCodigo(dto.getCodigo().trim());
        producto.setNombre(dto.getNombre().trim());
        producto.setDescripcion(dto.getDescripcion() != null ? dto.getDescripcion().trim() : "");
        producto.setPrecioUnitario(dto.getPrecioUnitario());
        producto.setStock(dto.getStock() != null ? dto.getStock() : 0);

        // Subir imagen a AWS S3 si se proporciona archivo
        if (imagen != null && !imagen.isEmpty()) {
            S3UploadResponse uploadResponse = s3Service.uploadImage(imagen);
            producto.setImagenUrl(uploadResponse.getUrl());
            producto.setS3Key(uploadResponse.getKey());
        } else if (dto.getImagenUrl() != null && !dto.getImagenUrl().isBlank()) {
            producto.setImagenUrl(dto.getImagenUrl().trim());
        }

        Producto guardado = productoRepository.save(producto);
        log.info("Producto registrado exitosamente: id={}, codigo={}, s3_url={}", 
                guardado.getId(), guardado.getCodigo(), guardado.getImagenUrl());
        return guardado;
    }

    @Transactional
    public Producto updateProducto(Long id, ProductoDto dto, MultipartFile nuevaImagen) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + id));

        // Si cambió el código, verificar que no esté duplicado
        if (!producto.getCodigo().equalsIgnoreCase(dto.getCodigo().trim()) &&
                productoRepository.existsByCodigo(dto.getCodigo().trim())) {
            throw new IllegalArgumentException("Ya existe un producto con el código '" + dto.getCodigo() + "'");
        }

        producto.setCodigo(dto.getCodigo().trim());
        producto.setNombre(dto.getNombre().trim());
        producto.setDescripcion(dto.getDescripcion() != null ? dto.getDescripcion().trim() : "");
        producto.setPrecioUnitario(dto.getPrecioUnitario());
        producto.setStock(dto.getStock() != null ? dto.getStock() : producto.getStock());

        // Si se envía una nueva imagen, subir a S3 y reemplazar
        if (nuevaImagen != null && !nuevaImagen.isEmpty()) {
            // Eliminar imagen anterior de S3 si tenía clave
            if (producto.getS3Key() != null) {
                s3Service.deleteImage(producto.getS3Key());
            }

            S3UploadResponse uploadResponse = s3Service.uploadImage(nuevaImagen);
            producto.setImagenUrl(uploadResponse.getUrl());
            producto.setS3Key(uploadResponse.getKey());
        }

        return productoRepository.save(producto);
    }

    @Transactional
    public void deleteProducto(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + id));

        if (producto.getS3Key() != null) {
            s3Service.deleteImage(producto.getS3Key());
        }

        productoRepository.delete(producto);
    }
}
