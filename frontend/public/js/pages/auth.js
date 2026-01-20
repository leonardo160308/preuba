// frontend/public/js/pages/auth.js - VERSIÓN FINAL CON BLOQUEO DE TECLAS
import { login, register } from '../modules/api.js'; 
import { saveAuthData } from '../modules/auth.js'; 
import { alertaExito, alertaError, alertaInfo } from '../modules/alerts.js';

document.addEventListener('DOMContentLoaded', () => {

    // =========================================================
    // 1. VALIDACIONES EN TIEMPO REAL (LO QUE NO DEJA ESCRIBIR)
    // =========================================================
    const inputEdad = document.getElementById('registerEdad');
    
    if (inputEdad) {
        // Bloquear teclas: punto, coma, 'e' (exponente), signos menos/mas
        inputEdad.addEventListener('keydown', (e) => {
            const teclasProhibidas = ['.', ',', 'e', 'E', '-', '+'];
            if (teclasProhibidas.includes(e.key)) {
                e.preventDefault();
            }
        });

        // Limpieza extra: Si pegan texto o escriben muy rápido
        inputEdad.addEventListener('input', () => {
            // Borra cualquier cosa que no sea número
            inputEdad.value = inputEdad.value.replace(/[^0-9]/g, '');
            
            // Si escriben más de 2 dígitos (ej: 100), corta el string
            if (inputEdad.value.length > 2) {
                inputEdad.value = inputEdad.value.slice(0, 2);
            }
        });
    }

    // Opcional: Evitar espacios en el Nombre de Usuario (si quieres)
    const inputNombre = document.getElementById('registerNombre');
    if (inputNombre) {
        inputNombre.addEventListener('keydown', (e) => {
            // Si presionan espacio, no hace nada
            if (e.key === ' ') {
                e.preventDefault();
            }
        });
    }

    // =========================================================
    // 2. LÓGICA DE LOGIN
    // =========================================================
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nombre = document.getElementById('Nombre').value.trim();
            const password = document.getElementById('contraseña').value;
            
            if (!nombre || !password) {
                alertaError('Por favor, completa todos los campos.');
                return;
            }
            
            alertaInfo('Verificando credenciales...', { duration: 2000 });
            
            try {
                const result = await login(nombre, password);
                
                if (result.success) {
                    saveAuthData(result.user);
                    alertaExito('¡Bienvenido! Redirigiendo...', {
                        onClose: () => { window.location.href = '/dashboard.html'; }
                    });
                    
                    setTimeout(() => {
                        window.location.href = '/dashboard.html';
                    }, 1500);
                    
                } else {
                    alertaError(result.message || 'Credenciales incorrectas.');
                }
            } catch (error) {
                console.error('Error en login:', error);
                alertaError('Error de conexión. Verifica el servidor.');
            }
        });
    }
    
    // =========================================================
    // 3. LÓGICA DE REGISTRO
    // =========================================================
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nombre = document.getElementById('registerNombre').value.trim();
            const email = document.getElementById('registerEmail')?.value.trim();
            const password = document.getElementById('registerContraseña').value;
            const edadRaw = document.getElementById('registerEdad').value;
            const genero = document.getElementById('registerGenero').value;
            const terminos = document.getElementById('terminos').checked;

            // Validaciones al enviar (Submit)
            if (!nombre || !email || !password || !edadRaw || !genero) {
                alertaError('Por favor, completa todos los campos obligatorios.');
                return;
            }
            
            if (!terminos) {
                alertaError('Debes aceptar los Términos y Condiciones.');
                return;
            }

            if (nombre.length < 3 || nombre.length > 16) {
                alertaError('El nombre de usuario debe tener entre 3 y 16 caracteres.');
                return;
            }

            if (password.length < 6 || password.length > 16) {
                alertaError('La contraseña debe tener entre 6 y 16 caracteres.');
                return;
            }

            if (email.length < 6 || email.length > 254) {
                alertaError('El correo debe tener entre 6 y 254 caracteres.');
                return;
            }

            const edad = Number(edadRaw);
            if (edad < 15 || edad > 99) {
                alertaError('Debes tener entre 15 y 99 años para registrarte.');
                return;
            }

            alertaInfo('Creando tu cuenta...', { duration: 3000 });
            
            try {
                const userData = { nombre, email, password, edad, genero };
                const result = await register(userData);
                
                if (result.success) {
                    alertaExito('¡Cuenta creada con éxito! Redirigiendo...', {
                        duration: 2500,
                        onClose: () => { window.location.href = '/login.html'; }
                    });
                    
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 2500);
                    
                } else {
                    alertaError(result.message || 'El nombre de usuario ya está en uso.');
                }
            } catch (error) {
                console.error('Error en registro:', error);
                alertaError('Error de conexión. Verifica el servidor.');
            }
        });
    }

    // =========================================================
    // 4. OBSERVER (Para detectar cambios en el DOM si usas SPA)
    // =========================================================
    const observer = new MutationObserver((mutations) => {
        // Tu lógica de observer original
    });

    document.querySelectorAll('#registerForm input, #registerForm select')
      .forEach(el => {
        observer.observe(el, {
          attributes: true,
          attributeFilter: ['type', 'required', 'value']
        });
      });
});