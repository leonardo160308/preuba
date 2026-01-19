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
        const montoNumerico = parseFloat(monto);

        if (isNaN(montoNumerico)) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser un número válido.'
            });
        }

        if (montoNumerico <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser mayor a 0.'
            });
        }

        // Límite compatible con DECIMAL(12,2)
        if (montoNumerico > 9999999999.99) {
            return res.status(400).json({
                success: false,
                message: 'El monto es demasiado grande. Máximo permitido: $9,999,999,999.99'
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
