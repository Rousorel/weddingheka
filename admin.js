import {
    obtenerInvitados,
    obtenerEstadisticas,
    agregarInvitado,
    actualizarInvitado,
    eliminarInvitado,
    buscarInvitados,
    obtenerTendenciaConfirmaciones,
    signIn,
    signOutAuth,
    onAuthStateChangedListener
} from './admin-firebase.js';
import { adminEmail } from './firebase-config.js';

// Variables globales
let modal;

// Inicialización de la página
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar modales (sin cargar datos todavía)
    const modalElement = document.getElementById('modalInvitado');
    modal = new bootstrap.Modal(modalElement);

    // Login modal
    const loginModalEl = document.getElementById('loginModal');
    const loginModal = new bootstrap.Modal(loginModalEl, { backdrop: 'static', keyboard: false });

    const formLogin = document.getElementById('formLogin');
    const loginError = document.getElementById('loginError');
    const btnLogout = document.getElementById('btnLogout');

    // Manejar envío del formulario de login
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.style.display = 'none';
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        try {
            await signIn(email, password);
            // onAuthStateChangedListener se encargará de continuar
        } catch (err) {
            console.error('Error login:', err);
            loginError.textContent = err.message || 'Error al iniciar sesión';
            loginError.style.display = 'block';
        }
    });

    // Logout
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await signOutAuth();
        });
    }

    // Listener de estado de autenticación
    onAuthStateChangedListener(async (user) => {
        if (user && user.email && user.email.toLowerCase() === (adminEmail || '').toLowerCase()) {
            // Usuario admin válido
            console.log('Admin autenticado:', user.email);
            // Ocultar modal de login si está abierto
            try { loginModal.hide(); } catch (e) {}

            // Mostrar boton logout
            if (btnLogout) btnLogout.classList.remove('d-none');

            // Inicializar UI y cargar datos ahora que estamos autenticados
            try {
                configurarEventosFormulario();
                configurarEventosBotones();
                await cargarDatos();
                await inicializarGraficos();
            } catch (err) {
                console.error('Error al inicializar UI tras auth:', err);
            }
        } else {
            // No autenticado o no admin -> mostrar login y ocultar datos sensibles
            console.log('No autenticado o no admin, mostrando login');
            if (btnLogout) btnLogout.classList.add('d-none');
            try { loginModal.show(); } catch (e) {}
        }
    });
});

// Configurar eventos del formulario
function configurarEventosFormulario() {
    const form = document.getElementById('formInvitado');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Formulario enviado');
        
        const formData = {
            nombre: document.getElementById('nombre').value.trim(),
            codigo: document.getElementById('codigo').value.trim(),
            estado: document.getElementById('estado').value,
            acompanantes: parseInt(document.getElementById('acompanantes').value) || 0,
            fechaCreacion: new Date()
        };
        
        console.log('Datos del formulario:', formData);
        const id = document.getElementById('invitadoId').value;

        try {
            if (id) {
                console.log('Actualizando invitado:', id);
                await actualizarInvitado(id, formData);
                mostrarMensaje('Invitado actualizado correctamente');
            } else {
                console.log('Agregando nuevo invitado');
                const nuevoId = await agregarInvitado(formData);
                console.log('Invitado agregado con ID:', nuevoId);
                mostrarMensaje('Invitado agregado correctamente');
            }
            
            modal.hide();
            await cargarDatos();
        } catch (error) {
            console.error('Error al guardar:', error);
            mostrarError('Error al guardar los datos: ' + error.message);
        }
    });
}

// Configurar eventos de botones
function configurarEventosBotones() {
    // Botón agregar
    const btnAgregar = document.querySelector('.btn-agregar');
    if (btnAgregar) {
        btnAgregar.addEventListener('click', () => {
            document.getElementById('formInvitado').reset();
            document.getElementById('invitadoId').value = '';
            document.getElementById('modalTitle').textContent = 'Agregar Invitado';
            modal.show();
        });
    }

    // Búsqueda de invitados
    const inputBusqueda = document.querySelector('input[placeholder="Buscar invitado..."]');
    if (inputBusqueda) {
        let timeoutId;
        inputBusqueda.addEventListener('input', (e) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => buscarInvitados(e.target.value), 300);
        });
    }
}

// Cargar todos los datos
async function cargarDatos() {
    try {
        console.log('Iniciando carga de datos...');
        
        // Cargar invitados primero
        const invitados = await obtenerInvitados();
        console.log('Invitados cargados:', invitados);

        // Cargar estadísticas
        const stats = await obtenerEstadisticas();
        console.log('Estadísticas cargadas:', stats);
        
        // Actualizar la interfaz
        actualizarEstadisticas(stats);
        actualizarTablaInvitados(invitados);
        
        return { invitados, stats };
    } catch (error) {
        console.error('Error al cargar datos:', error);
        mostrarError('Error al cargar los datos: ' + error.message);
        throw error;
    }
}

// Función separada para actualizar la tabla
function actualizarTablaInvitados(invitados) {
    const tbody = document.getElementById('listaInvitados');
    if (!tbody) {
        console.error('No se encontró el elemento listaInvitados');
        return;
    }
    
    tbody.innerHTML = '';
    console.log('Actualizando tabla con invitados:', invitados);

    if (invitados && invitados.length > 0) {
        invitados.forEach(invitado => {
            const tr = crearFilaInvitado(invitado);
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay invitados registrados</td></tr>';
    }
}

// Actualizar estadísticas
function actualizarEstadisticas(stats) {
    document.getElementById('totalInvitados').textContent = stats.totalInvitados;
    document.getElementById('totalConfirmados').textContent = stats.totalConfirmados;
    document.getElementById('totalPendientes').textContent = stats.pendientes;
    document.getElementById('totalRechazados').textContent = stats.rechazados;
    
    // Actualizar los textos descriptivos
    document.querySelector('#totalConfirmados + p small').textContent = 
        `${stats.confirmados} invitados + ${stats.totalAcompanantes} acompañantes`;
}

// Cargar tabla de invitados
async function cargarTablaInvitados() {
    const tbody = document.getElementById('listaInvitados');
    tbody.innerHTML = '';

    try {
        const invitados = await obtenerInvitados();
        invitados.forEach(invitado => {
            const tr = crearFilaInvitado(invitado);
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error al cargar invitados:', error);
        mostrarError('Error al cargar la lista de invitados');
    }
}

// Crear fila de invitado
function crearFilaInvitado(invitado) {
    const tr = document.createElement('tr');
    
    const fechaStr = invitado.fechaConfirmacion ? 
        new Date(invitado.fechaConfirmacion.toDate()).toLocaleDateString() : 
        '-';

    tr.innerHTML = `
        <td>${invitado.nombre}</td>
        <td>${invitado.codigo}</td>
        <td><span class="badge ${getBadgeClass(invitado.estado)}">${invitado.estado || 'pendiente'}</span></td>
        <td>${invitado.acompanantes || 0}</td>
        <td>${fechaStr}</td>
        <td>
            <button class="btn btn-sm btn-outline-primary me-1 btn-editar">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger btn-eliminar">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;

    // Agregar event listeners
    tr.querySelector('.btn-editar').addEventListener('click', () => editarInvitado(invitado));
    tr.querySelector('.btn-eliminar').addEventListener('click', () => eliminarInvitadoHandler(invitado.id));

    return tr;
}

// Editar invitado
function editarInvitado(invitado) {
    document.getElementById('invitadoId').value = invitado.id;
    document.getElementById('nombre').value = invitado.nombre;
    document.getElementById('codigo').value = invitado.codigo;
    document.getElementById('estado').value = invitado.estado || 'pendiente';
    document.getElementById('acompanantes').value = invitado.acompanantes || 0;
    document.getElementById('modalTitle').textContent = 'Editar Invitado';
    modal.show();
}

// Eliminar invitado
async function eliminarInvitadoHandler(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este invitado?')) {
        try {
            await eliminarInvitado(id);
            mostrarMensaje('Invitado eliminado correctamente');
            await cargarDatos();
        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error al eliminar el invitado');
        }
    }
}

// Funciones auxiliares
function getBadgeClass(estado) {
    switch (estado?.toLowerCase()) {
        case 'confirmado':
            return 'badge-confirmado';
        case 'pendiente':
            return 'badge-pendiente';
        case 'rechazado':
            return 'badge-rechazado';
        default:
            return 'badge-secondary';
    }
}

function mostrarMensaje(mensaje) {
    alert(mensaje); // En el futuro, podrías usar una librería de notificaciones más elegante
}

function mostrarError(mensaje) {
    alert('Error: ' + mensaje);
}

// Inicializar gráficos
async function inicializarGraficos() {
    try {
        const stats = await obtenerEstadisticas();
        const tendencia = await obtenerTendenciaConfirmaciones();

        // Datos para el gráfico de estado de confirmaciones
        const estadoConfirmaciones = {
            labels: ['Confirmados', 'Pendientes', 'Rechazados'],
            datasets: [{
                data: [stats.confirmados, stats.pendientes, stats.rechazados],
                backgroundColor: [
                    'rgba(115, 158, 130, 0.8)',
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(220, 53, 69, 0.8)'
                ],
                borderColor: [
                    'rgba(115, 158, 130, 1)',
                    'rgba(255, 193, 7, 1)',
                    'rgba(220, 53, 69, 1)'
                ],
                borderWidth: 1
            }]
        };

        // Datos para el gráfico de tendencia
        const tendenciaConfirmaciones = {
            labels: tendencia.map(t => t.semana),
            datasets: [{
                label: 'Confirmaciones por semana',
                data: tendencia.map(t => t.cantidad),
                fill: false,
                borderColor: 'rgba(115, 158, 130, 1)',
                tension: 0.4
            }]
        };

        // Gráfico de estado de confirmaciones
        const ctxPie = document.getElementById('confirmacionesChart').getContext('2d');
        new Chart(ctxPie, {
            type: 'doughnut',
            data: estadoConfirmaciones,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // Gráfico de tendencia de confirmaciones
        const ctxLine = document.getElementById('tendenciaChart').getContext('2d');
        new Chart(ctxLine, {
            type: 'line',
            data: tendenciaConfirmaciones,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error al inicializar gráficos:', error);
        mostrarError('Error al cargar los gráficos');
    }
}