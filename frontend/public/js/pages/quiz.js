import { updateUserData, getUserData } from '../modules/api.js';
import { protectRoute, getAuthData } from '../modules/auth.js';
import preguntasPorNivel from '../data/preguntas.js'; // ✅ CAMBIO AQUÍ
import { SKIN_REWARDS } from '../data/preguntas.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Seguridad
    if (!protectRoute()) return;
    const sessionUser = getAuthData();

    // 2. Detectar Nivel desde la URL (ej: quiz.html?level=1)
    const urlParams = new URLSearchParams(window.location.search);
    const nivelActual = parseInt(urlParams.get('level')) || 1;

    // 3. Variables de Estado
    const preguntas = preguntasPorNivel[nivelActual];
    
    if (!preguntas || preguntas.length === 0) {
        alert("Este nivel aún no tiene preguntas disponibles.");
        window.location.href = '/lecciones.html';
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
    const nivelLabel = document.getElementById("nivel-actual");
    const preguntaActualLabel = document.getElementById("pregunta-actual");
    const totalPreguntasLabel = document.getElementById("total-preguntas");

    // Actualizar labels
    if (nivelLabel) nivelLabel.textContent = nivelActual;
    if (totalPreguntasLabel) totalPreguntasLabel.textContent = preguntas.length;

    // 5. Funciones del Juego
    function cargarPregunta() {
        divResultado.style.display = "none";
        btnComprobar.style.display = "none";
        seleccionUsuario = null;

        const p = preguntas[preguntaIndex];
        txtPregunta.textContent = p.texto;
        if (imgPregunta) imgPregunta.src = p.imagen;
        
        // Actualizar contador
        if (preguntaActualLabel) preguntaActualLabel.textContent = preguntaIndex + 1;

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
        
        // Bloquear opciones
        document.querySelectorAll(".opcion").forEach(b => b.style.pointerEvents = "none");
        
        // Marcar correcta en verde
        document.querySelectorAll(".opcion").forEach(b => {
            const letra = b.textContent.trim()[0];
            if (letra === p.correcta) {
                b.classList.add("correcta");
            } else if (letra === seleccionUsuario && !esCorrecta) {
                b.classList.add("incorrecta");
            }
        });

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
            divResultado.innerHTML = `<div>❌ Incorrecto. La respuesta correcta era: ${keyCorrecta}) ${textoCorrecta}</div><button id="btn-next">Siguiente</button>`;
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
        if (barraProgreso) barraProgreso.style.width = `${pct}%`;
    }

    // --- 6. CONEXIÓN CON EL BACKEND ---
    async function finalizarNivel() {
        divOpciones.innerHTML = "";
        txtPregunta.textContent = "Procesando resultados...";
        
        const porcentaje = (aciertos / preguntas.length) * 100;
        const aprobado = porcentaje >= 80; // 80% para aprobar

        if (!aprobado) {
            mostrarPantallaFinal(false, `Necesitas al menos ${Math.ceil(preguntas.length * 0.8)} correctas de ${preguntas.length} para avanzar.`);
            return;
        }

        try {
            const userData = await getUserData(sessionUser.id);
            
            let updatePayload = {};
            let mensaje = "¡Nivel Completado!";
            let monedasGanadas = 0;

            if (nivelActual === userData.level) {
                updatePayload.level = userData.level + 1;
                updatePayload.coins = userData.coins + 20;
                monedasGanadas = 20;
                mensaje += " (+20 Monedas 🪙)";

                if (SKIN_REWARDS[updatePayload.level]) {
                    mensaje += " ¡Nueva Skin Desbloqueada!";
                }
            } else if (nivelActual < userData.level) {
                mensaje = "Repaso completado (Sin recompensa extra).";
            }

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
        const modal = document.getElementById('modal-final');
        const icono = document.getElementById('modal-icono');
        const titulo = document.getElementById('modal-titulo');
        const puntaje = document.getElementById('modal-puntaje');
        const recompensa = document.getElementById('modal-recompensa');
        const mensajeEl = document.getElementById('modal-mensaje');
        const btnReintentar = document.getElementById('btn-reintentar');

        if (exito) {
            icono.textContent = "🎉";
            titulo.textContent = "¡Felicidades!";
            titulo.style.color = "#27ae60";
            recompensa.innerHTML = `<strong>+${monedas} Monedas 🪙</strong>`;
            btnReintentar.style.display = 'none';
        } else {
            icono.textContent = "😕";
            titulo.textContent = "Intenta de nuevo";
            titulo.style.color = "#c62828";
            recompensa.style.display = 'none';
            btnReintentar.style.display = 'inline-block';
            btnReintentar.onclick = () => window.location.reload();
        }

        puntaje.textContent = `${aciertos} / ${preguntas.length} Aciertos (${Math.round((aciertos/preguntas.length)*100)}%)`;
        mensajeEl.textContent = mensaje;
        modal.style.display = 'flex';
    }

    // Iniciar
    cargarPregunta();
});