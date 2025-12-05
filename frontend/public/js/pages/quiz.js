import { updateUserData, getUserData } from '../modules/api.js';
import { protectRoute, getAuthData } from '../modules/auth.js';
import { preguntasPorNivel, SKIN_REWARDS } from '../data/preguntas.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Seguridad
    if (!protectRoute()) return;
    const sessionUser = getAuthData();

    // 2. Detectar Nivel desde la URL (ej: quiz.html?level=1)
    const urlParams = new URLSearchParams(window.location.search);
    const nivelActual = parseInt(urlParams.get('level')) || 1; // Por defecto nivel 1

    // 3. Variables de Estado
    const preguntas = preguntasPorNivel[nivelActual];
    if (!preguntas) {
        alert("Nivel no encontrado o en construcción.");
        window.location.href = '/views/lecciones.html';
        return;
    }

    let preguntaIndex = 0;
    let aciertos = 0;
    let seleccionUsuario = null;

    // 4. Referencias DOM
    const txtPregunta = document.getElementById("textoPregunta");
    const imgPregunta = document.getElementById("imagenPregunta");
    const divOpciones = document.getElementById("opcionesContainer");
    const btnComprobar = document.getElementById("botonComprobar");
    const barraProgreso = document.querySelector(".progreso");
    const divResultado = document.getElementById("resultado");

    // 5. Funciones del Juego
    function cargarPregunta() {
        divResultado.style.display = "none";
        btnComprobar.style.display = "none";
        seleccionUsuario = null;

        const p = preguntas[preguntaIndex];
        txtPregunta.textContent = p.texto;
        if(imgPregunta) imgPregunta.src = p.imagen;
        
        divOpciones.innerHTML = "";
        for (let key in p.opciones) {
            const btn = document.createElement("div");
            btn.classList.add("opcion");
            btn.innerHTML = `<strong>${key})</strong> ${p.opciones[key]}`;
            btn.onclick = () => seleccionar(btn, key);
            divOpciones.appendChild(btn);
        }
        actualizarBarra();
    }

    function seleccionar(btn, key) {
        document.querySelectorAll(".opcion").forEach(b => b.classList.remove("seleccionada"));
        btn.classList.add("seleccionada");
        seleccionUsuario = key;
        btnComprobar.style.display = "block";
    }

    btnComprobar.addEventListener('click', () => {
        const p = preguntas[preguntaIndex];
        const esCorrecta = seleccionUsuario === p.correcta;
        
        // Bloquear botones
        document.querySelectorAll(".opcion").forEach(b => b.style.pointerEvents = "none");
        
        // Mostrar feedback visual (verde/rojo) en los botones...
        // (Tu lógica visual de colores va aquí)

        if (esCorrecta) {
            aciertos++;
            mostrarFeedback(true);
        } else {
            mostrarFeedback(false, p.correcta, p.opciones[p.correcta]);
        }
    });

    function mostrarFeedback(esCorrecto, keyCorrecta, textoCorrecta) {
        divResultado.style.display = "flex";
        divResultado.className = `resultado ${esCorrecto ? 'correcto' : 'incorrecto'}`;
        
        if (esCorrecto) {
            divResultado.innerHTML = `<div>✅ ¡Correcto!</div><button id="btn-next">Siguiente</button>`;
        } else {
            divResultado.innerHTML = `<div>❌ Incorrecto. Era: ${keyCorrecta}) ${textoCorrecta}</div><button id="btn-next">Siguiente</button>`;
        }

        document.getElementById("btn-next").onclick = avanzar;
    }

    async function avanzar() {
        preguntaIndex++;
        if (preguntaIndex < preguntas.length) {
            cargarPregunta();
        } else {
            await finalizarNivel();
        }
    }

    function actualizarBarra() {
        const pct = ((preguntaIndex + 1) / preguntas.length) * 100;
        if(barraProgreso) barraProgreso.style.width = `${pct}%`;
    }

    // --- 6. CONEXIÓN CON EL BACKEND (LO IMPORTANTE) ---
    async function finalizarNivel() {
        divOpciones.innerHTML = "";
        txtPregunta.textContent = "Procesando resultados...";
        
        if (aciertos < 5) {
            mostrarPantallaFinal(false, "Necesitas 5/5 para avanzar.");
            return;
        }

        try {
            // A. Obtener datos actuales del usuario desde la BD
            const userData = await getUserData(sessionUser.id);
            
            // B. Preparar actualización
            let updatePayload = {};
            let mensaje = "¡Nivel Completado!";
            let monedasGanadas = 0;

            // Lógica de Niveles (asumiendo que user.level es el nivel actual del usuario)
            // Si el usuario está en el nivel 1 y acaba de pasar el quiz del nivel 1:
            if (nivelActual === userData.level) {
                updatePayload.level = userData.level + 1;
                updatePayload.coins = userData.coins + 20;
                monedasGanadas = 20;
                mensaje += " (+20 Monedas 🪙)";

                // Revisar Skins
                if (SKIN_REWARDS[updatePayload.level]) {
                    mensaje += " ¡Nueva Skin Desbloqueada!";
                    // Aquí podrías llamar a una API para desbloquear skin, 
                    // o dejar que el usuario la compre si esa es la lógica.
                }
            } else if (nivelActual < userData.level) {
                mensaje = "Repaso completado (Sin recompensa extra).";
            }

            // C. Guardar en el Servidor
            if (Object.keys(updatePayload).length > 0) {
                await updateUserData(sessionUser.id, updatePayload);
            }

            mostrarPantallaFinal(true, mensaje, monedasGanadas);

        } catch (error) {
            console.error(error);
            mostrarPantallaFinal(false, "Error de conexión al guardar progreso.");
        }
    }

    function mostrarPantallaFinal(exito, mensaje, monedas = 0) {
        const color = exito ? "correcto" : "incorrecto";
        divResultado.className = `resultado ${color}`;
        divResultado.style.display = "flex";
        divResultado.innerHTML = `
            <div style="text-align:center">
                <h2>${exito ? "🎉 ¡Felicidades!" : "😕 Intenta de nuevo"}</h2>
                <p>${aciertos}/${preguntas.length} Aciertos</p>
                <p>${mensaje}</p>
                <button onclick="window.location.href='/views/lecciones.html'">Volver al Menú</button>
            </div>
        `;
    }

    // Iniciar
    cargarPregunta();
});

import { preguntasPorNivel, SKIN_REWARDS } from '../data/preguntas.js';