/* assets/js/pages/dashboard.js */

import {
    getDashboardFixed,
    updateGoal,
    getDashboardData,
    createMovement,
    updateMovement,
    deleteMovement
} from '../modules/api.js';

import {
    protectRoute,
    getAuthData,
    logout
} from '../modules/auth.js';

// ========================================
// CATEGORÍAS POR TIPO DE MOVIMIENTO
// ========================================
const CATEGORIAS = {
    income: [
        "Salario",
        "Trabajo extra",
        "Freelance",
        "Comisiones",
        "Propinas",
        "Ventas",
        "Negocio propio",
        "Ingresos online",
        "Publicidad",
        "Intereses",
        "Dividendos",
        "Inversiones",
        "Renta recibida",
        "Premios o sorteos",
        "Beca",
        "Apoyo familiar",
        "Reembolso",
        "Devoluciones",
        "Bonos",
        "Otros ingresos"
    ],
    expense: [
        "Renta / Hipoteca",
        "Electricidad",
        "Agua",
        "Gas",
        "Internet",
        "Mantenimiento del hogar",
        "Supermercado",
        "Restaurantes",
        "Comida rápida",
        "Delivery",
        "Café / Snacks",
        "Gasolina",
        "Transporte público",
        "Taxi / Uber",
        "Estacionamiento",
        "Peajes",
        "Mantenimiento del vehículo",
        "Ropa",
        "Calzado",
        "Tecnología",
        "Electrónica",
        "Accesorios",
        "Videojuegos",
        "Streaming",
        "Cine",
        "Eventos",
        "Hobbies",
        "Cursos",
        "Libros",
        "Material escolar",
        "Medicamentos",
        "Consultas médicas",
        "Seguro médico",
        "Gimnasio",
        "Pago de tarjeta",
        "Préstamos",
        "Comisiones bancarias",
        "Mascotas",
        "Regalos",
        "Donaciones",
        "Viajes",
        "Imprevistos",
        "Suscripciones",
        "Otros gastos"
    ]
};

// ========================================
// FUNCIÓN: Llenar un <select> con categorías
// ========================================
function llenarCategorias(selectEl, tipo, valorActual = '') {
    const lista = CATEGORIAS[tipo] || [];
    selectEl.innerHTML = '<option value="">-- Selecciona una categoría --</option>';
    lista.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        if (cat === valorActual) opt.selected = true;
        selectEl.appendChild(opt);
    });
}

document.addEventListener('DOMContentLoaded', async () => {

    if (!protectRoute()) return;

    const usuarioLogueado = getAuthData();
    const userId = usuarioLogueado.id;

    const fechaActual = new Date();
    let mesVisualizado = fechaActual.getMonth();
    let anioVisualizado = fechaActual.getFullYear();

    let datosFijos = {
        ingresoFijo: 0,
        egresoFijo: 0,
        metaNombre: '',
        metaCantidad: 0
    };

    let movimientosDB = new Map();
    let chartInstance = null;
    let diaSeleccionado = null;

    // ID del movimiento que se está editando actualmente
    let movimientoEnEdicion = null;

    // --- REFERENCIAS AL DOM ---
    const inpIngreso     = document.getElementById('fixed-income');
    const inpEgreso      = document.getElementById('fixed-expense');
    const inpMetaNombre  = document.getElementById('goal-name');
    const inpMetaMonto   = document.getElementById('goal-amount');

    const txtAhorro      = document.getElementById('calculated-savings');
    const txtRestante    = document.getElementById('calculated-remaining');
    const txtEstado      = document.getElementById('goal-status');

    const lblMesYear     = document.getElementById('current-month-year');
    const gridCalendario = document.getElementById('calendar-grid');
    const btnPrevMonth   = document.getElementById('prev-month');
    const btnNextMonth   = document.getElementById('next-month');

    const modal          = document.getElementById('day-modal');
    const btnCloseModal  = document.getElementById('close-modal');
    const formMovimiento = document.getElementById('transaction-form');

    const modalTitle     = document.getElementById('modal-date-title');
    const modalIncome    = document.getElementById('day-income');
    const modalExpense   = document.getElementById('day-expense');
    const modalTotal     = document.getElementById('day-total');
    const listMovimientos = document.getElementById('movements-list');

    // Selects de nuevo movimiento
    const selTipo        = document.getElementById('trans-type');
    const selCategoria   = document.getElementById('trans-category');

    // Sección de edición
    const editContainer  = document.getElementById('edit-movement-container');
    const selEditTipo    = document.getElementById('edit-trans-type');
    const selEditCat     = document.getElementById('edit-trans-category');
    const inpEditMonto   = document.getElementById('edit-trans-amount');
    const formEdicion    = document.getElementById('edit-transaction-form');
    const btnEditEliminar = document.getElementById('edit-btn-delete');

    const btnLogout = document.getElementById('logout-btn') || document.querySelector('.btn-logout');

    // --- CARGA INICIAL ---
    async function cargarDatosDelServidor() {
        try {
            const [fixedResponse, movementsResponse] = await Promise.all([
                getDashboardFixed(userId),
                getDashboardData(userId)
            ]);

            if (fixedResponse.success) {
                const data = fixedResponse.data;
                datosFijos = {
                    ingresoFijo:   parseFloat(data.ingreso_fijo)  || 0,
                    egresoFijo:    parseFloat(data.egreso_fijo)   || 0,
                    metaNombre:    data.meta_nombre               || '',
                    metaCantidad:  parseFloat(data.meta_cantidad) || 0
                };
                actualizarInputsFijos();
            }

            if (movementsResponse.success) {
                procesarMovimientosParaMap(movementsResponse.history);
            }

            actualizarDashboard();
            renderizarCalendario();

        } catch (error) {
            console.error('Error cargando dashboard:', error);
            alert('Error al cargar tus datos. Revisa tu conexión.');
        }
    }

    function actualizarInputsFijos() {
        inpIngreso.value     = datosFijos.ingresoFijo  || '';
        inpEgreso.value      = datosFijos.egresoFijo   || '';
        inpMetaNombre.value  = datosFijos.metaNombre   || '';
        inpMetaMonto.value   = datosFijos.metaCantidad || '';
    }

    // Guarda id, tipo y categoria para poder editar/eliminar
    function procesarMovimientosParaMap(listaMovimientos) {
        movimientosDB = new Map();

        listaMovimientos.forEach(mov => {
            const fechaKey = mov.fecha.split('T')[0];

            if (!movimientosDB.has(fechaKey)) {
                movimientosDB.set(fechaKey, { ingresos: [], egresos: [] });
            }

            const diaData = movimientosDB.get(fechaKey);
            const item = {
                id:        mov.id,
                categoria: mov.categoria,
                monto:     parseFloat(mov.monto),
                tipo:      mov.tipo
            };

            if (mov.tipo === 'income') {
                diaData.ingresos.push(item);
            } else {
                diaData.egresos.push(item);
            }
        });
    }

    // --- GUARDAR DATOS FIJOS ---
    async function guardarDatosFijos() {
        const payload = {
            ingreso_fijo:  parseFloat(inpIngreso.value)   || 0,
            egreso_fijo:   parseFloat(inpEgreso.value)    || 0,
            meta_nombre:   inpMetaNombre.value             || '',
            meta_cantidad: parseFloat(inpMetaMonto.value) || 0
        };

        datosFijos = {
            ingresoFijo:  payload.ingreso_fijo,
            egresoFijo:   payload.egreso_fijo,
            metaNombre:   payload.meta_nombre,
            metaCantidad: payload.meta_cantidad
        };
        actualizarDashboard();

        try {
            await updateGoal(userId, payload);
        } catch (error) {
            console.error('Error al guardar datos fijos:', error);
        }
    }

    // --- VALIDACIÓN DE INPUTS NUMÉRICOS ---
    function limitarNumero(input, maxEnteros, maxDecimales = 2) {
        input.addEventListener('input', () => {
            let valor = input.value;
            valor = valor.replace(/[^\d.]/g, '');

            const partes = valor.split('.');
            if (partes.length > 2) {
                valor = partes[0] + '.' + partes.slice(1).join('');
            }

            let [enteros, decimales] = valor.split('.');

            if (enteros === '' && valor.startsWith('.')) enteros = '0';
            if (enteros && enteros.length > maxEnteros) enteros = enteros.slice(0, maxEnteros);

            if (decimales !== undefined) {
                decimales = decimales.slice(0, maxDecimales);
                valor = `${enteros}.${decimales}`;
            } else {
                valor = enteros || '';
            }

            input.value = valor;
        });
    }

    // --- INIT ---
    async function init() {
        inicializarGrafica();
        await cargarDatosDelServidor();

        limitarNumero(inpIngreso, 8, 2);
        limitarNumero(inpEgreso, 8, 2);
        limitarNumero(inpMetaMonto, 9, 2);
        limitarNumero(document.getElementById('trans-amount'), 8, 2);
        limitarNumero(inpEditMonto, 8, 2);

        // Llenar categorías iniciales para el formulario de nuevo movimiento
        llenarCategorias(selCategoria, selTipo.value);

        // Actualizar categorías al cambiar el tipo (nuevo movimiento)
        selTipo.addEventListener('change', () => {
            llenarCategorias(selCategoria, selTipo.value);
        });

        // Actualizar categorías al cambiar el tipo (edición)
        selEditTipo.addEventListener('change', () => {
            llenarCategorias(selEditCat, selEditTipo.value);
        });

        [inpIngreso, inpEgreso, inpMetaMonto, inpMetaNombre].forEach(input => {
            input.addEventListener('change', guardarDatosFijos);
        });

        btnPrevMonth.addEventListener('click', () => cambiarMes(-1));
        btnNextMonth.addEventListener('click', () => cambiarMes(1));
        btnCloseModal.addEventListener('click', cerrarModal);
        window.addEventListener('click', e => { if (e.target === modal) cerrarModal(); });

        formMovimiento.addEventListener('submit', agregarMovimiento);

        // Formulario de edición
        formEdicion.addEventListener('submit', guardarEdicion);
        btnEditEliminar.addEventListener('click', eliminarDesdeEdicion);

        if (btnLogout) {
            btnLogout.addEventListener('click', e => { e.preventDefault(); logout(); });
        }
    }

    // --- CALENDARIO ---
    function cambiarMes(delta) {
        mesVisualizado += delta;
        if (mesVisualizado > 11) { mesVisualizado = 0; anioVisualizado++; }
        else if (mesVisualizado < 0) { mesVisualizado = 11; anioVisualizado--; }
        renderizarCalendario();
        actualizarDashboard();
    }

    function renderizarCalendario() {
        gridCalendario.innerHTML = '';
        const nombresMeses = [
            "Enero","Febrero","Marzo","Abril","Mayo","Junio",
            "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
        ];
        lblMesYear.textContent = `${nombresMeses[mesVisualizado]} ${anioVisualizado}`;

        const primerDiaMes = new Date(anioVisualizado, mesVisualizado, 1).getDay();
        const diasEnMes    = new Date(anioVisualizado, mesVisualizado + 1, 0).getDate();

        for (let i = 0; i < primerDiaMes; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('day-cell', 'day-empty');
            gridCalendario.appendChild(emptyCell);
        }

        for (let dia = 1; dia <= diasEnMes; dia++) {
            const celda    = document.createElement('div');
            const fechaKey = `${anioVisualizado}-${String(mesVisualizado + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const datosDia = obtenerDatosDia(fechaKey);

            celda.classList.add('day-cell');
            if (datosDia.colorDia !== 'sin color') celda.classList.add(`day-${datosDia.colorDia}`);

            celda.innerHTML = `
                <span class="day-number">${dia}</span>
                ${datosDia.balance !== 0 ? `<span class="day-balance-preview">$${datosDia.balance.toFixed(2)}</span>` : ''}
            `;

            celda.addEventListener('click', () => abrirModal(fechaKey, dia));
            gridCalendario.appendChild(celda);
        }
    }

    function obtenerDatosDia(fecha) {
        const data = movimientosDB.get(fecha) || { ingresos: [], egresos: [] };
        const totalIngresos = data.ingresos.reduce((acc, val) => acc + val.monto, 0);
        const totalEgresos  = data.egresos.reduce((acc, val) => acc + val.monto, 0);
        const balance = totalIngresos - totalEgresos;

        let colorDia = 'sin color';
        if (balance > 0) colorDia = 'green';
        else if (balance < 0) colorDia = 'red';
        else if ((data.ingresos.length > 0 || data.egresos.length > 0) && balance === 0) colorDia = 'gray';

        return { totalIngresos, totalEgresos, balance, colorDia, movimientos: data };
    }

    function actualizarDashboard() {
        let totalIngresosVariables = 0;
        let totalEgresosVariables  = 0;

        movimientosDB.forEach((data, fecha) => {
            const [y, m] = fecha.split('-');
            if (parseInt(y) === anioVisualizado && parseInt(m) === (mesVisualizado + 1)) {
                totalIngresosVariables += data.ingresos.reduce((s, i) => s + i.monto, 0);
                totalEgresosVariables  += data.egresos.reduce((s, e) => s + e.monto, 0);
            }
        });

        const ingresoTotal  = datosFijos.ingresoFijo + totalIngresosVariables;
        const egresoTotal   = datosFijos.egresoFijo  + totalEgresosVariables;
        const ahorroMensual = ingresoTotal - egresoTotal;
        const faltaParaMeta = Math.max(0, datosFijos.metaCantidad - ahorroMensual);

        txtAhorro.textContent   = `$${ahorroMensual.toFixed(2)}`;
        txtRestante.textContent = `$${faltaParaMeta.toFixed(2)}`;

        if (ahorroMensual < 0) {
            txtAhorro.style.color = '#E57373';
            txtEstado.textContent = 'Déficit';
        } else {
            txtAhorro.style.color = '#81C784';
            txtEstado.textContent = (faltaParaMeta === 0 && datosFijos.metaCantidad > 0)
                ? '¡Meta Alcanzada!'
                : 'En progreso';
        }

        actualizarGrafica(ingresoTotal, egresoTotal, ahorroMensual);
    }

    function inicializarGrafica() {
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Ingresos Totales', 'Egresos Totales', 'Balance Neto'],
                datasets: [{
                    label: 'Finanzas ($)',
                    data: [0, 0, 0],
                    backgroundColor: ['#A5D6A7', '#EF9A9A', '#B6C4DA'],
                    borderColor: ['#1B5E20', '#B71C1C', '#2C405B'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    function actualizarGrafica(ing, egr, bal) {
        if (chartInstance) {
            chartInstance.data.datasets[0].data = [ing, egr, bal];
            chartInstance.update();
        }
    }

    // --- MODAL ---
    function abrirModal(fecha, diaNumero) {
        diaSeleccionado = fecha;
        modal.classList.remove('hidden');
        modalTitle.textContent = `Detalle del ${diaNumero}/${mesVisualizado + 1}/${anioVisualizado}`;
        ocultarFormEdicion();
        actualizarContenidoModal();
    }

    function cerrarModal() {
        modal.classList.add('hidden');
        diaSeleccionado = null;
        ocultarFormEdicion();
    }

    // ========================================
    // RENDERIZAR LISTA DE MOVIMIENTOS (con lápiz de edición)
    // ========================================
    function actualizarContenidoModal() {
        const datos = obtenerDatosDia(diaSeleccionado);

        modalIncome.textContent  = `+$${datos.totalIngresos.toFixed(2)}`;
        modalExpense.textContent = `-$${datos.totalEgresos.toFixed(2)}`;
        modalTotal.textContent   = `$${datos.balance.toFixed(2)}`;
        modalTotal.className     = datos.balance > 0 ? 'text-green' : (datos.balance < 0 ? 'text-red' : '');

        listMovimientos.innerHTML = '';

        const todosMovs = [
            ...datos.movimientos.ingresos.map(m => ({ ...m, tipo: 'income' })),
            ...datos.movimientos.egresos.map(m => ({ ...m, tipo: 'expense' }))
        ];

        if (todosMovs.length === 0) {
            listMovimientos.innerHTML = '<li><em style="color:#999">Sin movimientos.</em></li>';
        } else {
            todosMovs.forEach(m => {
                const li = document.createElement('li');
                li.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #eee;';
                li.innerHTML = `
                    <span style="flex:1; font-size:0.9rem; color:#555;">${m.categoria}</span>
                    <span class="${m.tipo === 'income' ? 'text-green' : 'text-red'}" style="font-weight:bold; margin-right:10px;">
                        ${m.tipo === 'income' ? '+' : '-'}$${m.monto.toFixed(2)}
                    </span>
                    <button
                        class="btn-edit-mov"
                        data-id="${m.id}"
                        title="Editar movimiento"
                        style="
                            background: none;
                            border: 1px solid #6585AA;
                            border-radius: 6px;
                            color: #6585AA;
                            cursor: pointer;
                            padding: 4px 8px;
                            font-size: 0.85rem;
                            transition: background 0.2s;
                        "
                    >✏️</button>
                `;

                // Click en lápiz → mostrar formulario de edición
                li.querySelector('.btn-edit-mov').addEventListener('click', () => {
                    mostrarFormEdicion(m);
                });

                listMovimientos.appendChild(li);
            });
        }
    }

    // ========================================
    // FORMULARIO DE EDICIÓN
    // ========================================
    function mostrarFormEdicion(movimiento) {
        movimientoEnEdicion = movimiento;

        // Rellenar tipo
        selEditTipo.value = movimiento.tipo;

        // Rellenar categorías según tipo y preseleccionar la actual
        llenarCategorias(selEditCat, movimiento.tipo, movimiento.categoria);

        // Rellenar monto
        inpEditMonto.value = movimiento.monto;

        // Mostrar sección de edición
        editContainer.style.display = 'block';
        editContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function ocultarFormEdicion() {
        editContainer.style.display = 'none';
        movimientoEnEdicion = null;
        if (formEdicion) formEdicion.reset();
    }

    // Guardar cambios del movimiento editado
    async function guardarEdicion(e) {
        e.preventDefault();
        if (!movimientoEnEdicion) return;

        const tipo       = selEditTipo.value;
        const categoria  = selEditCat.value;
        const montoRaw   = inpEditMonto.value;

        if (!categoria) {
            alert('Selecciona una categoría.');
            return;
        }

        const montoRegex = /^\d{1,8}(\.\d{1,2})?$/;
        if (!montoRegex.test(montoRaw)) {
            alert('Monto inválido. Máximo 8 dígitos y 2 decimales.');
            return;
        }

        const monto = parseFloat(montoRaw);
        if (monto <= 0) {
            alert('El monto debe ser mayor a 0.');
            return;
        }

        try {
            const result = await updateMovement(movimientoEnEdicion.id, { tipo, categoria, monto });

            if (result.success) {
                ocultarFormEdicion();
                await cargarDatosDelServidor();
                // Reabrir el modal en el mismo día
                if (diaSeleccionado) actualizarContenidoModal();
            } else {
                alert(result.message || 'Error al actualizar el movimiento.');
            }
        } catch (error) {
            console.error('Error guardando edición:', error);
            alert('Error de conexión al guardar los cambios.');
        }
    }

    // Eliminar desde el formulario de edición
    async function eliminarDesdeEdicion() {
        if (!movimientoEnEdicion) return;

        if (!confirm('¿Eliminar este movimiento? Esta acción no se puede deshacer.')) return;

        try {
            const result = await deleteMovement(movimientoEnEdicion.id, userId);

            if (result.success) {
                ocultarFormEdicion();
                await cargarDatosDelServidor();
                if (diaSeleccionado) actualizarContenidoModal();
            } else {
                alert(result.message || 'Error al eliminar el movimiento.');
            }
        } catch (error) {
            console.error('Error eliminando movimiento:', error);
            alert('Error de conexión al eliminar el movimiento.');
        }
    }

    // --- AGREGAR NUEVO MOVIMIENTO ---
    async function agregarMovimiento(e) {
        e.preventDefault();

        const tipo      = document.getElementById('trans-type').value;
        const categoria = document.getElementById('trans-category').value;
        const montoRaw  = document.getElementById('trans-amount').value;

        const montoRegex = /^\d{1,8}(\.\d{1,2})?$/;

        if (!categoria) {
            alert('Selecciona una categoría.');
            return;
        }

        if (!montoRegex.test(montoRaw)) {
            alert('Monto inválido. Máx 8 dígitos y 2 decimales.');
            return;
        }

        const monto = parseFloat(montoRaw);
        if (monto <= 0) {
            alert('El monto debe ser mayor a 0.');
            return;
        }

        const movementData = {
            user_id:     userId,
            fecha:       diaSeleccionado,
            tipo,
            categoria,
            monto,
            descripcion: 'Movimiento desde Dashboard'
        };

        try {
            await createMovement(movementData);
            document.getElementById('trans-amount').value = '';
            await cargarDatosDelServidor();
            actualizarContenidoModal();
        } catch (error) {
            console.error('Error al crear movimiento:', error);
            alert('No se pudo guardar el movimiento.');
        }
    }

    init();
});