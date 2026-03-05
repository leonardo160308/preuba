import { supabase } from '../config/supabase.js';

class User {

    // 1. CREAR usuario
    static async create(userData) {
        const { nombre, email, password_hash, edad, genero, foto } = userData;

        const { data, error } = await supabase
            .from('users')
            .insert({ nombre, email, password_hash, edad, genero, foto })
            .select()
            .single();

        if (error) {
            // Simular el código de error de MySQL para duplicados
            if (error.code === '23505') {
                const dupError = new Error(error.message);
                dupError.code = 'ER_DUP_ENTRY';
                throw dupError;
            }
            throw error;
        }

        return data;
    }

    // 2. BUSCAR por ID
    static async findById(id) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // No encontrado
            throw error;
        }

        return data;
    }

    // 3. ACTUALIZAR
    static async update(id, updateData) {
        const allowedFields = [
            'nombre', 'password_hash', 'edad', 'genero', 'foto',
            'level', 'coins', 'wood', 'dashboard_balance',
            'house_level', 'beaver_level', 'current_appearance', 'current_beaver'
        ];

        const filteredData = {};
        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key)) {
                filteredData[key] = updateData[key];
            }
        });

        if (Object.keys(filteredData).length === 0) {
            console.warn('No hay campos válidos para actualizar');
            return null;
        }

        const { data, error } = await supabase
            .from('users')
            .update(filteredData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Simular affectedRows para compatibilidad con el código existente
        return { affectedRows: data ? 1 : 0, data };
    }

    // 4. BAJA LÓGICA
    static async deleteLogical(id) {
        const { data, error } = await supabase
            .from('users')
            .update({ is_active: false })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return { affectedRows: data ? 1 : 0 };
    }
}

export default User;