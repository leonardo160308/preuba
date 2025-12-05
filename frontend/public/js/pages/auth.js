/* Archivo: assets/js/pages/auth.js */

// 1. IMPORTACIONES
// Traemos las funciones de red (API) y las de manejo de sesión (AUTH MODULES)
import { login, register } from '../modules/api.js'; 
import { saveAuthData } from '../modules/auth.js'; 


document.addEventListener('DOMContentLoaded', () => {
    // 2. OBTENER REFERENCIAS A LOS FORMULARIOS
    const loginForm = document.getElementById('loginForm');    // Asume que tu form de login tiene este ID
    const registerForm = document.getElementById('registerForm'); // Asume que tu form de registro tiene este ID

    // ----------------------------------------------------
    // 3. LÓGICA DEL LOGIN (Conectar el formulario con la API)
    // ----------------------------------------------------
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Lógica para leer Nombre y Contraseña de los inputs.
            // Lógica para llamar a 'await login(nombre, contrasena);'
            // Lógica para llamar a 'saveAuthData(result.user);' y redirigir.
            // (Esta es la lógica que acabamos de refactorizar en el paso anterior)
        });
    }

    // ----------------------------------------------------
    // 4. LÓGICA DEL REGISTRO (Conectar el formulario con la API)
    // ----------------------------------------------------
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Lógica para leer todos los inputs (Nombre, Correo, Contraseña, etc.).
            // Lógica para llamar a 'await register(nuevoUsuarioData);'
            // Lógica para manejar errores de usuario existente y redirigir a login.
            // (Esta es la lógica que refactorizamos hace dos pasos)
        });
    }
});