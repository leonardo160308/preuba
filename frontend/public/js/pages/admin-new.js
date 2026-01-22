// frontend/public/js/pages/admin-new.js
import { protectRoute, getAuthData, logout, isAdmin } from '../modules/auth.js';
import { alertaExito, alertaError, alertaAdvertencia, alertaConfirmacion } from '../modules/alerts.js';

const API_URL = 'http://localhost:3000/api';


document.addEventListener('DOMContentLoaded', async () => {
// ========================================
// CONFIGURACIÓN DE IMÁGENES DISPONIBLES
// ========================================
const AVAILABLE_IMAGES = [
    'alcancia.jpg',
    'compu.jpg',
    'frascoDinero.jpg',
    'mapacheConAlcancia.jpg',
    'mapacheConDinero.jpg',
    'mapacheDandoBillete.jpg',
    'mapacheEntendiendo.jpg',
    'mapacheLeyendo.jpg',
    'tarjetaDetras1.jpg',
    'tarjetaDetras2.jpg',
    'tarjetaDetras3.jpg',
    'tarjetaDetras4.jpg',
    'tarjetaDetras5.jpg',
    'tarjetaDetras6.jpg',
    'tarjetaDetras7.jpg',
    'tarjetaFrente1.jpg',
    'tarjetaFrente4.jpg',
    'tarjetaFrente5.jpg',
    'tarjetaFrente6.jpg',
    'tarjetaFrente7.jpg',
    'tarjetaFrente8.jpg',
    'tarjetaFrente9.jpg',
    'tarjetaFrente10.jpg',
    'tarjetaFrente11.jpg'
];

// ========================================
// FUNCIÓN PARA RENDERIZAR SELECTOR DE IMÁGENES
// ========================================
function renderImageSelector(containerId, previewId, hiddenInputId) {
    const container = document.getElementById(containerId);
    const preview = document.getElementById(previewId);
    const hiddenInput = document.getElementById(hiddenInputId);

    if (!container || !preview || !hiddenInput) {
        console.error('❌ Elementos del selector de imágenes no encontrados', {
            container,
            preview,
            hiddenInput
        });
        return;
    }

    const selectedNameSpan = preview.querySelector('span');

    container.innerHTML = AVAILABLE_IMAGES.map(imgName => `
        <div class="image-option" data-image="/public/img/fotos/${imgName}">
            <img src="/public/img/fotos/${imgName}" alt="${imgName}">
        </div>
    `).join('');

    container.querySelectorAll('.image-option').forEach(option => {
        option.addEventListener('click', () => {

            container.querySelectorAll('.image-option').forEach(opt =>
                opt.classList.remove('selected')
            );

            option.classList.add('selected');

            const imagePath = option.dataset.image;
            const imageName = imagePath.split('/').pop();

            hiddenInput.value = imagePath;
            selectedNameSpan.textContent = imageName;
            preview.classList.add('active');
        });
    });
}

    
    // ========================================
    // 1. SEGURIDAD
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

    let categories = [];
    let levels = [];
    let flashcards = [];
    let questions = [];

    // ========================================
    // 2. NAVEGACIÓN TABS
    // ========================================
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`tab-${tab}`).classList.add('active');
        });
    });

    // Logout
    document.getElementById('logout-btn-admin')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const confirmar = await alertaConfirmacion('¿Cerrar sesión?', 'Salir');
        if (confirmar) logout();
    });

    // ========================================
    // 3. CARGAR DATOS INICIALES
    // ========================================
    async function loadData() {
        try {
            const [resCat, resLevels] = await Promise.all([
                fetch(`${API_URL}/admin/categories`),
                fetch(`${API_URL}/admin/levels`)
            ]);
            
            const dataCat = await resCat.json();
            const dataLevels = await resLevels.json();
            
            if (dataCat.success) categories = dataCat.data;
            if (dataLevels.success) levels = dataLevels.data;
            
            renderCategoriesAndLevels();
            updateSelectFilters();
            
        } catch (error) {
            console.error('Error cargando datos:', error);
            alertaError('Error de conexión al cargar datos');
        }
    }

    // ========================================
    // 4. RENDERIZADO DE CATEGORÍAS Y NIVELES
    // ========================================
    function renderCategoriesAndLevels() {
        const container = document.getElementById('categories-container');
        
        container.innerHTML = categories.map(cat => {
            const catLevels = levels.filter(l => l.category_id === cat.id);
            const totalAllowed = cat.nivel_fin - cat.nivel_inicio + 1;
            const currentCount = catLevels.length;
            const isFull = currentCount >= totalAllowed;

            return `
                <div class="category-card" style="border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; border-radius: 10px; background: white;">
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
                                    <button class="btn-secondary btn-small btn-edit-level" data-id="${level.id}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-danger btn-small btn-delete-level" data-id="${level.id}">
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

        attachCategoryEvents();
    }

    function attachCategoryEvents() {
        document.querySelectorAll('.btn-new-level').forEach(btn => {
            btn.addEventListener('click', () => {
                const catId = btn.dataset.catId;
                const catName = btn.dataset.catName;
                openLevelModal(null, catId, catName);
            });
        });

        document.querySelectorAll('.btn-edit-level').forEach(btn => {
            btn.addEventListener('click', () => openLevelModal(btn.dataset.id));
        });

        document.querySelectorAll('.btn-delete-level').forEach(btn => {
            btn.addEventListener('click', () => deleteLevel(btn.dataset.id));
        });
    }

    // ========================================
    // 5. MODAL DE NIVELES
    // ========================================
    const modalLevel = document.getElementById('modal-level');
    const formLevel = document.getElementById('form-level');

    function openLevelModal(levelId = null, catId = null, catName = null) {
        formLevel.reset();
        
        if (levelId) {
            const level = levels.find(l => l.id == levelId);
            const cat = categories.find(c => c.id == level.category_id);
            
            document.getElementById('modal-level-title').textContent = 'Editar Nivel';
            document.getElementById('level-id').value = level.id;
            document.getElementById('level-category-id').value = level.category_id;
            document.getElementById('level-category-name').value = cat ? cat.nombre : 'Categoría desconocida';
            document.getElementById('level-nombre').value = level.nombre;
            document.getElementById('level-descripcion').value = level.descripcion;
            
        } else {
            document.getElementById('modal-level-title').textContent = 'Nuevo Nivel';
            document.getElementById('level-id').value = '';
            document.getElementById('level-category-id').value = catId;
            document.getElementById('level-category-name').value = catName;
        }
        
        modalLevel.classList.add('active');
    }

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
                loadData();
            } else {
                alertaError(data.message);
            }
        } catch (error) {
            console.error(error);
            alertaError('Error al guardar el nivel');
        }
    });

    async function deleteLevel(id) {
        const confirmar = await alertaConfirmacion('¿Eliminar este nivel?');
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
                alertaAdvertencia(data.message);
            }
        } catch (error) {
            alertaError('Error al eliminar');
        }
    }

    // ========================================
    // 6. ACTUALIZAR SELECTS
    // ========================================
    function updateSelectFilters() {
        const selects = [
            document.getElementById('flashcard-level-filter'),
            document.getElementById('question-level-filter'),
            document.getElementById('flashcard-level'),
            document.getElementById('question-level')
        ];

        let optionsHTML = '<option value="">-- Selecciona un Nivel --</option>';

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
    // 7. FLASHCARDS
    // ========================================
    document.getElementById('flashcard-level-filter')?.addEventListener('change', (e) => {
        const levelId = e.target.value;
        if (levelId) loadFlashcards(levelId);
        else document.getElementById('flashcards-container').innerHTML = '<p class="empty-state">Selecciona un nivel</p>';
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
        
        if (!container) {
            console.error('❌ Contenedor flashcards-container no encontrado');
            return;
        }
        
        if (flashcards.length === 0) {
            container.innerHTML = '<p class="empty-state">No hay flashcards en este nivel.</p>';
            return;
        }

        container.innerHTML = flashcards.map(f => `
            <div class="item-card">
                <h3>${f.titulo}</h3>
                <p>${f.contenido.substring(0, 100)}...</p>
                <div class="item-actions">
                    <button class="btn-danger btn-small" onclick="deleteFlashcard(${f.id}, ${f.level_id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

document.getElementById('btn-new-flashcard')?.addEventListener('click', () => {
    const levelId = document.getElementById('flashcard-level-filter').value;
    if (!levelId) {
        alertaAdvertencia('Selecciona un nivel primero');
        return;
    }
    
    document.getElementById('flashcard-level').value = levelId;
    document.getElementById('form-flashcard').reset();
    document.getElementById('flashcard-id').value = '';
    document.getElementById('modal-flashcard-title').textContent = 'Nueva Flashcard';
    
    // ✅ RENDERIZAR SELECTOR DE IMÁGENES
    renderImageSelector('flashcard-image-grid', 'flashcard-image-preview', 'flashcard-imagen');
    
    document.getElementById('modal-flashcard').classList.add('active');
});

    document.getElementById('form-flashcard')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const levelId = document.getElementById('flashcard-level').value;
        const titulo = document.getElementById('flashcard-titulo').value.trim();
        const contenido = document.getElementById('flashcard-contenido').value.trim();
        const imagen = document.getElementById('flashcard-imagen')?.value.trim() || null;

        if (!levelId || !titulo || !contenido) {
            alertaAdvertencia('Completa todos los campos');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/admin/flashcards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, levelId, titulo, contenido, imagen })
            });
            
            const data = await res.json();
            
            if (data.success) {
                alertaExito('Flashcard creada');
                document.getElementById('modal-flashcard').classList.remove('active');
                loadFlashcards(levelId);
            } else {
                alertaError(data.message);
            }
        } catch (error) {
            alertaError('Error al guardar');
        }
    });

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
        } catch (error) {
            alertaError('Error al eliminar');
        }
    };

    // ========================================
    // 8. CERRAR MODALES
    // ========================================
    document.querySelectorAll('.modal-close, [data-modal]').forEach(el => {
        el.addEventListener('click', () => {
            const modalId = el.dataset.modal || el.closest('.modal').id;
            document.getElementById(modalId).classList.remove('active');
        });
    });
    // ========================================
// 9. PREGUNTAS (FALTABA IMPLEMENTAR)
// ========================================
document.getElementById('question-level-filter')?.addEventListener('change', (e) => {
    const levelId = e.target.value;
    if (levelId) loadQuestions(levelId);
    else document.getElementById('questions-container').innerHTML = '<p class="empty-state">Selecciona un nivel</p>';
});

async function loadQuestions(levelId) {
    try {
        const res = await fetch(`${API_URL}/admin/questions/${levelId}`);
        const data = await res.json();
        
        if (data.success) {
            questions = data.data;
            renderQuestions();
        }
    } catch (error) {
        alertaError('Error al cargar preguntas');
    }
}

function renderQuestions() {
    const container = document.getElementById('questions-container');
    
    if (!container) {
        console.error('❌ Contenedor questions-container no encontrado');
        return;
    }
    
    if (questions.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay preguntas en este nivel.</p>';
        return;
    }

    container.innerHTML = questions.map(q => `
        <div class="item-card">
            <h3>${q.pregunta.substring(0, 60)}...</h3>
            <div class="meta">
                <span><i class="fas fa-list"></i> ${Object.keys(q.opciones).length} opciones</span>
                <span><i class="fas fa-check-circle"></i> Correcta: ${q.correcta}</span>
            </div>
            <div class="item-actions">
                <button class="btn-danger btn-small" onclick="deleteQuestion(${q.id}, ${q.level_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

document.getElementById('btn-new-question')?.addEventListener('click', () => {
    const levelId = document.getElementById('question-level-filter').value;
    if (!levelId) {
        alertaAdvertencia('Selecciona un nivel primero');
        return;
    }
    
    document.getElementById('question-level').value = levelId;
    document.getElementById('form-question').reset();
    document.getElementById('question-id').value = '';
    
    // Resetear opciones
    const container = document.getElementById('options-container');
    container.innerHTML = `
        <div class="option-row">
            <input type="text" class="option-input" data-key="A" placeholder="Opción A" required>
        </div>
        <div class="option-row">
            <input type="text" class="option-input" data-key="B" placeholder="Opción B" required>
        </div>
        <div class="option-row">
            <input type="text" class="option-input" data-key="C" placeholder="Opción C" required>
        </div>
    `;
    
    updateCorrectaOptions();
    
    // ✅ RENDERIZAR SELECTOR DE IMÁGENES
    renderImageSelector('question-image-grid', 'question-image-preview', 'question-imagen');
    
    document.getElementById('modal-question-title').textContent = 'Nueva Pregunta';
    document.getElementById('modal-question').classList.add('active');
});

// Botón añadir opción
document.getElementById('btn-add-option')?.addEventListener('click', () => {
    const container = document.getElementById('options-container');
    const count = container.children.length;
    
    if (count >= 5) {
        alertaAdvertencia('Máximo 5 opciones');
        return;
    }
    
    const keys = ['A', 'B', 'C', 'D', 'E'];
    const nextKey = keys[count];
    
    const row = document.createElement('div');
    row.className = 'option-row';
    row.innerHTML = `
        <input type="text" class="option-input" data-key="${nextKey}" placeholder="Opción ${nextKey}" required>
        <button type="button" class="btn-remove-option">&times;</button>
    `;
    
    container.appendChild(row);
    
    // Evento eliminar
    row.querySelector('.btn-remove-option').addEventListener('click', () => {
        if (container.children.length <= 3) {
            alertaAdvertencia('Mínimo 3 opciones');
            return;
        }
        row.remove();
        updateCorrectaOptions();
    });
    
    updateCorrectaOptions();
});

function updateCorrectaOptions() {
    const select = document.getElementById('question-correcta');
    const inputs = document.querySelectorAll('.option-input');
    const keys = Array.from(inputs).map(i => i.dataset.key);
    
    const currentValue = select.value;
    select.innerHTML = '<option value="">Selecciona la correcta</option>' +
        keys.map(k => `<option value="${k}">${k}</option>`).join('');
    
    if (keys.includes(currentValue)) {
        select.value = currentValue;
    }
}

document.getElementById('form-question')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const levelId = document.getElementById('question-level').value;
    const pregunta = document.getElementById('question-pregunta').value.trim();
    const correcta = document.getElementById('question-correcta').value;
    const dificultad = document.getElementById('question-dificultad').value;
    const imagen = document.getElementById('question-imagen')?.value.trim() || null;
    
    // Recopilar opciones
    const opciones = {};
    document.querySelectorAll('.option-input').forEach(input => {
        opciones[input.dataset.key] = input.value.trim();
    });
    
    if (!levelId || !pregunta || !correcta || Object.keys(opciones).length < 3) {
        alertaAdvertencia('Completa todos los campos');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/admin/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, levelId, pregunta, opciones, correcta, dificultad, imagen })
        });
        
        const data = await res.json();
        
        if (data.success) {
            alertaExito('Pregunta creada');
            document.getElementById('modal-question').classList.remove('active');
            loadQuestions(levelId);
        } else {
            alertaError(data.message);
        }
    } catch (error) {
        alertaError('Error al guardar');
    }
});

window.deleteQuestion = async (id, levelId) => {
    const confirmar = await alertaConfirmacion('¿Eliminar esta pregunta?');
    if (!confirmar) return;
    
    try {
        const res = await fetch(`${API_URL}/admin/questions/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        
        if ((await res.json()).success) {
            alertaExito('Eliminada');
            loadQuestions(levelId);
        }
    } catch (error) {
        alertaError('Error al eliminar');
    }
};

    // INICIALIZACIÓN
    loadData();
});