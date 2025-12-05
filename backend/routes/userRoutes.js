import { Router } from 'express';
import { registerUser, getUserProfile, updateUser, deleteUser } from '../controllers/userController.js';
const router = Router();

// Ruta para crear usuario: POST http://localhost:3000/api/users
router.post('/users', registerUser);

// Ruta para ver un usuario: GET http://localhost:3000/api/users/1
router.get('/users/:id', getUserProfile);

// Ruta para actualizar (PUT)
router.put('/users/:id', updateUser);

// Ruta para borrar (DELETE)
router.delete('/users/:id', deleteUser);
export default router;

import { loginUser } from '../controllers/userController.js'; // Importar arriba
// ...
router.post('/login', loginUser); // Agregar ruta