import db from '../config/db.js';

class User {
    // 1. CREAR (Create): Registra un nuevo usuario
    static async create(userData) {
        // Desestructurar datos para asegurar el orden de los parámetros en la consulta
        const { nombre, password_hash, edad, genero, foto } = userData;
        
        const query = `
            INSERT INTO users (nombre, password_hash, edad, genero, foto) 
            VALUES (?, ?, ?, ?, ?)
        `;

        try {
            // Ejecutamos la consulta. 'result' contiene metadatos como insertId.
            const [result] = await db.execute(query, [nombre, password_hash, edad, genero, foto]);
            
            // Devolvemos el ID generado y el resto de los datos
            return { id: result.insertId, ...userData };
        } catch (error) {
            // Re-lanzar el error para que sea manejado por el controlador (ej. duplicidad de email)
            throw error;
        }
    }

    // 2. LEER (Read): Buscar usuario por ID (útil para el perfil)
    static async findById(id) {
        const query = 'SELECT * FROM users WHERE id = ?';
        try {
            // Ejecutamos la consulta. 'rows' es el primer elemento del resultado y contiene los datos.
            const [rows] = await db.execute(query, [id]);
            // Devolvemos la primera fila encontrada (el usuario)
            return rows[0]; 
        } catch (error) {
            throw error;
        }
    }
    
    // 3. ACTUALIZAR (Update): Para monedas, nivel, avatar, etc.
    static async update(id, updateData) {
        // Genera la parte 'SET campo = ?' dinámicamente
        const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updateData);
        
        if (fields.length === 0) return null; // No hay nada que actualizar

        // La consulta final incluye el ID al final del SET
        const query = `UPDATE users SET ${fields} WHERE id = ?`;
        
        try {
            // Agregamos el ID al final del array de valores para que coincida con el último '?' de la consulta
            const [result] = await db.execute(query, [...values, id]);
            return result; // Contiene la propiedad affectedRows (filas afectadas)
        } catch (error) {
            throw error;
        }
    }

    // 4. BORRAR (Delete Lógico): Cambiar is_active a false
    static async deleteLogical(id) {
        const query = 'UPDATE users SET is_active = FALSE WHERE id = ?';
        try {
            const [result] = await db.execute(query, [id]);
            return result;
        } catch (error) {
            throw error;
        }
    }
}

export default User;