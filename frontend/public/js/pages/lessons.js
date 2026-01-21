/* assets/js/pages/lessons.js */

import { getUserData } from '../modules/api.js';
import { protectRoute, getAuthData } from '../modules/auth.js';

// URL de la API (Ajusta si es diferente)
const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Seguridad
    if (!protectRoute()) return;
    const sessionUser = getAuthData();
    const userId = sessionUser.id;

    // 2. MAPEO DE SLUGS HTML A IDs DE BASE DE DATOS
    // Esto conecta tu HTML (data-category="fundamentos") con la DB (id: 1)
    const categoryMap = {
        'fundamentos': 1,
        'cuentas-bancarias': 2,
        'tarjetas': 3,
        'administracion': 4,
        'deudas-creditos': 5
    };

    // Variables globales para el estado
    let userLevel = 1;
    let allLevelsDB = []; // Aquí guardaremos los niveles que traiga la API

    try {
        // 3. CARGA PARALELA: Datos de usuario Y Niveles del sistema
        const [userData, levelsResponse] = await Promise.all([
            getUserData(userId),
            fetch(`${API_URL}/levels`)
        ]);

        const levelsResult = await levelsResponse.json();

        // Guardamos datos
        userLevel = userData.level || 1;
        if (levelsResult.success) {
            allLevelsDB = levelsResult.data; // Todos los niveles de la DB
        }

        console.log('Nivel usuario:', userLevel);
        console.log('Niveles cargados:', allLevelsDB.length);

        // ✅ QUITAR LOADING
        const loading = document.querySelector('.loading-levels');
        if (loading) loading.remove();

    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
    }

    // 4. LÓGICA DE RENDERIZADO (Ahora usa la DB, no config fija)
    function renderizarLeccion(card) {
        const categorySlug = card.dataset.category; // ej: "fundamentos"
        const categoryId = categoryMap[categorySlug]; // ej: 1

        if (!categoryId) {
            console.error('Categoría no mapeada:', categorySlug);
            return;
        }

        // FILTRAR: Solo los niveles que pertenecen a esta categoría
        // Ordenamos por 'orden' para que salgan 1, 2, 3...
       const levelsForThisCard = allLevelsDB.filter(l => Number(l.category_id) === Number(categoryId));
console.log(`Buscando niveles para ${categorySlug} (ID: ${categoryId}). Encontrados:`, levelsForThisCard.length);
        const levelsContainer = card.querySelector('.levels-container');
        
        // Conservar la barra de progreso
        const progressBar = levelsContainer.querySelector('.progress-bar');
        levelsContainer.innerHTML = ''; // Limpiar niveles anteriores
        if (progressBar) levelsContainer.appendChild(progressBar);

        if (levelsForThisCard.length === 0) {
            const msg = document.createElement('p');
            msg.innerText = "Próximamente...";
            msg.style.padding = "10px";
            msg.style.color = "#666";
            levelsContainer.insertBefore(msg, progressBar);
            return;
        }

        // Contadores para la barra
        let completedInLesson = 0;
        const totalLevels = levelsForThisCard.length;

        // GENERAR HTML DINÁMICO
        levelsForThisCard.forEach(nivel => {
            // Usamos el 'orden' global que viene de la DB para comparar con el nivel del usuario
            // Asumimos que userLevel corresponde al 'orden' global del juego.
            const globalOrden = nivel.orden; 

            const isCompleted = globalOrden < userLevel;
            const isActive = globalOrden === userLevel;
            const isLocked = globalOrden > userLevel;

            if (isCompleted) completedInLesson++;

            const levelDiv = document.createElement('div');
            levelDiv.classList.add('level-item');

            if (isCompleted) levelDiv.classList.add('completed');
            else if (isActive) levelDiv.classList.add('active');
            else levelDiv.classList.add('locked');

            // Renderizar contenido
            levelDiv.innerHTML = `
                <div class="level-info">
                    <span class="level-num">Nivel ${globalOrden}</span>
                    <span class="level-name">${nivel.nombre}</span>
                </div>
                ${
                    (isActive || isCompleted)
                        ? `<button class="btn-play">Jugar</button>`
                        : `<i class="fa-solid fa-lock"></i>`
                }
            `;

            // Evento Click
            if (isActive || isCompleted) {
                const btn = levelDiv.querySelector('button');
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Redirigir usando el ID real o el orden global, según como funcione tu nivel.html
                    // Usualmente se usa el orden global para cargar la data correcta
                    window.location.href = `/nivel.html?level=${globalOrden}`;
                });
            }

            // Insertar antes de la barra de progreso
            levelsContainer.insertBefore(levelDiv, progressBar);
        });

        // 5. Actualizar Barra de Progreso
        const progressFill = progressBar?.querySelector('.progress-fill');
        if (progressFill) {
            const percent = totalLevels === 0 ? 0 : (completedInLesson / totalLevels) * 100;
            progressFill.style.width = `${percent}%`;
        }
    }

    // 6. EVENTOS CLICK EN TARJETAS (ACORDEÓN)
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Evitar que el click se dispare si pulsamos un botón dentro de la tarjeta
            if(e.target.tagName === 'BUTTON') return;

            // Cerrar otras tarjetas
            document.querySelectorAll('.category-card').forEach(otherCard => {
                if (otherCard !== card) {
                    const otherLevels = otherCard.querySelector('.levels-container');
                    otherLevels.classList.add('hidden');
                }
            });

            const levelsContainer = card.querySelector('.levels-container');
            const isHidden = levelsContainer.classList.contains('hidden');

            // Toggle actual
            levelsContainer.classList.toggle('hidden');

            // Si se abre, renderizamos (Lazy rendering para no cargar todo al inicio)
            if (isHidden) {
                renderizarLeccion(card);
            }
        });
    });

});