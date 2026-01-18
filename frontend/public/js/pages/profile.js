/* assets/js/pages/profile.js */

import { getUserData, upgradeItem, equipSkin, deleteUser } from '../modules/api.js';
import { protectRoute, getAuthData, logout } from '../modules/auth.js';
import { alertaConfirmacion, alertaExito, alertaError } from '../modules/alerts.js';

document.addEventListener('DOMContentLoaded', async () => {

    // --- 0. SEGURIDAD ---
    if (!protectRoute()) return;
    const sessionUser = getAuthData();
    const userId = sessionUser.id;

    // --- 1. CONFIGURACIÓN VISUAL ---
    const MAX_LEVEL = 10;
    const COSTO_CASA_BASE = 20;
    const COSTO_CASTOR_BASE = 34;

    const DB_SKINS = {
        "skin_default": "../public/img/casaBase.png",
        "skin_1": "../public/img/casaN1.png",
        "skin_2": "../public/img/casaN2.png",
        "skin_3": "../public/img/casaN3.png",
        "skin_4": "../public/img/casaN4.png",
        "skin_5": "../public/img/casaN5.png"
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
        "castor_1": "../public/img/mapacheN1.png",
        "castor_2": "../public/img/mapacheN2.png",
        "castor_3": "../public/img/mapacheN3.png",
        "castor_4": "../public/img/mapacheN4.png",
        "castor_5": "../public/img/mapacheN5.png"
    };

    const CASTOR_NAMES = {
        "castor_default": "Castor Bebé",
        "castor_1": "Castor Aprendiz",
        "castor_2": "Castor Obrero",
        "castor_3": "Castor Ingeniero",
        "castor_4": "Castor Maestro",
        "castor_5": "Rey Castor"
    };

    const UNLOCKS_CASA_LIST = ["skin_default", "skin_1", "skin_2", "skin_3", "skin_4", "skin_5"];
    const UNLOCKS_CASTOR_LIST = ["castor_default", "castor_1", "castor_2", "castor_3", "castor_4", "castor_5"];

    // --- 2. ESTADO LOCAL ---
    let currentUserData = null;
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
    const userAvatar = document.getElementById('user-avatar');
    const btnChangeAvatar = document.getElementById('btn-change-avatar');
    const avatarModal = document.getElementById('avatar-modal');
    const closeAvatarModal = document.getElementById('close-avatar-modal');
    const btnConfirmAvatar = document.getElementById('btn-confirm-avatar');
    const btnDeleteAccount = document.getElementById('btn-delete-account');

    let selectedAvatar = null;

    // --- 4. CARGAR DATOS DEL SERVIDOR ---
    async function init() {
        console.log('🚀 Iniciando perfil... UserID:', userId);
        
        try {
            currentUserData = await getUserData(userId);
            console.log('✅ Datos cargados:', currentUserData);
            
            if(welcomeMsg) welcomeMsg.textContent = `Hola, ${currentUserData.nombre}!`;
            if(userNameLbl) userNameLbl.textContent = currentUserData.nombre;
            
            if(userAvatar && currentUserData.foto) {
                userAvatar.src = `/public/img/avatars/${currentUserData.foto}.png`;
            }

            actualizarUI();
            
            idxCasa = obtenerIndiceSkin(currentUserData.current_appearance, UNLOCKS_CASA_LIST);
            idxCastor = obtenerIndiceSkin(currentUserData.current_beaver, UNLOCKS_CASTOR_LIST);
            
            renderizarCasa();
            renderizarCastor();

        } catch (error) {
            console.error("💥 Error:", error);
            alert("Error al cargar datos del servidor.");
        }
    }

    // --- 5. ACTUALIZAR UI ---
    function actualizarUI() {
        console.log('🎨 Actualizando UI...');
        console.log('💰 Coins:', currentUserData.coins, '🪵 Wood:', currentUserData.wood);
        
        domMonedas.textContent = currentUserData.coins || 0;
        domMadera.textContent = currentUserData.wood || 0;
        lblHouseLevel.textContent = currentUserData.house_level || 1;
        lblBeaverLevel.textContent = currentUserData.beaver_level || 1;

        // BOTÓN CASA
        if (txtCostHouse) txtCostHouse.textContent = COSTO_CASA_BASE;
        
        console.log('🏠 Casa:', {
            nivel: currentUserData.house_level,
            madera: currentUserData.wood,
            necesita: COSTO_CASA_BASE
        });
        
        if (currentUserData.house_level >= MAX_LEVEL) {
            btnHouse.textContent = "¡Casa al Máximo! 🏠";
            btnHouse.disabled = true;
        } else if (currentUserData.wood < COSTO_CASA_BASE) {
            console.log('❌ NO HAY SUFICIENTE MADERA');
            btnHouse.disabled = true;
            btnHouse.title = `Necesitas ${COSTO_CASA_BASE} madera (tienes ${currentUserData.wood})`;
        } else {
            console.log('✅ BOTÓN CASA HABILITADO');
            btnHouse.disabled = false;
            btnHouse.title = "";
        }

        // BOTÓN CASTOR
        if (txtCostBeaver) txtCostBeaver.textContent = COSTO_CASTOR_BASE;
        
        console.log('🦫 Castor:', {
            nivel: currentUserData.beaver_level,
            monedas: currentUserData.coins,
            necesita: COSTO_CASTOR_BASE
        });
        
        if (currentUserData.beaver_level >= MAX_LEVEL) {
            btnBeaver.textContent = "¡Castor al Máximo! 🦫";
            btnBeaver.disabled = true;
        } else if (currentUserData.coins < COSTO_CASTOR_BASE) {
            console.log('❌ NO HAY SUFICIENTES MONEDAS');
            btnBeaver.disabled = true;
            btnBeaver.title = `Necesitas ${COSTO_CASTOR_BASE} monedas (tienes ${currentUserData.coins})`;
        } else {
            console.log('✅ BOTÓN CASTOR HABILITADO');
            btnBeaver.disabled = false;
            btnBeaver.title = "";
        }
    }

    // --- 6. MEJORAS ---
    btnHouse.addEventListener('click', async () => {
        if (btnHouse.disabled) {
            alert(`Necesitas ${COSTO_CASA_BASE} madera. Tienes: ${currentUserData.wood}`);
            return;
        }
        
        try {
            const result = await upgradeItem(userId, 'house');
            if (result.success) {
                currentUserData.wood = result.new_stats.wood;
                currentUserData.house_level = result.new_stats.house_level;
                alert(result.message);
                actualizarUI();
            } else {
                alert(`❌ ${result.message}`);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión al mejorar casa.");
        }
    });

    btnBeaver.addEventListener('click', async () => {
        if (btnBeaver.disabled) {
            alert(`Necesitas ${COSTO_CASTOR_BASE} monedas. Tienes: ${currentUserData.coins}`);
            return;
        }
        
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

    // --- 7. VISORES ---
    function getSkinsDesbloqueadas(tipo) {
        return (tipo === 'house') ? UNLOCKS_CASA_LIST : UNLOCKS_CASTOR_LIST;
    }

    function renderizarCasa() {
        const listaSkins = getSkinsDesbloqueadas('house');
        const skinId = listaSkins[idxCasa];
        const nivelRequerido = (idxCasa === 0) ? 1 : idxCasa * 2;
        const estaDesbloqueada = currentUserData.house_level >= nivelRequerido;

        document.getElementById('house-img').src = DB_SKINS[skinId];
        
        const lblNombre = document.getElementById('house-name-lbl');
        if (estaDesbloqueada) {
            lblNombre.textContent = SKIN_NAMES[skinId];
            document.getElementById('house-img').style.filter = "none";
        } else {
            lblNombre.textContent = `🔒 Nivel ${nivelRequerido}`;
            document.getElementById('house-img').style.filter = "grayscale(100%)";
        }

        const btn = document.getElementById('btn-equip-house');
        const status = document.getElementById('house-status');

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
                btn.onclick = () => equiparSkinAPI(skinId, 'house');
            } else {
                btn.textContent = "Bloqueado";
                btn.disabled = true;
                btn.style.background = "#999";
            }
        }
    }

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
                btn.onclick = () => equiparSkinAPI(skinId, 'beaver');
            } else {
                btn.textContent = "Bloqueado";
                btn.disabled = true;
                btn.style.background = "#999";
            }
        }
    }

    async function equiparSkinAPI(skinId, type) {
        try {
            const result = await equipSkin(userId, skinId, type);
            if (result.success) {
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

    function obtenerIndiceSkin(skinId, lista) {
        const idx = lista.indexOf(skinId);
        return idx === -1 ? 0 : idx;
    }

    // --- NAVEGACIÓN ---
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

    // --- ELIMINAR CUENTA ---
// FRAGMENTO PARA ACTUALIZAR EN profile.js
// Reemplaza la sección de eliminación de cuenta


// --- ELIMINAR CUENTA (CON ALERTA DE CONFIRMACIÓN) ---
if (btnDeleteAccount) {
    btnDeleteAccount.onclick = async () => {
        // ✅ Primera confirmación con alerta visual
        const confirmado1 = await alertaConfirmacion(
            '¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.',
            '⚠️ Eliminar Cuenta'
        );
        
        if (!confirmado1) return;
        
        // ✅ Segunda confirmación para mayor seguridad
        const confirmado2 = await alertaConfirmacion(
            '🛑 ÚLTIMA ADVERTENCIA: Todos tus datos se perderán permanentemente. ¿Continuar?',
            'Confirmación Final'
        );
        
        if (!confirmado2) return;

        try {
            btnDeleteAccount.disabled = true;
            btnDeleteAccount.textContent = 'Eliminando...';
            
            const result = await deleteUser(userId);
            
            if (result.success) {
                // ✅ Éxito con redirección
                alertaExito('Cuenta eliminada exitosamente. Redirigiendo...', {
                    duration: 2000,
                    onClose: () => logout()
                });
                
                setTimeout(() => logout(), 2000);
                
            } else {
                alertaError('Error: ' + result.message); // ✅ Error del servidor
                btnDeleteAccount.disabled = false;
                btnDeleteAccount.textContent = '🗑️ Eliminar Cuenta';
            }
        } catch (error) {
            console.error(error);
            alertaError('Error de conexión al intentar eliminar la cuenta.'); // ✅ Error de red
            btnDeleteAccount.disabled = false;
            btnDeleteAccount.textContent = '🗑️ Eliminar Cuenta';
        }
    };
}

    // --- AVATAR ---
    if (btnChangeAvatar) {
        btnChangeAvatar.onclick = () => avatarModal.style.display = 'flex';
    }
    if (closeAvatarModal) {
        closeAvatarModal.onclick = () => avatarModal.style.display = 'none';
    }

    document.querySelectorAll('.avatar-option').forEach(option => {
        option.onclick = () => {
            document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            selectedAvatar = option.dataset.avatar;
        };
    });

    if(btnConfirmAvatar) {
        btnConfirmAvatar.onclick = async () => {
            if(!selectedAvatar) return alert('Selecciona un avatar primero');

            try {
                btnConfirmAvatar.disabled = true;
                btnConfirmAvatar.textContent = 'Guardando...';
                const result = await equipSkin(userId, selectedAvatar, 'avatar');
                
                if(result.success) {
                    currentUserData.foto = selectedAvatar;
                    userAvatar.src = `/public/img/avatars/${selectedAvatar}.png`;
                    avatarModal.style.display = 'none';
                    alert('¡Avatar actualizado!');
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                console.error(error);
                alert('Error de conexión');
            } finally {
                btnConfirmAvatar.disabled = false;
                btnConfirmAvatar.textContent = 'Guardar Avatar';
            }
        };
    }

    init();
});