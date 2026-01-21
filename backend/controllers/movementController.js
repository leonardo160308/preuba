import Movement from '../models/MovementModel.js';
import User from '../models/UserModel.js';

// --- C: CREATE MOVEMENT (CON VALIDACIONES + BALANCE DASHBOARD) ---
export const createMovement = async (req, res) => {
    try {
        const { user_id, fecha, tipo, categoria, monto, descripcion } = req.body;

        // 1. Validaciones básicas
        if (
            !user_id ||
            !fecha ||
            !tipo ||
            !monto ||
            (tipo !== 'income' && tipo !== 'expense')
        ) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos obligatorios o el tipo es inválido (solo income/expense).'
            });
        }

        // 2. 🔥 Validación FUERTE del monto
        // 🔒 VALIDACIÓN FUERTE DEL MONTO

const montoNumerico = Number(monto);

// 1️⃣ Debe ser un número real válido
if (!Number.isFinite(montoNumerico)) {
    return res.status(400).json({
        success: false,
        message: 'Monto inválido'
    });
}

// 2️⃣ Debe ser mayor a 0
if (montoNumerico <= 0) {
    return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0.'
    });
}

// 3️⃣ Máximo permitido: 8 enteros + 2 decimales
if (montoNumerico > 99999999.99) {
    return res.status(400).json({
        success: false,
        message: 'El monto es demasiado grande. Máximo permitido: $99,999,999.99'
    });
}




        // 3. Crear objeto del movimiento
        const newMovement = {
            user_id,
            fecha,
            tipo,
            categoria,
            descripcion,
            monto: montoNumerico
        };

        // 4. Registrar movimiento
        const createdMovement = await Movement.create(newMovement);

        // 5. Calcular impacto en dashboard_balance
        let balanceChange = 0;

        if (tipo === 'income') {
            balanceChange = montoNumerico;
        } else {
            balanceChange = -montoNumerico;
        }

        // 6. Obtener usuario
        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado.'
            });
        }

        // 7. Calcular nuevo balance
        const currentBalance = parseFloat(user.dashboard_balance) || 0;
        const newBalance = currentBalance + balanceChange;

        // 8. Actualizar SOLO dashboard_balance
        await User.update(user_id, { dashboard_balance: newBalance });

        // 9. Respuesta
        res.status(201).json({
            success: true,
            message: `Movimiento registrado. Balance actualizado: $${currentBalance.toFixed(2)} → $${newBalance.toFixed(2)}`,
            data: createdMovement,
            new_balance: newBalance
        });

    } catch (error) {
        console.error('Error al crear movimiento:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al registrar movimiento.',
            error: error.message
        });
    }
};

// --- D: DELETE MOVEMENT (REVERSA BALANCE DASHBOARD) ---
export const deleteMovement = async (req, res) => {
    try {
        const { movementId } = req.params;

        if (!movementId) {
            return res.status(400).json({
                success: false,
                message: 'ID del movimiento requerido.'
            });
        }

        // 1. Buscar el movimiento
        const movement = await Movement.findById(movementId);

        if (!movement) {
            return res.status(404).json({
                success: false,
                message: 'Movimiento no encontrado.'
            });
        }

        // 2. Obtener usuario
        const user = await User.findById(movement.user_id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado.'
            });
        }

        // 3. Revertir impacto en dashboard_balance
        let balanceChange = 0;

        if (movement.tipo === 'income') {
            balanceChange = -parseFloat(movement.monto);
        } else {
            balanceChange = parseFloat(movement.monto);
        }

        const currentBalance = parseFloat(user.dashboard_balance) || 0;
        const newBalance = currentBalance + balanceChange;

        // 4. Actualizar balance
        await User.update(movement.user_id, {
            dashboard_balance: newBalance
        });

        // 5. Eliminar movimiento
        await Movement.delete(movementId);

        // 6. Respuesta
        res.json({
            success: true,
            message: 'Movimiento eliminado y balance actualizado.',
            new_balance: newBalance
        });

    } catch (error) {
        console.error('Error al eliminar movimiento:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al eliminar movimiento.',
            error: error.message
        });
    }
};
// --- R: GET MOVEMENTS + TOTALS BY USER ---
// backend/controllers/movementController.js


export const getMovementData = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'ID de usuario requerido.'
            });
        }

        // ✅ CAMBIO AQUÍ: usar el método correcto
        const movements = await Movement.findByUserId(userId);

        // 2. Calcular totales
        let totalIncome = 0;
        let totalExpense = 0;

        for (const m of movements) {
            const monto = parseFloat(m.monto) || 0;

            if (m.tipo === 'income') {
                totalIncome += monto;
            } else if (m.tipo === 'expense') {
                totalExpense += monto;
            }
        }

        const balance = totalIncome - totalExpense;

        // ✅ AÑADIR history al response
        res.json({
            success: true,
            data: {
                movements,
                totals: {
                    income: totalIncome,
                    expense: totalExpense,
                    balance
                }
            },
            history: movements // ✅ Esto es lo que espera el frontend
        });

    } catch (error) {
        console.error('Error al obtener movimientos:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al obtener movimientos.',
            error: error.message
        });
    }
};
