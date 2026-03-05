import { supabase } from '../config/supabase.js';
import User from '../models/UserModel.js';

// Obtener el inicio y fin del mes actual en formato ISO
const getMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    return { start, end };
};

// ==========================================
// FUNCIÓN AUXILIAR: REGLAS DEL JUEGO
// ==========================================
const checkCompletionCriteria = async (userId, challengeId) => {
    try {
        // Traer todos los movimientos del usuario (para cálculos en JS)
        const { data: allMovements } = await supabase
            .from('movements')
            .select('*')
            .eq('user_id', userId);

        const movements = allMovements || [];
        const { start, end } = getMonthRange();

        // Movimientos del mes actual
        const monthMovements = movements.filter(m => m.fecha >= start && m.fecha <= end);

        // ==========================================
        // RETOS DE CANTIDAD DE MOVIMIENTOS TOTALES
        // ==========================================
        if ([1, 2, 3, 6, 7, 8, 9, 10].includes(challengeId)) {
            const required = { 1: 1, 2: 5, 3: 7, 6: 15, 7: 25, 8: 40, 9: 60, 10: 100 };
            return movements.length >= required[challengeId];
        }

        // ==========================================
        // RETO 4: Primer ahorro
        // ==========================================
        if (challengeId === 4) {
            return movements.filter(m => m.tipo === 'income' && m.categoria === 'Ahorro').length >= 1;
        }

        // RETOS 11-13: Múltiples ahorros
        if ([11, 12, 13].includes(challengeId)) {
            const required = { 11: 3, 12: 5, 13: 10 };
            return movements.filter(m => m.tipo === 'income' && m.categoria === 'Ahorro').length >= required[challengeId];
        }

        // RETOS 14-15: Ahorro acumulado en el mes
        if ([14, 15].includes(challengeId)) {
            const required = { 14: 500, 15: 1000 };
            const total = monthMovements
                .filter(m => m.tipo === 'income' && m.categoria === 'Ahorro')
                .reduce((sum, m) => sum + parseFloat(m.monto), 0);
            return total >= required[challengeId];
        }

        // ==========================================
        // RETO 5: BALANCE POSITIVO EN EL MES
        // ==========================================
        if (challengeId === 5) {
            const balance = monthMovements.reduce((sum, m) => {
                const monto = parseFloat(m.monto);
                return m.tipo === 'income' ? sum + monto : sum - monto;
            }, 0);
            return balance > 0;
        }

        // ==========================================
        // RETOS DE CATEGORÍAS ESPECÍFICAS
        // ==========================================
        if (challengeId === 16) {
            return movements.filter(m => m.categoria && m.categoria.includes('Vivienda')).length >= 1;
        }
        if (challengeId === 17) {
            return movements.filter(m => m.categoria === 'Alimentación').length >= 5;
        }
        if (challengeId === 18) {
            return movements.filter(m => m.categoria === 'Transporte').length >= 5;
        }
        if (challengeId === 19) {
            return movements.filter(m => m.categoria === 'Servicios').length >= 3;
        }
        if (challengeId === 20) {
            const categorias = new Set(movements.map(m => m.categoria).filter(Boolean));
            return categorias.size >= 5;
        }

        // ==========================================
        // RETOS DE INGRESOS
        // ==========================================
        if (challengeId === 21) {
            return movements.filter(m => m.tipo === 'income' && m.categoria === 'Salario').length >= 1;
        }
        if (challengeId === 22) {
            return movements.filter(m => m.tipo === 'income' && ['Freelance', 'Ventas'].includes(m.categoria)).length >= 1;
        }
        if (challengeId === 23) {
            return movements.filter(m => m.categoria === 'Inversiones').length >= 1;
        }
        if (challengeId === 24) {
            const fuentes = new Set(
                movements
                    .filter(m => m.tipo === 'income' && ['Salario', 'Freelance', 'Ventas', 'Inversiones'].includes(m.categoria))
                    .map(m => m.categoria)
            );
            return fuentes.size >= 3;
        }

        // ==========================================
        // RETOS DE BALANCE
        // ==========================================
        if ([25, 26, 27, 28].includes(challengeId)) {
            const required = { 25: 0, 26: 100, 27: 500, 28: 1000 };
            const balance = monthMovements.reduce((sum, m) => {
                const monto = parseFloat(m.monto);
                return m.tipo === 'income' ? sum + monto : sum - monto;
            }, 0);

            if (challengeId === 25) return Math.abs(balance) < 10;
            return balance >= required[challengeId];
        }

        // ==========================================
        // RETOS ESPECIALES
        // ==========================================
        if (challengeId === 29) {
            return movements.filter(m => m.categoria === 'Educación').length >= 1;
        }
        if (challengeId === 30) {
            return movements.filter(m => m.categoria === 'Salud').length >= 1;
        }

        return false;

    } catch (error) {
        console.error('Error validando criterio:', error);
        return false;
    }
};

// ==========================================
// 1. GET: Obtener retos completados del usuario
// ==========================================
export const getChallenges = async (req, res) => {
    try {
        const userId = req.params.userId;

        const { data, error } = await supabase
            .from('user_challenges')
            .select('challenge_id')
            .eq('user_id', userId)
            .eq('claimed', true);

        if (error) throw error;

        const completedIds = (data || []).map(row => row.challenge_id);
        res.json({ success: true, completedIds });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al obtener estado de retos.' });
    }
};

// ==========================================
// 2. POST: Reclamar un reto
// ==========================================
export const claimChallenge = async (req, res) => {
    const { userId, challengeId } = req.body;

    try {
        // Info del reto (puedes tener una tabla "challenges" o usar valores por defecto)
        const challenge = {
            id: challengeId,
            reward_currency: 'wood',
            reward_amount: 10
        };

        // Verificar si ya fue reclamado
        const { data: existing } = await supabase
            .from('user_challenges')
            .select('claimed')
            .eq('user_id', userId)
            .eq('challenge_id', challengeId)
            .single();

        if (existing && existing.claimed) {
            return res.status(400).json({ success: false, message: '¡Ya reclamaste este reto anteriormente!' });
        }

        // Validar requisitos
        const cumpleRequisitos = await checkCompletionCriteria(userId, parseInt(challengeId));

        if (!cumpleRequisitos) {
            return res.status(400).json({
                success: false,
                message: 'Aún no cumples los requisitos de este reto. ¡Revisa tus movimientos!'
            });
        }

        // Actualizar recursos del usuario
        const user = await User.findById(userId);
        let updateData = {};

        if (challenge.reward_currency === 'wood') {
            updateData.wood = (user.wood || 0) + challenge.reward_amount;
        } else {
            updateData.coins = (user.coins || 0) + challenge.reward_amount;
        }

        const { error: userError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId);

        if (userError) throw userError;

        // Registrar reto como completado (upsert)
        const { error: challengeError } = await supabase
            .from('user_challenges')
            .upsert({
                user_id: userId,
                challenge_id: challengeId,
                claimed: true,
                claimed_at: new Date().toISOString()
            }, { onConflict: 'user_id,challenge_id' });

        if (challengeError) throw challengeError;

        // Obtener nuevos saldos
        const updatedUser = await User.findById(userId);

        res.json({
            success: true,
            message: `¡Reto completado! Ganaste ${challenge.reward_amount} de ${challenge.reward_currency === 'wood' ? 'Madera 🪵' : 'Monedas 🪙'}.`,
            new_stats: { coins: updatedUser.coins, wood: updatedUser.wood }
        });

    } catch (error) {
        console.error('Error en claimChallenge:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor.', error: error.message });
    }
};