/* assets/js/pages/lessons.js */

import { getUserData } from '../modules/api.js';
import { protectRoute, getAuthData } from '../modules/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Seguridad y Autenticación
    if (!protectRoute()) return;
    const sessionUser = getAuthData();
    const userId = sessionUser.id;

    // 2. Definición del Contenedor de Niveles
    const levelsContainer = document.getElementById('levels-container'); // Asegúrate de que este ID exista en tu lecciones.html
    const totalNiveles = 17;

    // 3. Obtener el Progreso del Usuario
    let userLevel = 1; // Nivel por defecto si hay error

    try {
        const userData = await getUserData(userId);
        // Usamos el campo 'level' que almacena el progreso educativo/quiz
        userLevel = userData.level || 1; 
        
        console.log(`Progreso cargado: Nivel actual: ${userLevel}`);
    } catch (error) {
        console.error("Error al cargar el progreso del usuario:", error);
        alert("No se pudo cargar tu progreso. Intenta recargar.");
    }

    // 4. Renderizar los Niveles
    function renderizarNiveles() {
        if (!levelsContainer) return;
        levelsContainer.innerHTML = ''; // Limpiar el contenedor antes de dibujar

        for (let i = 1; i <= totalNiveles; i++) {
            const isUnlocked = i <= userLevel; // El nivel está desbloqueado si el índice es menor o igual al nivel del usuario
            const levelDiv = document.createElement('div');
            levelDiv.classList.add('level-card');
            
            // Asigna una clase para estilizar el nivel (activo, completado o bloqueado)
            if (i < userLevel) {
                levelDiv.classList.add('completed');
            } else if (i === userLevel) {
                levelDiv.classList.add('active');
            } else {
                levelDiv.classList.add('locked');
            }
            
            // Contenido del nivel
            levelDiv.innerHTML = `
                <div class="level-number">Nivel ${i}</div>
                <div class="level-icon">
                    ${isUnlocked ? '🔓' : '🔒'}
                </div>
                <div class="level-title">Tema: ${getNombreNivel(i)}</div>
            `;
            
            // 5. Asignar Evento de Clic
            if (isUnlocked) {
                levelDiv.style.cursor = 'pointer';
                levelDiv.onclick = () => {
                    // Redirige al quiz de ese nivel
                    window.location.href = `/views/quiz.html?level=${i}`;
                };
            } else {
                levelDiv.title = `Desbloquea el Nivel ${i - 1} para acceder.`;
            }

            levelsContainer.appendChild(levelDiv);
        }
    }

    // Función auxiliar para los nombres de los niveles
    function getNombreNivel(level) {
        // Puedes cambiar estos nombres por los temas reales de tu juego
        const names = {
            1: "Conociendo el dinero",
            2: "Guardar o Gastar",
            3: "Seguridad Financiera",
            4: "Tu primera cuenta",
            5: "La cuenta del trabajo(nomina)",
            6: "Lo que el banco cobra",
            7: "Debito",
            8: "Credito",
            9: "Tipos de credito",
            10: "Subiendo de nivel(tarjetas oro y platino)",
            11:"Organizando el sueldo",
            12:"Regla 50/30/20",
            13:"Presupuesto inteligente",
            14:"Como aprueban o niegan un prestamo",
            15:"Historial crediticio y su importancia",
            16:"¿Que es una deuda y para que sirve? ",
            17:"Tipos de deudas buenas y malas"
        };
        return names[level] || `Tema Genérico ${level}`;
    }

    // 6. Inicialización
    renderizarNiveles();
});