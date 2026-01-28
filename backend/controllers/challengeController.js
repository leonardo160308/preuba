import db from '../config/db.js';
import User from '../models/UserModel.js';

// --- FUNCIÓN AUXILIAR: REGLAS DEL JUEGO ---
// Aquí es donde defines qué debe hacer el usuario para cumplir cada reto.
// --- FUNCIÓN AUXILIAR: REGLAS DEL JUEGO ---
const checkCompletionCriteria = async (userId, challengeId) => {
    try {
        // ==========================================
        // RETOS DE CANTIDAD DE MOVIMIENTOS
        // ==========================================
        if ([1, 2, 3, 6, 7, 8, 9, 10].includes(challengeId)) {
            const required = {
                1: 1, 2: 5, 3: 7, 6: 15, 7: 25, 8: 40, 9: 60, 10: 100
            };
            
            const [rows] = await db.execute(
                'SELECT COUNT(*) as count FROM movements WHERE user_id = ?', 
                [userId]
            );
            return rows[0].count >= required[challengeId];
        }

        // ==========================================
        // RETOS DE AHORRO
        // ==========================================
        // Reto 4: Primer ahorro
        if (challengeId === 4) {
            const [rows] = await db.execute(
                "SELECT COUNT(*) as count FROM movements WHERE user_id = ? AND tipo = 'income' AND categoria = 'Ahorro'",
                [userId]
            );
            return rows[0].count >= 1;
        }

        // Retos 11-13: Múltiples ahorros
        if ([11, 12, 13].includes(challengeId)) {
            const required = { 11: 3, 12: 5, 13: 10 };
            const [rows] = await db.execute(
                "SELECT COUNT(*) as count FROM movements WHERE user_id = ? AND tipo = 'income' AND categoria = 'Ahorro'",
                [userId]
            );
            return rows[0].count >= required[challengeId];
        }

        // Retos 14-15: Cantidad acumulada de ahorro en el mes
        if ([14, 15].includes(challengeId)) {
            const required = { 14: 500, 15: 1000 };
            const [rows] = await db.execute(
                `SELECT SUM(monto) as total FROM movements 
                 WHERE user_id = ? AND tipo = 'income' AND categoria = 'Ahorro' 
                 AND MONTH(fecha) = MONTH(CURRENT_DATE()) AND YEAR(fecha) = YEAR(CURRENT_DATE())`,
                [userId]
            );
            return (rows[0].total || 0) >= required[challengeId];
        }

        // ==========================================
        // RETO 5: BALANCE POSITIVO
        // ==========================================
        if (challengeId === 5) {
            const query = `
                SELECT 
                    SUM(CASE WHEN tipo = 'income' THEN monto ELSE 0 END) - 
                    SUM(CASE WHEN tipo = 'expense' THEN monto ELSE 0 END) as balance
                FROM movements 
                WHERE user_id = ? 
                AND MONTH(fecha) = MONTH(CURRENT_DATE()) 
                AND YEAR(fecha) = YEAR(CURRENT_DATE())
            `;
            const [rows] = await db.execute(query, [userId]);
            return (rows[0].balance || 0) > 0;
        }

        // ==========================================
        // RETOS DE CATEGORÍAS ESPECÍFICAS
        // ==========================================
        // Reto 16: Vivienda
        if (challengeId === 16) {
            const [rows] = await db.execute(
                "SELECT COUNT(*) as count FROM movements WHERE user_id = ? AND categoria LIKE '%Vivienda%'",
                [userId]
            );
            return rows[0].count >= 1;
        }

        // Reto 17: 5 gastos de alimentación
        if (challengeId === 17) {
            const [rows] = await db.execute(
                "SELECT COUNT(*) as count FROM movements WHERE user_id = ? AND categoria = 'Alimentación'",
                [userId]
            );
            return rows[0].count >= 5;
        }

        // Reto 18: 5 gastos de transporte
        if (challengeId === 18) {
            const [rows] = await db.execute(
                "SELECT COUNT(*) as count FROM movements WHERE user_id = ? AND categoria = 'Transporte'",
                [userId]
            );
            return rows[0].count >= 5;
        }

        // Reto 19: 3 gastos de servicios
        if (challengeId === 19) {
            const [rows] = await db.execute(
                "SELECT COUNT(*) as count FROM movements WHERE user_id = ? AND categoria = 'Servicios'",
                [userId]
            );
            return rows[0].count >= 3;
        }

        // Reto 20: 5 categorías diferentes
        if (challengeId === 20) {
            const [rows] = await db.execute(
                "SELECT COUNT(DISTINCT categoria) as count FROM movements WHERE user_id = ?",
                [userId]
            );
            return rows[0].count >= 5;
        }

        // ==========================================
        // RETOS DE INGRESOS
        // ==========================================
        // Reto 21: Primer salario
        if (challengeId === 21) {
            const [rows] = await db.execute(
                "SELECT COUNT(*) as count FROM movements WHERE user_id = ? AND tipo = 'income' AND categoria = 'Salario'",
                [userId]
            );
            return rows[0].count >= 1;
        }

        // Reto 22: Freelance o Ventas
        if (challengeId === 22) {
            const [rows] = await db.execute(
                "SELECT COUNT(*) as count FROM movements WHERE user_id = ? AND tipo = 'income' AND (categoria = 'Freelance' OR categoria = 'Ventas')",
                [userId]
            );
            return rows[0].count >= 1;
        }

        // Reto 23: Primera inversión
        if (challengeId === 23) {
            const [rows] = await db.execute(
                "SELECT COUNT(*) as count FROM movements WHERE user_id = ? AND categoria = 'Inversiones'",
                [userId]
            );
            return rows[0].count >= 1;
        }

        // Reto 24: 3 fuentes de ingreso
        if (challengeId === 24) {
            const [rows] = await db.execute(
                "SELECT COUNT(DISTINCT categoria) as count FROM movements WHERE user_id = ? AND tipo = 'income' AND categoria IN ('Salario', 'Freelance', 'Ventas', 'Inversiones')",
                [userId]
            );
            return rows[0].count >= 3;
        }

        // ==========================================
        // RETOS DE BALANCE
        // ==========================================
        if ([25, 26, 27, 28].includes(challengeId)) {
            const required = { 25: 0, 26: 100, 27: 500, 28: 1000 };
            const query = `
                SELECT 
                    SUM(CASE WHEN tipo = 'income' THEN monto ELSE 0 END) - 
                    SUM(CASE WHEN tipo = 'expense' THEN monto ELSE 0 END) as balance
                FROM movements 
                WHERE user_id = ? 
                AND MONTH(fecha) = MONTH(CURRENT_DATE()) 
                AND YEAR(fecha) = YEAR(CURRENT_DATE())
            `;
            const [rows] = await db.execute(query, [userId]);
            const balance = rows[0].balance || 0;
            
            if (challengeId === 25) return Math.abs(balance) < 10; // Exactamente 0 (tolerancia de $10)
            return balance >= required[challengeId];
        }

        // ==========================================
        // RETOS ESPECIALES
        // ==========================================
        // Reto 29: Educación
        if (challengeId === 29) {
            const [rows] = await db.execute(
                "SELECT COUNT(*) as count FROM movements WHERE user_id = ? AND categoria = 'Educación'",
                [userId]
            );
            return rows[0].count >= 1;
        }

        // Reto 30: Salud
        if (challengeId === 30) {
            const [rows] = await db.execute(
                "SELECT COUNT(*) as count FROM movements WHERE user_id = ? AND categoria = 'Salud'",
                [userId]
            );
            return rows[0].count >= 1;
        }

        // Por defecto (retos no implementados aún)
        return false;

    } catch (error) {
        console.error("Error validando criterio:", error);
        return false;
    }
};


// --- CONTROLADORES EXPORTADOS ---

// 1. GET: Obtener estado de los retos (Cuáles ya completó el usuario)
export const getChallenges = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Consultamos la tabla intermedia para ver qué ha reclamado este usuario
        const query = `
            SELECT challenge_id 
            FROM user_challenges 
            WHERE user_id = ? AND claimed = 1
        `;
        
        const [rows] = await db.execute(query, [userId]);
        
        // Convertimos la respuesta [{challenge_id: 1}, {challenge_id: 3}] a [1, 3]
        const completedIds = rows.map(row => row.challenge_id);

        res.json({ success: true, completedIds });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al obtener estado de retos.' });
    }
};


// 2. POST: Intentar completar un reto y recibir recompensa
export const claimChallenge = async (req, res) => {
    const { userId, challengeId } = req.body;
    let connection = null;

    try {
        // A. Obtener información del reto (cuánto paga) de la BD
        // Nota: Asumimos que los IDs de la BD coinciden con los del Frontend
        // Si no tienes los retos en BD, puedes usar un objeto estático aquí.
        const [challenges] = await db.execute('SELECT * FROM challenges WHERE id = ?', [challengeId]);
        
        // Si no existe en BD, usamos datos por defecto para que no falle tu prueba
        const challenge = challenges[0] || { 
            id: challengeId, 
            titulo: 'Reto Genérico', 
            reward_currency: 'wood', // Por defecto madera
            reward_amount: 10 
        };

        // B. Verificar si ya fue reclamado
        const [existing] = await db.execute(
            'SELECT claimed FROM user_challenges WHERE user_id = ? AND challenge_id = ?', 
            [userId, challengeId]
        );

        if (existing.length > 0 && existing[0].claimed) {
            return res.status(400).json({ success: false, message: '¡Ya reclamaste este reto anteriormente!' });
        }

        // C. VALIDAR SI CUMPLE LOS REQUISITOS (Lógica de Juego)
        const cumpleRequisitos = await checkCompletionCriteria(userId, parseInt(challengeId));

        if (!cumpleRequisitos) {
            return res.status(400).json({ 
                success: false, 
                message: 'Aún no cumples los requisitos de este reto. ¡Revisa tus movimientos!' 
            });
        }

        // D. INICIAR TRANSACCIÓN (Para asegurar que se den los recursos Y se marque completado al mismo tiempo)
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Actualizar recursos del usuario (Madera o Monedas)
        let updateQuery = '';
        if (challenge.reward_currency === 'wood') {
            updateQuery = 'UPDATE users SET wood = wood + ? WHERE id = ?';
        } else {
            updateQuery = 'UPDATE users SET coins = coins + ? WHERE id = ?';
        }
        
        await connection.execute(updateQuery, [challenge.reward_amount, userId]);

        // 2. Registrar el reto como completado
        await connection.execute(
            `INSERT INTO user_challenges (user_id, challenge_id, claimed, claimed_at) 
             VALUES (?, ?, 1, NOW()) 
             ON DUPLICATE KEY UPDATE claimed = 1, claimed_at = NOW()`,
            [userId, challengeId]
        );

        await connection.commit(); // Confirmar cambios

        // E. Obtener nuevos saldos para actualizar el Frontend
        const [updatedUser] = await db.execute('SELECT coins, wood FROM users WHERE id = ?', [userId]);

        res.json({ 
            success: true, 
            message: `¡Reto completado! Ganaste ${challenge.reward_amount} de ${challenge.reward_currency === 'wood' ? 'Madera 🪵' : 'Monedas 🪙'}.`,
            new_stats: updatedUser[0]
        });

    } catch (error) {
        if (connection) await connection.rollback(); // Deshacer cambios si hay error
        console.error("Error en completeChallenge:", error);
        res.status(500).json({ success: false, message: 'Error en el servidor.', error: error.message });
    } finally {
        if (connection) connection.release(); // Liberar conexión
    }
};