/* assets/js/pages/profile.js */

import { getUserData, upgradeItem, equipSkin } from '../modules/api.js';
import { protectRoute, getAuthData } from '../modules/auth.js';

document.addEventListener('DOMContentLoaded', async () => {

    // --- 0. SEGURIDAD ---
    if (!protectRoute()) return;
    const sessionUser = getAuthData(); // Obtenemos ID y Nombre de la sesión local
    const userId = sessionUser.id;

    // --- 1. CONFIGURACIÓN VISUAL (SE MANTIENE IGUAL) ---
    // (El backend maneja la lógica, pero el frontend necesita saber qué imagen mostrar)
    const MAX_LEVEL = 10;
    const COSTO_CASA_BASE = 20;   // Madera
    const COSTO_CASTOR_BASE = 34; // Monedas

    const DB_SKINS = {
<<<<<<< HEAD
        "skin_default": "../public/img/casaBase.png", // ⚠️ Ajusta la ruta ../assets/
        "skin_1": "../public/img/casaN1.png",
        "skin_2": "../public/img/casaN2.png",
        "skin_3": "../public/img/casaN3.png",
        "skin_4": "../public/img/casaN4.png",
        "skin_5": "../public/img/casaN5.png"
=======
        "skin_default": "../public/img/casaN1.jpg", // ⚠️ Ajusta la ruta ../assets/
        "skin_1": "../public/img/casaN1.jpg",
        "skin_2": "../public/img/casaN2.jpg",
        "skin_3": "../public/img/casaN3.jpg",
        "skin_4": "../public/img/casaN4.jpg",
        "skin_5": "../public/img/casaN5.jpg"
>>>>>>> 9e8dfbbdfd536ed98753e1a7218dbec436af0bcc
    };
    

    const SKIN_NAMES = {
        "skin_default": "Choza Inicial",
        "skin_1": "Casa Nivel 2",
        "skin_2": "Casa Nivel 4",
        "skin_3": "Casa Nivel 6",
        "skin_4": "Casa Nivel 8",
        "skin_5": "Mansión Nivel 10"
    };

    const DB_CASTORES = {
        "castor_default": "../public/img/mapacheBase.png",
<<<<<<< HEAD
        "castor_1": "../public/img/mapacheN1.png",
        "castor_2": "../public/img/mapacheN2.png",
        "castor_3": "../public/img/mapacheN3.png",
        "castor_4": "../public/img/mapacheN4.png",
        "castor_5": "../public/img/mapacheN5.png"
=======
        "castor_1": "../public/img/mapacheN1.jpg",
        "castor_2": "../public/img/mapacheN2.jpg",
        "castor_3": "../public/img/mapacheN3.jpg",
        "castor_4": "../public/img/mapacheN4.jpg",
        "castor_5": "../public/img/mapacheN5.jpg"
>>>>>>> 9e8dfbbdfd536ed98753e1a7218dbec436af0bcc
    };

    const CASTOR_NAMES = {
        "castor_default": "Castor Bebé",
        "castor_1": "Castor Aprendiz",
        "castor_2": "Castor Obrero",
        "castor_3": "Castor Ingeniero",
        "castor_4": "Castor Maestro",
        "castor_5": "Rey Castor"
    };

    // Reglas para saber qué mostramos en el carrusel basado en el nivel
    // (Nota: En una app más avanzada, el backend enviaría la lista de skins desbloqueadas, 
    // pero podemos calcularlas aquí basado en el nivel para simplificar)
    const UNLOCKS_CASA_LIST = ["skin_default", "skin_1", "skin_2", "skin_3", "skin_4", "skin_5"];
    const UNLOCKS_CASTOR_LIST = ["castor_default", "castor_1", "castor_2", "castor_3", "castor_4", "castor_5"];

    // --- 2. ESTADO LOCAL ---
    let currentUserData = null; // Aquí guardaremos lo que venga del servidor
    let idxCasa = 0;
    let idxCastor = 0;

    // --- 3. REFERENCIAS DOM ---
    const domMonedas = document.getElementById('coin-count');
    const domMadera = document.getElementById('wood-count');
    
    const lblHouseLevel = document.getElementById('lbl-house-level');
    const lblBeaverLevel = document.getElementById('lbl-beaver-level');

    const btnHouse = document.getElementById('btn-upgrade-house');
    const txtCostHouse = document.getElementById('cost-house');

    const btnBeaver = document.getElementById('btn-upgrade-beaver');
    const txtCostBeaver = document.getElementById('cost-beaver');

    const welcomeMsg = document.getElementById('welcome-msg');
    const userNameLbl = document.getElementById('user-name');

    // --- 4. CARGAR DATOS DEL SERVIDOR ---
    async function init() {
        try {
            currentUserData = await getUserData(userId);
            
            // Renderizar Textos Básicos
            if(welcomeMsg) welcomeMsg.textContent = `Hola, ${currentUserData.nombre}!`;
            if(userNameLbl) userNameLbl.textContent = currentUserData.nombre;

            actualizarUI();
            
            // Configurar los carruseles a la skin actual
            idxCasa = obtenerIndiceSkin(currentUserData.current_appearance, UNLOCKS_CASA_LIST);
            idxCastor = obtenerIndiceSkin(currentUserData.current_beaver, UNLOCKS_CASTOR_LIST);
            
            renderizarCasa();
            renderizarCastor();

        } catch (error) {
            console.error("Error cargando perfil:", error);
            alert("Error al cargar datos del servidor.");
        }
    }

    // --- 5. FUNCIONES DE UI ---

    function actualizarUI() {
        // Recursos
        domMonedas.textContent = currentUserData.coins;
        domMadera.textContent = currentUserData.wood;

        // Niveles (Usamos los nombres de campos de la BD: house_level, beaver_level)
        lblHouseLevel.textContent = currentUserData.house_level;
        lblBeaverLevel.textContent = currentUserData.beaver_level;

        // --- BOTÓN CASA ---
        txtCostHouse.textContent = COSTO_CASA_BASE;
        if (currentUserData.house_level >= MAX_LEVEL) {
            btnHouse.innerHTML = "¡Casa al Máximo! 🏠";
            btnHouse.disabled = true;
        } else if (currentUserData.wood < COSTO_CASA_BASE) {
            btnHouse.disabled = true; 
            btnHouse.title = "Necesitas más madera";
        } else {
            btnHouse.innerHTML = `Mejorar <br> <span id="cost-house">${COSTO_CASA_BASE}</span> 🪵`;
            btnHouse.disabled = false;
        }

        // --- BOTÓN CASTOR ---
        txtCostBeaver.textContent = COSTO_CASTOR_BASE;
        if (currentUserData.beaver_level >= MAX_LEVEL) {
            btnBeaver.innerHTML = "¡Castor al Máximo! 🦫";
            btnBeaver.disabled = true;
        } else if (currentUserData.coins < COSTO_CASTOR_BASE) {
            btnBeaver.disabled = true;
            btnBeaver.title = "Necesitas más monedas";
        } else {
            btnBeaver.innerHTML = `Entrenar <br> <span id="cost-beaver">${COSTO_CASTOR_BASE}</span> 🪙`;
            btnBeaver.disabled = false;
        }
    }

    // --- 6. LÓGICA DE MEJORAS (CONECTADA AL API) ---

    // Mejorar Casa
    btnHouse.addEventListener('click', async () => {
        try {
            // Llamamos al Backend. Él verifica si tienes dinero y resta.
            const result = await upgradeItem(userId, 'house');
            
            if (result.success) {
                // Actualizamos el estado local con la respuesta del servidor
                currentUserData.wood = result.new_stats.wood;
                currentUserData.house_level = result.new_stats.house_level;
                
                alert(result.message);
                actualizarUI();
                // Opcional: Mover el carrusel a la nueva skin si se desbloqueó una
            } else {
                alert(`❌ ${result.message}`);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión al mejorar casa.");
        }
    });

    // Mejorar Castor
    btnBeaver.addEventListener('click', async () => {
        try {
            const result = await upgradeItem(userId, 'beaver');
            
            if (result.success) {
                currentUserData.coins = result.new_stats.coins;
                currentUserData.beaver_level = result.new_stats.beaver_level;
                
                alert(result.message);
                actualizarUI();
            } else {
                alert(`❌ ${result.message}`);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión al entrenar castor.");
        }
    });


    // --- 7. VISORES Y EQUIPAR SKINS ---

    // Función auxiliar para calcular qué skins están desbloqueadas según el nivel
    function getSkinsDesbloqueadas(tipo) {
        // En tu lógica: Nivel 1 = Default. Nivel 2 = Skin 1. Nivel 4 = Skin 2...
        // Calculamos cuántas skins del array mostrar
        const nivel = (tipo === 'house') ? currentUserData.house_level : currentUserData.beaver_level;
        const listaCompleta = (tipo === 'house') ? UNLOCKS_CASA_LIST : UNLOCKS_CASTOR_LIST;
        
        // Lógica simple: Mostramos todas las skins cuyo índice * 2 sea menor al nivel
        // O simplemente filtramos las que el usuario ya debería tener.
        // Por simplicidad para el visor: Mostramos TODAS, pero el botón "Equipar" se bloquea si no tienes nivel.
        return listaCompleta; 
    }

    // Lógica del Visor Casa
    function renderizarCasa() {
        const listaSkins = getSkinsDesbloqueadas('house');
        const skinId = listaSkins[idxCasa];
        
        // Verificar si está desbloqueada (Regla: Nivel necesario)
        // Skin 0 (default) -> Nivel 1
        // Skin 1 -> Nivel 2
        // Skin 2 -> Nivel 4...
        const nivelRequerido = (idxCasa === 0) ? 1 : idxCasa * 2; 
        const estaDesbloqueada = currentUserData.house_level >= nivelRequerido;

        document.getElementById('house-img').src = DB_SKINS[skinId];
        
        // Mostrar candado o nombre
        const lblNombre = document.getElementById('house-name-lbl');
        if (estaDesbloqueada) {
            lblNombre.textContent = SKIN_NAMES[skinId];
            document.getElementById('house-img').style.filter = "none";
        } else {
            lblNombre.textContent = `🔒 Nivel ${nivelRequerido}`;
            document.getElementById('house-img').style.filter = "grayscale(100%)";
        }

        const btn = document.getElementById('btn-equip-house');
        const status = document.getElementById('house-status'); // El texto "Activo"

        if (skinId === currentUserData.current_appearance) {
            status.style.display = 'block';
            btn.textContent = "Equipado";
            btn.disabled = true;
            btn.style.background = "#4CAF50";
        } else {
            status.style.display = 'none';
            if (estaDesbloqueada) {
                btn.textContent = "Equipar";
                btn.disabled = false;
                btn.style.background = "#2c3e50";
                btn.onclick = () => equiparSkinAPI(skinId, 'house'); // ⬅️ Llamada API
            } else {
                btn.textContent = "Bloqueado";
                btn.disabled = true;
                btn.style.background = "#999";
            }
        }
    }

    // Lógica del Visor Castor (Idéntica a Casa)
    function renderizarCastor() {
        const listaSkins = getSkinsDesbloqueadas('beaver');
        const skinId = listaSkins[idxCastor];
        const nivelRequerido = (idxCastor === 0) ? 1 : idxCastor * 2; 
        const estaDesbloqueada = currentUserData.beaver_level >= nivelRequerido;

        document.getElementById('beaver-img').src = DB_CASTORES[skinId];
        
        const lblNombre = document.getElementById('beaver-name-lbl');
        if (estaDesbloqueada) {
            lblNombre.textContent = CASTOR_NAMES[skinId];
            document.getElementById('beaver-img').style.filter = "none";
        } else {
            lblNombre.textContent = `🔒 Nivel ${nivelRequerido}`;
            document.getElementById('beaver-img').style.filter = "grayscale(100%)";
        }

        const btn = document.getElementById('btn-equip-beaver');
        const status = document.getElementById('beaver-status');

        if (skinId === currentUserData.current_beaver) {
            status.style.display = 'block';
            btn.textContent = "Equipado";
            btn.disabled = true;
            btn.style.background = "#4CAF50";
        } else {
            status.style.display = 'none';
            if (estaDesbloqueada) {
                btn.textContent = "Equipar";
                btn.disabled = false;
                btn.style.background = "#2c3e50";
                btn.onclick = () => equiparSkinAPI(skinId, 'beaver'); // ⬅️ Llamada API
            } else {
                btn.textContent = "Bloqueado";
                btn.disabled = true;
                btn.style.background = "#999";
            }
        }
    }

    // --- 8. FUNCIÓN EQUIPAR (API) ---
    async function equiparSkinAPI(skinId, type) {
        try {
            const result = await equipSkin(userId, skinId, type);
            if (result.success) {
                // Actualizamos localmente
                if (type === 'house') currentUserData.current_appearance = skinId;
                if (type === 'beaver') currentUserData.current_beaver = skinId;
                
                alert("Apariencia actualizada.");
                renderizarCasa();
                renderizarCastor();
            }
        } catch (error) {
            console.error(error);
            alert("Error al equipar skin.");
        }
    }

    // Helpers
    function obtenerIndiceSkin(skinId, lista) {
        const idx = lista.indexOf(skinId);
        return idx === -1 ? 0 : idx;
    }

    // --- EVENT LISTENERS NAVEGACIÓN ---
    document.getElementById('btn-prev-house').onclick = () => { 
        if(idxCasa > 0) idxCasa--; renderizarCasa(); 
    };
    document.getElementById('btn-next-house').onclick = () => { 
        if(idxCasa < UNLOCKS_CASA_LIST.length - 1) idxCasa++; renderizarCasa(); 
    };

    document.getElementById('btn-prev-beaver').onclick = () => { 
        if(idxCastor > 0) idxCastor--; renderizarCastor(); 
    };
    document.getElementById('btn-next-beaver').onclick = () => { 
        if(idxCastor < UNLOCKS_CASTOR_LIST.length - 1) idxCastor++; renderizarCastor(); 
    };


    // INICIAR
    init();
});