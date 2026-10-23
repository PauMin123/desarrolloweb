document.addEventListener('DOMContentLoaded', () => {

    // Set current date
    const dateOpts = { day: '2-digit', month: '2-digit', year: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('es-GT', dateOpts);

    let exchangeRate = 7.80; // Valor por defecto para el tipo de cambio
    let currentClientId = null;
    let cart = [];

    // Elements
    const nitInput = document.getElementById('client-nit');
    const nameInput = document.getElementById('client-name');
    const cityInput = document.getElementById('client-city');
    const methodInput = document.getElementById('payment-method');

    const searchInput = document.getElementById('product-search');
    const searchResults = document.getElementById('product-results');

    const tbody = document.getElementById('invoice-tbody');

    // Obtener tipo de cambio desde Banguat WS
    fetch('banguat_ws.php')
        .then(res => res.json())
        .then(data => {
            if (data.success && data.venta) {
                exchangeRate = parseFloat(data.venta);
                document.getElementById('ws-rate').textContent = exchangeRate.toFixed(2);
                document.getElementById('ws-date').textContent = "Fecha WS: " + data.fecha;
            } else {
                // Fallback
                exchangeRate = parseFloat(data.fallback_rate || 7.80);
                document.getElementById('ws-rate').textContent = exchangeRate.toFixed(2) + " (Fallback)";
            }
            updateTotals();
        })
        .catch(err => {
            console.error('Error fetching exchange rate:', err);
            document.getElementById('ws-rate').textContent = exchangeRate.toFixed(2) + " (Error)";
            updateTotals();
        });

    // Buscar cliente por NIT
    document.getElementById('btn-search-client').addEventListener('click', () => {
        const nit = nitInput.value.trim();
        if (!nit) return Swal.fire({ title: 'Atención', text: 'Ingrese un NIT', icon: 'warning' });

        fetch(`api.php?action=get_client&nit=${nit}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    currentClientId = data.data.id;
                    nameInput.value = data.data.nombre;
                    cityInput.value = data.data.ciudad;
                    methodInput.value = data.data.metodo_pago_preferido;
                } else {
                    Swal.fire({ title: 'Oops...', text: data.message, icon: 'error' });
                    currentClientId = null;
                    nameInput.value = "";
                    cityInput.value = "";
                }
            });
    });

    // Registrar cliente
    document.getElementById('btn-new-client').addEventListener('click', () => {
        Swal.fire({
            title: 'Nuevo Cliente',
            html:
                '<input id="swal-nit" class="swal2-input" placeholder="NIT">' +
                '<input id="swal-nombre" class="swal2-input" placeholder="Nombre completo">' +
                '<input id="swal-ciudad" class="swal2-input" placeholder="Ciudad (Opcional)">',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Guardar Cliente',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const nit = document.getElementById('swal-nit').value.trim();
                const nombre = document.getElementById('swal-nombre').value.trim();
                const ciudad = document.getElementById('swal-ciudad').value.trim();

                if (!nit || !nombre) {
                    Swal.showValidationMessage('El NIT y el Nombre son obligatorios');
                    return false;
                }
                return { nit, nombre, ciudad };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                fetch('api.php?action=create_client', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(result.value)
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            Swal.fire('¡Cliente Creado!', 'El cliente ha sido registrado exitosamente.', 'success');

                            // Llenar el formulario automáticamente
                            currentClientId = data.data.id;
                            nitInput.value = data.data.nit;
                            nameInput.value = data.data.nombre;
                            cityInput.value = data.data.ciudad;
                            methodInput.value = data.data.metodo_pago_preferido;
                        } else {
                            Swal.fire('Error', data.message, 'error');
                        }
                    });
            }
        });
    });


    // Busqueda de productos    
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.trim();
        clearTimeout(searchTimeout);
        if (term.length < 2) {
            searchResults.style.display = 'none';
            return;
        }

        searchTimeout = setTimeout(() => {
            fetch(`api.php?action=search_products&q=${encodeURIComponent(term)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.data.length > 0) {
                        searchResults.innerHTML = '';
                        data.data.forEach(p => {
                            const div = document.createElement('div');
                            div.className = 'search-item';
                            div.textContent = `${p.codigo} - ${p.descripcion} ($${p.precio_unitario})`;
                            div.onclick = () => {
                                searchInput.value = '';
                                searchResults.style.display = 'none';
                                addProductToCart(p);
                            };
                            searchResults.appendChild(div);
                        });
                        searchResults.style.display = 'block';
                    } else {
                        searchResults.style.display = 'none';
                    }
                });
        }, 300);
    });

    // Ocultar resultados de busqueda al hacer clic fuera de ellos
    document.addEventListener('click', (e) => {
        if (e.target !== searchInput && e.target !== searchResults) {
            searchResults.style.display = 'none';
        }
    });

    // Agregar producto al carrito
    document.getElementById('btn-add-product').addEventListener('click', () => {
        const term = searchInput.value.trim();
        if (!term) return;

        fetch(`api.php?action=search_products&q=${encodeURIComponent(term)}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data.length > 0) {
                    // Agregar el primer producto encontrado
                    addProductToCart(data.data[0]);
                    searchInput.value = '';
                    searchResults.style.display = 'none';
                } else {
                    Swal.fire({ title: 'No encontrado', text: 'Producto no encontrado', icon: 'info' });
                }
            });
    });
    // Agregar producto al carrito
    function addProductToCart(product) {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            existing.cantidad += 1;
            existing.subtotal = existing.cantidad * existing.precio_unitario;
        } else {
            cart.push({
                id: product.id,
                codigo: product.codigo,
                descripcion: product.descripcion,
                precio_unitario: parseFloat(product.precio_unitario),
                cantidad: 1,
                subtotal: parseFloat(product.precio_unitario)
            });
        }
        renderCart();
    }

    function removeProduct(index) {
        cart.splice(index, 1);
        renderCart();
    }

    // Se adjunta a window para que funcione el onclick en el HTML
    window.removeProduct = removeProduct;
    window.updateQty = function (index, qty) {
        qty = parseInt(qty);
        if (qty > 0) {
            cart[index].cantidad = qty;
            cart[index].subtotal = qty * cart[index].precio_unitario;
            renderCart();
        }
    };
    // Renderizar carrito
    function renderCart() {
        tbody.innerHTML = '';
        cart.forEach((item, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.codigo}</td>
                <td>${item.descripcion}</td>
                <td><input type="number" min="1" value="${item.cantidad}" onchange="updateQty(${idx}, this.value)" style="width:60px;"></td>
                <td>$ ${item.precio_unitario.toFixed(2)}</td>
                <td>$ ${item.subtotal.toFixed(2)}</td>
                <td><button class="btn-danger" onclick="removeProduct(${idx})">X</button></td>
            `;
            tbody.appendChild(tr);
        });
        updateTotals();
    }
    // Actualizar totales
    let currentTotals = {};

    function updateTotals() {
        const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
        const iva = subtotal * 0.12;
        const totalUsd = subtotal + iva;
        const totalGtq = totalUsd * exchangeRate;

        document.getElementById('summary-subtotal').textContent = subtotal.toFixed(2);
        document.getElementById('summary-iva').textContent = iva.toFixed(2);
        document.getElementById('summary-total-usd').textContent = totalUsd.toFixed(2);
        document.getElementById('summary-total-gtq').textContent = totalGtq.toFixed(2);

        currentTotals = {
            subtotal_usd: subtotal,
            iva_usd: iva,
            total_usd: totalUsd,
            total_gtq: totalGtq,
            tipo_cambio: exchangeRate
        };
    }

    // Guardar factura
    document.getElementById('btn-save-invoice').addEventListener('click', () => {
        if (!currentClientId) {
            Swal.fire({ title: 'Atención', text: 'Por favor, busque un cliente primero.', icon: 'warning' });
            return;
        }
        if (cart.length === 0) {
            Swal.fire({ title: 'Atención', text: 'Agregue al menos un producto a la factura.', icon: 'warning' });
            return;
        }

        const payload = {
            cliente_id: currentClientId,
            metodo_pago: methodInput.value,
            productos: cart,
            totales: currentTotals
        };

        fetch('api.php?action=save_invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({ title: '¡Éxito!', text: `Factura guardada exitosamente (ID: ${data.factura_id})`, icon: 'success' });
                    // Clear cart
                    cart = [];
                    renderCart();
                } else {
                    Swal.fire({ title: 'Error', text: data.message, icon: 'error' });
                }
            });
    });

    // Inicia el programa buscando el cliente predeterminado
    document.getElementById('btn-search-client').click();
});
