// js/modules/auth.js

const USER_KEY = 'too_easy_user_data';

// Guarda los datos del usuario (ID, nombre, nivel)
export function saveAuthData(userData) {
    // Aquí puedes guardar solo la información que necesitas para la sesión
    const sessionData = {
        id: userData.id,
        nombre: userData.nombre,
        // Si tu backend enviara un Token (JWT), también se guardaría aquí.
        // token: userData.token,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(sessionData));
}

// Obtiene los datos de la sesión actual
export function getAuthData() {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
}

// Cierra la sesión
export function logout() {
    localStorage.removeItem(USER_KEY);
    // Redirige a la pantalla pública de inicio o login
    window.location.href = '/views/login.html'; 
}

// Verifica si el usuario está logueado
export function isAuthenticated() {
    return getAuthData() !== null;
}

// 🔐 Función de protección de rutas (CRÍTICA)
// Si esta función se llama al inicio de cada página privada, protege tu app.
export function protectRoute() {
    if (!isAuthenticated()) {
        alert("⚠️ Acceso denegado. Debes iniciar sesión.");
        window.location.href = '/views/login.html';
        return false;
    }
    return true;
}