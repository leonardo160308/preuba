// js/modules/api.js

const API_BASE_URL = 'http://localhost:3000/api'; 
// 👆 O la URL donde esté corriendo tu servidor Node.js

// 1. AUTENTICACIÓN
export async function login(nombre, password) {
    return fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, password }),
    }).then(res => res.json());
}

export async function register(userData) {
    return fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    }).then(res => res.json());
}

// 2. LECTURA DE DATOS
export async function getUserData(userId) {
    return fetch(`${API_BASE_URL}/users/${userId}`).then(res => res.json());
}

export async function getDashboardData(userId) {
    return fetch(`${API_BASE_URL}/movements/user/${userId}`).then(res => res.json());
}

// 3. MOVIMIENTOS Y METAS
export async function createMovement(movementData) {
    return fetch(`${API_BASE_URL}/movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movementData),
    }).then(res => res.json());
}

export async function updateGoal(userId, goalData) {
    return fetch(`${API_BASE_URL}/dashboard-fixed/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
    }).then(res => res.json());
}


// 4. SISTEMA DE JUEGO (GAMIFICACIÓN)
// Usada en quiz.js para dar recompensa y en profile.js para mejoras
export async function updateUserData(userId, updateData) {
    return fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
    }).then(res => res.json());
}

export async function upgradeItem(userId, type) {
    return fetch(`${API_BASE_URL}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type }),
    }).then(res => res.json());
}
// ... y así para todas las demás rutas

/* Archivo: assets/js/modules/api.js - Funciones de Conexión al Backend */

// Asumimos que esta es la URL base de tu backend. Ajústala si es necesario.
const BASE_URL = 'http://localhost:3000/api';

// ---------------------------
// AÑADE ESTA FUNCIÓN DE LOGIN
// ---------------------------
export async function login(nombre, contrasena) {
    const url = `${BASE_URL}/login`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // Enviamos las credenciales al servidor
            body: JSON.stringify({ nombre, contrasena }) 
        });

        const data = await response.json();
        
        // Si la respuesta es 200-299, el inicio de sesión fue exitoso
        if (response.ok) {
            // El servidor debería devolver los datos del usuario (id, nombre, etc.)
            return { 
                success: true, 
                user: data.user, 
                message: 'Inicio de sesión exitoso.' 
            };
        } 
        // Si no, el servidor devuelve un error (ej: 401 Credenciales incorrectas)
        else {
            return { 
                success: false, 
                message: data.message || 'Error de credenciales.' 
            };
        }

    } catch (error) {
        console.error('Error de red al intentar iniciar sesión:', error);
        return { 
            success: false, 
            message: 'Error de conexión con el servidor. Verifica que esté activo.' 
        };
    }
}

// 1. Obtener el estado de los retos completados por el usuario
export const getChallengesStatus = async (userId) => {
    try {
        const response = await fetch(`${API_URL}/challenges/status/${userId}`);
        if (!response.ok) {
            throw new Error('No se pudo obtener el estado de los retos.');
        }
        return await response.json();
    } catch (error) {
        console.error("API Error - getChallengesStatus:", error);
        throw error;
    }
};

// 2. Intentar completar un reto y obtener la recompensa
export const completeChallenge = async (userId, challengeId) => {
    try {
        const response = await fetch(`${API_URL}/challenges/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, challengeId }),
        });
        
        const data = await response.json();
        
        // El backend debe manejar la validación y devolver { success: true/false, message: "..." }
        if (!response.ok) {
             // Si el servidor devuelve un 400 (ej: reto no cumplido)
            throw new Error(data.message || 'Error desconocido al completar el reto');
        }
        
        return data; // Contiene { success: true, message: "Recompensa otorgada", new_stats: {...} }
        
    } catch (error) {
        console.error("API Error - completeChallenge:", error);
        // Devolvemos un objeto de error para manejarlo en la UI
        return { success: false, message: error.message || "Error de red/servidor." };
    }
};
// Puedes dejar aquí otras funciones como 'register' si ya la creaste:
// export async function register(nombre, contrasena) { ... }