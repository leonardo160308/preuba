// frontend/public/js/pages/quiz.js
import { updateUserData, getUserData } from '../modules/api.js';
import { protectRoute, getAuthData } from '../modules/auth.js';
import { SKIN_REWARDS } from '../data/preguntas.js';

const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
    if (!protectRoute()) return;
    const sessionUser = getAuthData();

    const urlParams = new URLSearchParams(window.location.search);
    const nivelActual = parseInt(urlParams.get('level')) || 1;

    let preguntas = [];

    // ── Cargar preguntas desde la BD ──────────────────────────────────────
    try {
        const response = await fetch(`${API_URL}/admin/questions/${nivelActual}`);

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success || data.data.length === 0) {
            alert('Este nivel no tiene preguntas. Volviendo...');
            window.location.href = '/lecciones.html';
            return;
        }

        preguntas = data.data;
    } catch (error) {
        console.error('❌ Error cargando preguntas:', error);
        alert('Error de conexión. Intenta de nuevo.');
        return;
    }

    let preguntaIndex = 0;
    let aciertos = 0;
    let seleccionUsuario = null;

    // ── FIX: bandera para saber si la pregunta ya fue evaluada ────────────
    let preguntaYaEvaluada = false;

    // Referencias DOM
    const txtPregunta       = document.getElementById('textoPregunta');
    const imgPregunta       = document.getElementById('imagenPregunta');
    const divOpciones       = document.getElementById('opcionesContainer');
    const btnComprobar      = document.getElementById('botonComprobar');
    const barraProgreso     = document.querySelector('.progreso');
    const divResultado      = document.getElementById('resultado');
    const nivelLabel        = document.getElementById('nivel-actual');
    const preguntaActualLbl = document.getElementById('pregunta-actual');
    const totalPreguntasLbl = document.getElementById('total-preguntas');

    if (nivelLabel)        nivelLabel.textContent        = nivelActual;
    if (totalPreguntasLbl) totalPreguntasLbl.textContent = preguntas.length;

    // ── Cargar pregunta ───────────────────────────────────────────────────
    function cargarPregunta() {
        divResultado.style.display = 'none';
        btnComprobar.style.display = 'none';
        seleccionUsuario   = null;

        // ── FIX: resetear bandera en cada nueva pregunta ──────────────────
        preguntaYaEvaluada = false;
        btnComprobar.disabled = false;

        const p = preguntas[preguntaIndex];
        txtPregunta.textContent = p.pregunta;

        if (imgPregunta && p.imagen) {
            imgPregunta.src          = p.imagen;
            imgPregunta.style.display = 'block';
        } else if (imgPregunta) {
            imgPregunta.style.display = 'none';
        }

        if (preguntaActualLbl) preguntaActualLbl.textContent = preguntaIndex + 1;

        divOpciones.innerHTML = '';
        for (const key in p.opciones) {
            const btn = document.createElement('div');
            btn.classList.add('opcion');
            btn.innerHTML = `<strong>${key})</strong> ${p.opciones[key]}`;
            btn.onclick = () => seleccionar(btn, key);
            divOpciones.appendChild(btn);
        }

        actualizarBarra();
    }

    // ── Seleccionar opción ────────────────────────────────────────────────
    function seleccionar(btn, key) {
        // ── FIX: no permitir cambiar opción si ya se evaluó ───────────────
        if (preguntaYaEvaluada) return;

        document.querySelectorAll('.opcion').forEach(b => b.classList.remove('seleccionada'));
        btn.classList.add('seleccionada');
        seleccionUsuario = key;
        btnComprobar.style.display = 'block';
    }

    // ── Comprobar respuesta ───────────────────────────────────────────────
    btnComprobar.addEventListener('click', () => {
        // ── FIX PRINCIPAL: si ya se evaluó, ignorar el clic ───────────────
        if (preguntaYaEvaluada) return;
        if (!seleccionUsuario)  return;

        // ── FIX: marcar como evaluada Y deshabilitar el botón ─────────────
        preguntaYaEvaluada    = true;
        btnComprobar.disabled = true;

        const p         = preguntas[preguntaIndex];
        const esCorrecta = seleccionUsuario === p.correcta;

        // Bloquear opciones para que no se pueda cambiar la selección
        document.querySelectorAll('.opcion').forEach(b => b.style.pointerEvents = 'none');

        // Marcar opciones visualmente
        document.querySelectorAll('.opcion').forEach(b => {
            const letra = b.querySelector('strong').textContent.replace(')', '').trim();
            if (letra === p.correcta) {
                b.classList.add('correcta');
            } else if (letra === seleccionUsuario && !esCorrecta) {
                b.classList.add('incorrecta');
            }
        });

        if (esCorrecta) {
            aciertos++;
            mostrarFeedback(true);
        } else {
            mostrarFeedback(false, p.correcta, p.opciones[p.correcta]);
        }
    });

    // ── Mostrar feedback ──────────────────────────────────────────────────
    function mostrarFeedback(esCorrecto, keyCorrecta, textoCorrecta) {
        divResultado.style.display = 'flex';
        divResultado.className     = `resultado ${esCorrecto ? 'correcto' : 'incorrecto'}`;

        divResultado.innerHTML = `
            <div>
                ${esCorrecto
                    ? '✅ ¡Correcto!'
                    : `❌ Incorrecto. La correcta era: ${keyCorrecta}) ${textoCorrecta}`
                }
            </div>
            <button id="btn-next">Siguiente →</button>
        `;

        document.getElementById('btn-next').onclick = avanzar;
    }

    // ── Avanzar a la siguiente pregunta ───────────────────────────────────
    async function avanzar() {
        preguntaIndex++;
        if (preguntaIndex < preguntas.length) {
            cargarPregunta();
        } else {
            await finalizarNivel();
        }
    }

    // ── Barra de progreso ─────────────────────────────────────────────────
    function actualizarBarra() {
        if (!barraProgreso) return;
        const pct = ((preguntaIndex + 1) / preguntas.length) * 100;
        barraProgreso.style.width = `${pct}%`;
    }

    // ── Finalizar nivel ───────────────────────────────────────────────────
    async function finalizarNivel() {
        divOpciones.innerHTML    = '';
        txtPregunta.textContent  = 'Procesando resultados...';

        const porcentaje = (aciertos / preguntas.length) * 100;
        const aprobado   = porcentaje >= 80;

        if (!aprobado) {
            mostrarPantallaFinal(
                false,
                `Necesitas al menos ${Math.ceil(preguntas.length * 0.8)} aciertos para aprobar.`
            );
            return;
        }

        try {
            const userData = await getUserData(sessionUser.id);

            let updatePayload = {};
            let mensaje       = '¡Nivel Completado!';
            let monedasGanadas = 0;

            if (nivelActual === userData.level) {
                updatePayload.level  = userData.level + 1;
                updatePayload.coins  = userData.coins + 20;
                monedasGanadas       = 20;
                mensaje             += ' (+20 Monedas 🪙)';

                if (SKIN_REWARDS[updatePayload.level]) {
                    mensaje += ' ¡Nueva Skin Desbloqueada!';
                }
            } else {
                mensaje = 'Repaso completado (sin recompensa extra).';
            }

            if (Object.keys(updatePayload).length > 0) {
                await updateUserData(sessionUser.id, updatePayload);
            }

            mostrarPantallaFinal(true, mensaje, monedasGanadas);

        } catch (err) {
            console.error(err);
            mostrarPantallaFinal(false, 'Error al guardar progreso.');
        }
    }

    // ── Pantalla final ────────────────────────────────────────────────────
    function mostrarPantallaFinal(exito, mensaje, monedas = 0) {
        divResultado.style.display = 'flex';
        divResultado.className     = `resultado ${exito ? 'correcto' : 'incorrecto'}`;

        divResultado.innerHTML = `
            <div style="text-align:center">
                <h2>${exito ? '¡Felicidades!' : 'Intenta de nuevo'}</h2>
                <p style="font-size:1.3rem;margin:12px 0;">
                    ${aciertos}/${preguntas.length} Aciertos
                </p>
                <p>${mensaje}</p>
                <button 
                    onclick="window.location.href='/lecciones.html'"
                    style="margin-top:20px;padding:12px 28px;background:#2C405B;
                           color:white;border:none;border-radius:30px;
                           font-weight:800;font-size:1rem;cursor:pointer;">
                    Volver al Menú
                </button>
                ${!exito ? `
                <button 
                    onclick="window.location.reload()"
                    style="margin-top:10px;padding:12px 28px;background:#6585AA;
                           color:white;border:none;border-radius:30px;
                           font-weight:800;font-size:1rem;cursor:pointer;">
                    🔄 Reintentar
                </button>` : ''}
            </div>
        `;
    }

    // ── Iniciar ───────────────────────────────────────────────────────────
    cargarPregunta();
});