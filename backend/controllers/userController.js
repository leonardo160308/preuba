import User from '../models/UserModel.js';

export const registerUser = async (req, res) => {
    try {
        const { nombre, password, edad, genero } = req.body;

        // 1. Validaciones básicas
        if (!nombre || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nombre y contraseña son obligatorios' 
            });
        }

        // TODO: Aquí deberíamos encriptar la contraseña con bcrypt antes de guardarla
        // Por ahora la guardamos directo como en tu ejemplo
        const password_hash = password; 

        // 2. Preparar datos para el modelo
        const newUser = {
            nombre,
            password_hash,
            edad: edad || 0,
            genero: genero || 'no_especificado',
            foto: null // El front decidirá la imagen default si es null
        };

        // 3. Llamar al modelo
        const createdUser = await User.create(newUser);

        // 4. Responder al frontend
        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: createdUser
        });

    } catch (error) {
        console.error('Error en registerUser:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al crear usuario',
            error: error.message
        });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);

        if(!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Actualizar datos del usuario
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const dataToUpdate = req.body; // Ej: { coins: 50, level: 2 }

        // Evitar que actualicen el ID o fecha de creación por seguridad
        delete dataToUpdate.id;
        delete dataToUpdate.created_at;

        const result = await User.update(id, dataToUpdate);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado o sin cambios' });
        }

        res.json({ message: 'Usuario actualizado correctamente', data: dataToUpdate });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Borrar usuario (Baja lógica)
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await User.deleteLogical(id);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ message: 'Usuario dado de baja exitosamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// En controllers/userController.js

// LOGIN: Verificar credenciales
export const loginUser = async (req, res) => {
    try {
        const { nombre, password } = req.body;

        // 1. Buscar usuario por nombre (O email si prefieres)
        // Nota: Esto asume que en tu modelo User agregaste un método findByUsername, 
        // si no, usa una query directa aquí o agrégalo al modelo.
        const [users] = await db.execute('SELECT * FROM users WHERE nombre = ?', [nombre]);
        const user = users[0];

        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        // 2. Verificar contraseña 
        // (Como aún no usamos encriptación, comparamos texto plano)
        if (user.password_hash !== password) { // Ojo: en tu DB le llamaste password_hash
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }

        // 3. Login exitoso
        res.json({
            success: true,
            message: 'Bienvenido',
            user: {
                id: user.id,
                nombre: user.nombre,
                level: user.level,
                foto: user.foto
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};