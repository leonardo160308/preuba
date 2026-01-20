// backend/controllers/userController.js
import User from '../models/UserModel.js';
import db from '../config/db.js';

// ========================================
// REGISTRO DE USUARIO (CON VALIDACIONES)
// ========================================
export const registerUser = async (req, res) => {
    try {
        const { nombre, email, password, edad, genero } = req.body;

        // 1. Validaciones de presencia
        if (!nombre || !email || !password || edad === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: 'Todos los campos son obligatorios' 
            });
        }

        // 2. Validación de Nombre (3 a 16 caracteres)
        if (nombre.length < 3 || nombre.length > 16) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de usuario debe tener entre 3 y 16 caracteres'
            });
        }

        // 3. Validación de Password (6 a 16 caracteres)
        if (password.length < 6 || password.length > 16) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener entre 6 y 16 caracteres'
            });
        }

        // 4. Validación de Email (6 a 254 caracteres + Formato)
        if (email.length < 6 || email.length > 254) {
            return res.status(400).json({
                success: false,
                message: 'El correo debe tener entre 6 y 254 caracteres'
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'El formato del correo electrónico no es válido'
            });
        }

        // 5. Validación de Edad (Entero, entre 15 y 99)
        const edadNum = Number(edad);
        if (!Number.isInteger(edadNum)) {
            return res.status(400).json({
                success: false,
                message: 'La edad debe ser un número entero (sin decimales)'
            });
        }
        if (edadNum < 15 || edadNum > 99) {
            return res.status(400).json({
                success: false,
                message: 'La edad debe estar entre 15 y 99 años'
            });
        }

        // 6. Preparar datos para el modelo
        const newUser = {
            nombre,
            email,
            password_hash: password, // ⚠️ Recuerda usar bcrypt pronto
            edad: edadNum,
            genero: genero || 'no_especificado',
            foto: null
        };

        // 7. Intentar crear usuario
        const createdUser = await User.create(newUser);

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: createdUser
        });

    } catch (error) {
        console.error('Error en registerUser:', error);
        
        // Manejar duplicados (Nombre o Email)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'Ese nombre de usuario o email ya están registrados'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// ========================================
// LOGIN DE USUARIO
// ========================================
export const loginUser = async (req, res) => {
    try {
        const { nombre, password } = req.body;

        if (!nombre || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nombre y contraseña requeridos' 
            });
        }

        const [users] = await db.execute(
            'SELECT * FROM users WHERE nombre = ?', 
            [nombre]
        );
        
        const user = users[0];

        if (!user || user.password_hash !== password) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario o contraseña incorrectos' 
            });
        }

        res.json({
            success: true,
            message: 'Bienvenido',
            user: {
                id: user.id,
                nombre: user.nombre,
                level: user.level,
                coins: user.coins,
                wood: user.wood,
                foto: user.foto,
                role: user.role || 'user'
            }
        });

    } catch (error) {
        console.error('Error en loginUser:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

// ========================================
// OTROS MÉTODOS (PERFIL, UPDATE, DELETE)
// ========================================
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'No encontrado' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const dataToUpdate = req.body;
        delete dataToUpdate.id; // Seguridad
        delete dataToUpdate.password_hash;

        const result = await User.update(req.params.id, dataToUpdate);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Sin cambios' });

        res.json({ success: true, message: 'Actualizado', data: dataToUpdate });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const result = await User.deleteLogical(req.params.id);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Error al borrar' });
        res.json({ success: true, message: 'Baja exitosa' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};