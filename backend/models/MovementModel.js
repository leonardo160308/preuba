import db from '../config/db.js';

class Movement {
    // 1. CREAR (C): Registra un nuevo ingreso o gasto
    static async create(movementData) {
        const { user_id, fecha, tipo, categoria, monto, descripcion } = movementData;
        
        const query = `
            INSERT INTO movements (user_id, fecha, tipo, categoria, monto, descripcion) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        try {
            // Ejecutamos la consulta. Usamos 'General' como categoría por defecto si no se proporciona.
            const [result] = await db.execute(query, [
                user_id, 
                fecha, 
                tipo, 
                categoria || 'General', 
                monto, 
                descripcion || null // La descripción puede ser nula
            ]);
            
            return { id: result.insertId, ...movementData };
        } catch (error) {
            throw error;
        }
    }

    // 2. LEER (R): Obtener el historial completo de un usuario
    static async getByUserId(userId) {
        // Ordenamos por fecha descendente para ver los movimientos más recientes primero
        const query = 'SELECT * FROM movements WHERE user_id = ? ORDER BY fecha DESC, created_at DESC';
        try {
            const [rows] = await db.execute(query, [userId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // 3. LEER TOTALES (R): Calcular ingresos vs gastos (para el dashboard)
    static async getTotalsByUserId(userId) {
        const query = `
            SELECT 
                tipo, 
                SUM(monto) as total 
            FROM movements 
            WHERE user_id = ? 
            GROUP BY tipo
        `;
        try {
            const [rows] = await db.execute(query, [userId]);
            
            // Formatear los resultados para que sean fáciles de usar en el controlador
            const totals = { income: 0, expense: 0 };
            rows.forEach(row => {
                totals[row.tipo] = parseFloat(row.total) || 0;
            });
            
            return totals;
        } catch (error) {
            throw error;
        }
    }
    
    // 4. BORRAR (D): Eliminar un movimiento por su ID
    static async deleteById(movementId, userId) {
        // Es crucial incluir el user_id en el DELETE para que un usuario solo pueda borrar sus propios movimientos.
        const query = 'DELETE FROM movements WHERE id = ? AND user_id = ?';
        try {
            const [result] = await db.execute(query, [movementId, userId]);
            return result;
        } catch (error) {
            throw error;
        }
    }
}

export default Movement;