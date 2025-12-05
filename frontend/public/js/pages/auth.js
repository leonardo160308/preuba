import { login, register } from '../modules/api.js'; 
import { saveAuthData } from '../modules/auth.js'; 

document.addEventListener('DOMContentLoaded', () => {
    // ========== LÓGICA DE LOGIN ==========
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Leer valores de los inputs
            const nombre = document.getElementById('Nombre').value.trim();
            const password = document.getElementById('contraseña').value;
            const messageEl = document.getElementById('auth-message');
            
            if (!nombre || !password) {
                messageEl.textContent = 'Por favor, completa todos los campos.';
                return;
            }
            
            messageEl.textContent = 'Verificando...';
            messageEl.style.color = 'blue';
            
            try {
                // Llamar a la API
                const result = await login(nombre, password);
                
                if (result.success) {
                    // Guardar sesión
                    saveAuthData(result.user);
                    
                    // Redirigir al dashboard
                    window.location.href = '/views/dashboard.html';
                } else {
                    messageEl.textContent = result.message || 'Credenciales incorrectas.';
                    messageEl.style.color = 'red';
                }
            } catch (error) {
                console.error('Error en login:', error);
                messageEl.textContent = 'Error de conexión. Verifica que el servidor esté activo.';
                messageEl.style.color = 'red';
            }
        });
    }
    
    // ========== LÓGICA DE REGISTRO ==========
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Leer valores
            const nombre = document.getElementById('registerNombre').value.trim();
            const email = document.getElementById('registerEmail')?.value.trim();
            const password = document.getElementById('registerContraseña').value;
            const edad = parseInt(document.getElementById('registerEdad').value);
            const genero = document.getElementById('registerGenero').value;
            const terminos = document.getElementById('terminos').checked;
            const messageEl = document.getElementById('auth-message');
            
            // Validaciones
            if (!nombre || !password || !edad || !genero) {
                messageEl.textContent = 'Por favor, completa todos los campos obligatorios.';
                messageEl.style.color = 'red';
                return;
            }
            
            if (!terminos) {
                messageEl.textContent = 'Debes aceptar los Términos y Condiciones.';
                messageEl.style.color = 'red';
                return;
            }
            
            if (edad < 15) {
                messageEl.textContent = 'Debes tener al menos 15 años.';
                messageEl.style.color = 'red';
                return;
            }
            
            messageEl.textContent = 'Creando cuenta...';
            messageEl.style.color = 'blue';
            
            try {
                // Preparar datos
                const userData = {
                    nombre: nombre,
                    password: password, // ⚠️ El backend debe encriptarla
                    edad: edad,
                    genero: genero,
                    email: email || null // Opcional si no existe el campo
                };
                
                // Llamar a la API
                const result = await register(userData);
                
                if (result.success) {
                    alert('¡Cuenta creada exitosamente! Ahora inicia sesión.');
                    window.location.href = '/views/login.html';
                } else {
                    messageEl.textContent = result.message || 'Error al crear cuenta.';
                    messageEl.style.color = 'red';
                }
            } catch (error) {
                console.error('Error en registro:', error);
                messageEl.textContent = 'Error de conexión. Verifica que el servidor esté activo.';
                messageEl.style.color = 'red';
            }
        });
    }
});