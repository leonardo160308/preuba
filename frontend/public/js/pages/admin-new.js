// frontend/public/js/pages/admin-new.js
import { protectRoute, getAuthData, logout, isAdmin } from '../modules/auth.js';
import { alertaExito, alertaError, alertaAdvertencia, alertaConfirmacion } from '../modules/alerts.js';

const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
    
    // ========================================
    // 1. SEGURIDAD Y AUTH
    // ========================================
    if (!protectRoute()) return;
    
    if (!isAdmin()) {
        alertaError('Acceso denegado. Solo administradores.', {
            duration: 3000,
            onClose: () => { window.location.href = '/dashboard.html'; }
        });
        return;
    }
    
    const sessionUser = getAuthData();
    const userId = sessionUser.id;

    // Variables globales para almacenar datos
    let categories = [];
    let levels = [];
    let flashcards = [];
    let questions = [];

    // ========================================
    // 2. NAVEGACIÓN (TABS)
    // ========================================
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            // Quitar active de todos
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Activar el seleccionado
            btn.classList.add('active');
            document.getElementById(`tab-${tab}`).classList.add('active');
        });
    });

    document.getElementById('logout-btn-admin')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const confirmar = await alertaConfirmacion('¿Cerrar sesión?', 'Salir');
        if (confirmar) logout();
    });
// Dentro del DOMContentLoaded en admin-new.js...

// 1. ABRIR MODAL FLASHCARD
document.getElementById('btn-new-flashcard').addEventListener('click', () => {
    document.getElementById('form-flashcard').reset();
    document.getElementById('flashcard-id').value = '';
    document.getElementById('modal-flashcard-title').textContent = 'Nueva Flashcard';
    document.getElementById('modal-flashcard').classList.add('active');
});

// 2. GUARDAR FLASHCARD
document.getElementById('form-flashcard').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // CAPTURAR EL ID DEL NIVEL (Esto es lo que te fallaba)
    const levelId = document.getElementById('flashcard-level').value;
    const pregunta = document.getElementById('flashcard-pregunta').value.trim();
    const respuesta = document.getElementById('flashcard-respuesta').value.trim();

    if (!levelId || !pregunta || !respuesta) {
        return alertaAdvertencia('Por favor, completa todos los campos y selecciona un nivel');
    }

    try {
        const res = await fetch(`${API_URL}/admin/flashcards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, levelId, pregunta, respuesta })
        });
        
        const data = await res.json();
        if (data.success) {
            alertaExito('Flashcard creada');
            document.getElementById('modal-flashcard').classList.remove('active');
            // Aquí puedes llamar a una función para refrescar la lista si la tienes
        } else {
            alertaError(data.message);
        }
    } catch (error) {
        alertaError('Error al conectar con el servidor');
    }
});
    // ========================================
    // 3. CARGAR DATOS (Categorías y Niveles)
    // ========================================
    async function loadData() {
        try {
            // Hacemos fetch de categorías y niveles en paralelo
            const [resCat, resLevels] = await Promise.all([
                fetch(`${API_URL}/admin/categories`),
                fetch(`${API_URL}/admin/levels`)
            ]);
            
            const dataCat = await resCat.json();
            const dataLevels = await resLevels.json();
            
            if (dataCat.success) categories = dataCat.data;
            if (dataLevels.success) levels = dataLevels.data;
            
            renderCategoriesAndLevels();
            updateSelectFilters(); // Actualiza los dropdowns de flashcards/preguntas
            
        } catch (error) {
            console.error('Error cargando datos:', error);
            alertaError('Error de conexión al cargar datos');
        }
    }

    // ========================================
    // 4. RENDERIZADO PRINCIPAL (Categorías > Niveles)
    // ========================================
    function renderCategoriesAndLevels() {
        const container = document.getElementById('categories-container');
        
        // Mapeamos cada categoría para crear su tarjeta
        container.innerHTML = categories.map(cat => {
            // Filtramos los niveles que pertenecen a ESTA categoría
            const catLevels = levels.filter(l => l.category_id === cat.id);
            
            // Calculamos límites según tu DB (nivel_inicio y nivel_fin)
            const totalAllowed = cat.nivel_fin - cat.nivel_inicio + 1;
            const currentCount = catLevels.length;
            const isFull = currentCount >= totalAllowed;

            return `
                <div class="category-card" style="border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; border-radius: 10px; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">
                        <div>
                            <h3 style="margin:0; color: #2c3e50;">${cat.nombre}</h3>
                            <small style="color: #7f8c8d;">Rango de niveles: ${cat.nivel_inicio} - ${cat.nivel_fin}</small>
                        </div>
                        <div style="text-align:right;">
                            <span class="badge" style="background:${isFull ? '#e74c3c' : '#2ecc71'}; color:white; padding: 4px 8px; border-radius: 4px; font-size: 0.8em;">
                                ${currentCount} / ${totalAllowed} Niveles
                            </span>
                        </div>
                    </div>
                    
                    <p>${cat.descripcion || 'Sin descripción'}</p>

                    <div class="levels-list" style="margin-top: 15px;">
                        ${catLevels.length > 0 ? catLevels.map(level => `
                            <div style="background: #f8f9fa; padding: 12px; margin: 8px 0; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #3498db;">
                                <div>
                                    <strong>Nivel ${level.orden}</strong>: ${level.nombre}
                                    <br><small>${level.descripcion}</small>
                                </div>
                                <div class="actions">
                                    <button class="btn-secondary btn-small btn-edit-level" data-id="${level.id}" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-danger btn-small btn-delete-level" data-id="${level.id}" title="Eliminar">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') : '<p style="color:#999; font-style:italic;">No hay niveles creados aún.</p>'}
                    </div>

                    <div style="margin-top: 20px; text-align: right;">
                        ${!isFull ? `
                            <button class="btn-primary btn-new-level" data-cat-id="${cat.id}" data-cat-name="${cat.nombre}">
                                <i class="fas fa-plus"></i> Nuevo Nivel en ${cat.nombre}
                            </button>
                        ` : `<span style="color: #e74c3c; font-size: 0.9em;"><i class="fas fa-lock"></i> Categoría Completa</span>`}
                    </div>
                </div>
            `;
        }).join('');

        // Listeners para los botones generados dinámicamente
        attachCategoryEvents();
    }

    function attachCategoryEvents() {
        // Botón Nuevo Nivel
        document.querySelectorAll('.btn-new-level').forEach(btn => {
            btn.addEventListener('click', () => {
                const catId = btn.dataset.catId;
                const catName = btn.dataset.catName;
                openLevelModal(null, catId, catName);
            });
        });

        // Botón Editar Nivel
        document.querySelectorAll('.btn-edit-level').forEach(btn => {
            btn.addEventListener('click', () => openLevelModal(btn.dataset.id));
        });

        // Botón Eliminar Nivel
        document.querySelectorAll('.btn-delete-level').forEach(btn => {
            btn.addEventListener('click', () => deleteLevel(btn.dataset.id));
        });
    }

    // ========================================
    // 5. MODAL DE NIVELES (Crear/Editar)
    // ========================================
    const modalLevel = document.getElementById('modal-level');
    const formLevel = document.getElementById('form-level');

    function openLevelModal(levelId = null, catId = null, catName = null) {
        // Limpiar errores previos
        formLevel.reset();
        
        if (levelId) {
            // MODO EDICIÓN
            const level = levels.find(l => l.id == levelId);
            const cat = categories.find(c => c.id == level.category_id);
            
            document.getElementById('modal-level-title').textContent = 'Editar Nivel';
            document.getElementById('level-id').value = level.id;
            
            // Rellenar campos ocultos y visibles
            document.getElementById('level-category-id').value = level.category_id;
            document.getElementById('level-category-name').value = cat ? cat.nombre : 'Categoría desconocida';
            document.getElementById('level-nombre').value = level.nombre;
            document.getElementById('level-descripcion').value = level.descripcion;
            
        } else {
            // MODO CREACIÓN
            document.getElementById('modal-level-title').textContent = 'Nuevo Nivel';
            document.getElementById('level-id').value = ''; // Vacío para indicar nuevo
            
            // Establecer la categoría preseleccionada
            document.getElementById('level-category-id').value = catId;
            document.getElementById('level-category-name').value = catName;
        }
        
        modalLevel.classList.add('active');
    }

    // Guardar Nivel (Submit)
    formLevel.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('level-id').value;
        const categoryId = document.getElementById('level-category-id').value;
        const nombre = document.getElementById('level-nombre').value.trim();
        const descripcion = document.getElementById('level-descripcion').value.trim();
        
        if(!nombre || !descripcion) {
            alertaAdvertencia("Completa todos los campos");
            return;
        }

        try {
            const url = id ? `${API_URL}/admin/levels/${id}` : `${API_URL}/admin/levels`;
            const method = id ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, nombre, descripcion, categoryId })
            });
            
            const data = await res.json();
            
            if (data.success) {
                alertaExito(id ? 'Nivel actualizado' : 'Nivel creado exitosamente');
                modalLevel.classList.remove('active');
                loadData(); // Recargar la lista
            } else {
                alertaError(data.message);
            }
        } catch (error) {
            console.error(error);
            alertaError('Error al guardar el nivel');
        }
    });

    // Eliminar Nivel
    async function deleteLevel(id) {
        const confirmar = await alertaConfirmacion('¿Eliminar este nivel y todo su contenido?');
        if (!confirmar) return;
        
        try {
            const res = await fetch(`${API_URL}/admin/levels/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            const data = await res.json();
            
            if (data.success) {
                alertaExito('Nivel eliminado');
                loadData();
            } else {
                alertaAdvertencia(data.message); // Si tiene contenido, el backend avisa aquí
            }
        } catch (error) {
            alertaError('Error al eliminar');
        }
    }

    // ========================================
    // 6. FLASHCARDS Y PREGUNTAS (Auxiliares)
    // ========================================
    
    // Función para actualizar los <select> de las otras pestañas
    function updateSelectFilters() {
        const selects = [
            document.getElementById('flashcard-level-filter'),
            document.getElementById('question-level-filter'),
            document.getElementById('flashcard-level'), // En el modal
            document.getElementById('question-level')   // En el modal
        ];

        let optionsHTML = '<option value="">-- Selecciona un Nivel --</option>';

        // Agrupamos en el select por categoría para que se vea ordenado
        categories.forEach(cat => {
            const catLevels = levels.filter(l => l.category_id === cat.id);
            if(catLevels.length > 0) {
                optionsHTML += `<optgroup label="${cat.nombre}">`;
                catLevels.forEach(lvl => {
                    optionsHTML += `<option value="${lvl.id}">Nivel ${lvl.orden}: ${lvl.nombre}</option>`;
                });
                optionsHTML += `</optgroup>`;
            }
        });

        selects.forEach(sel => {
            if(sel) sel.innerHTML = optionsHTML;
        });
    }

// ========================================
    // 7. LÓGICA DE FLASHCARDS
    // ========================================

    // Filtro por nivel: Cargar flashcards cuando cambie el select
    document.getElementById('flashcard-level-filter')?.addEventListener('change', (e) => {
        const levelId = e.target.value;
        if (levelId) loadFlashcards(levelId);
        else document.getElementById('flashcards-container').innerHTML = '';
    });

    async function loadFlashcards(levelId) {
        try {
            const res = await fetch(`${API_URL}/admin/flashcards/level/${levelId}`);
            const data = await res.json();
            if (data.success) {
                flashcards = data.data;
                renderFlashcards();
            }
        } catch (error) {
            alertaError('Error al cargar flashcards');
        }
    }

    function renderFlashcards() {
        const container = document.getElementById('flashcards-container');
        if (flashcards.length === 0) {
            container.innerHTML = '<p>No hay flashcards en este nivel.</p>';
            return;
        }

        container.innerHTML = flashcards.map(f => `
            <div class="admin-card">
                <div class="admin-card-content">
                    <strong>P:</strong> ${f.pregunta}<br>
                    <strong>R:</strong> ${f.respuesta}
                </div>
                <div class="admin-card-actions">
                    <button class="btn-danger btn-small" onclick="deleteFlashcard(${f.id}, ${f.level_id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // El código de "Guardar Flashcard" que tenías arriba, muévelo aquí:
    document.getElementById('form-flashcard').addEventListener('submit', async (e) => {
        e.preventDefault();
        const levelId = document.getElementById('flashcard-level').value;
        const pregunta = document.getElementById('flashcard-pregunta').value.trim();
        const respuesta = document.getElementById('flashcard-respuesta').value.trim();

        if (!levelId || !pregunta || !respuesta) return alertaAdvertencia('Completa todos los campos');

        try {
            const res = await fetch(`${API_URL}/admin/flashcards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, levelId, pregunta, respuesta })
            });
            const data = await res.json();
            if (data.success) {
                alertaExito('Flashcard creada');
                document.getElementById('modal-flashcard').classList.remove('active');
                loadFlashcards(levelId); // Recargar la lista automáticamente
            }
        } catch (error) { alertaError('Error al guardar'); }
    });

    // Función global para eliminar (necesita estar en window para el onclick)
    window.deleteFlashcard = async (id, levelId) => {
        const confirmar = await alertaConfirmacion('¿Eliminar esta flashcard?');
        if (!confirmar) return;
        try {
            const res = await fetch(`${API_URL}/admin/flashcards/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            if ((await res.json()).success) {
                alertaExito('Eliminada');
                loadFlashcards(levelId);
            }
        } catch (error) { alertaError('Error al eliminar'); }
    };
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        });
    });

    // INICIALIZACIÓN
    loadData();
});

