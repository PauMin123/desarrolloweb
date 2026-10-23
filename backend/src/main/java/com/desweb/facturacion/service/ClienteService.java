package com.desweb.facturacion.service;

import com.desweb.facturacion.dto.ClienteDto;
import com.desweb.facturacion.model.Cliente;
import com.desweb.facturacion.repository.ClienteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    @Transactional(readOnly = true)
    public List<Cliente> getAllClientes() {
        return clienteRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Cliente> getClienteById(Long id) {
        return clienteRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Cliente> getClienteByNit(String nit) {
        if (nit == null || nit.trim().isEmpty()) {
            return Optional.empty();
        }
        return clienteRepository.findByNit(nit.trim());
    }

    @Transactional
    public Cliente createCliente(ClienteDto dto) {
        if (clienteRepository.existsByNit(dto.getNit().trim())) {
            throw new IllegalArgumentException("El NIT '" + dto.getNit() + "' ya está registrado en el sistema.");
        }

        Cliente cliente = new Cliente();
        cliente.setNit(dto.getNit().trim());
        cliente.setNombre(dto.getNombre().trim());
        cliente.setCiudad(dto.getCiudad() != null ? dto.getCiudad().trim() : "");
        cliente.setMetodoPagoPreferido(dto.getMetodoPagoPreferido() != null && !dto.getMetodoPagoPreferido().isBlank() 
                ? dto.getMetodoPagoPreferido() 
                : "Efectivo");

        return clienteRepository.save(cliente);
    }
}
