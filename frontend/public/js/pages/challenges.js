/* assets/js/pages/challenges.js */

import { protectRoute, getAuthData } from '../modules/auth.js';
import { getChallengesStatus, completeChallenge } from '../modules/api.js'; // Necesitas agregar estas funciones en api.js
import { challengesData } from '../data/challenges.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Seguridad
    if (!protectRoute()) return;
    const sessionUser = getAuthData();
    const userId = sessionUser.id;

    const challengesContainer = document.getElementById('challenges-container'); // Asegúrate de tener este ID en challenges.html

    // 2. Obtener estado de retos del usuario (Completados)
    let completedChallengesIds = [];

    async function fetchChallengesStatus() {
        try {
            // El backend retorna una lista de IDs de retos que el usuario ya completó
            const response = await getChallengesStatus(userId);
            completedChallengesIds = response.completedIds || [];
            console.log("Retos completados:", completedChallengesIds);
        } catch (error) {
            console.error("Error al cargar el estado de retos:", error);
            // Si falla, asumimos que no hay retos completados
        }
    }

    // 3. Renderizar los Retos
    function renderChallenges() {
        if (!challengesContainer) return;
        challengesContainer.innerHTML = '';

        challengesData.forEach(challenge => {
            const isCompleted = completedChallengesIds.includes(challenge.id);
            
            const card = document.createElement('div');
            card.classList.add('challenge-card');
            card.classList.add(isCompleted ? 'completed' : 'available');

            card.innerHTML = `
                <h3>${challenge.title}</h3>
                <p>${challenge.description}</p>
                <div class="challenge-footer">
                    <span class="reward">
                        🪵 ${challenge.reward_wood} Madera | 🪙 ${challenge.reward_coins} Monedas
                    </span>
                    <button 
                        class="btn-complete-challenge" 
                        data-challenge-id="${challenge.id}"
                        ${isCompleted ? 'disabled' : ''}
                    >
                        ${isCompleted ? '✅ Completado' : 'Completar Reto'}
                    </button>
                </div>
            `;
            challengesContainer.appendChild(card);
        });
        
        // 4. Asignar Eventos a los Botones
        document.querySelectorAll('.btn-complete-challenge[data-challenge-id]').forEach(button => {
            if (!button.disabled) {
                button.addEventListener('click', handleCompleteChallenge);
            }
        });
    }
    
    // 5. Manejar la Acción de Completar (Conexión API)
    async function handleCompleteChallenge(event) {
        const challengeId = parseInt(event.target.dataset.challengeId);
        const button = event.target;
        
        button.disabled = true;
        button.textContent = "Procesando...";

        try {
            // Llamamos al Backend para que valide si el usuario cumplió el reto 
            // y aplique la recompensa (madera y monedas).
            const result = await completeChallenge(userId, challengeId); 
            
            if (result.success) {
                alert(result.message);
                
                // Actualizar UI
                await fetchChallengesStatus(); // Obtener el nuevo estado
                renderChallenges();
                
            } else {
                alert(`❌ ${result.message}`);
                button.disabled = false;
                button.textContent = "Completar Reto";
            }
        } catch (error) {
            console.error("Error al completar reto:", error);
            alert("Error de conexión al intentar completar el reto.");
            button.disabled = false;
            button.textContent = "Completar Reto";
        }
    }

    // Inicialización
    await fetchChallengesStatus();
    renderChallenges();
});