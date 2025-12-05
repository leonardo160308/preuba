import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importar TODAS las rutas
import userRoutes from './routes/userRoutes.js';
import movementRoutes from './routes/movementRoutes.js';
import skinRoutes from './routes/skinRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import gameRoutes from './routes/gameRoutes.js'; // ⬅️ NUEVO
import challengeRoutes from './routes/challengeRoutes.js'
dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

// Usar TODAS las rutas
app.use('/api', userRoutes);
app.use('/api', movementRoutes);
app.use('/api', skinRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', gameRoutes); // ⬅️ NUEVO
app.use('/api', challengeRoutes);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor TOO-EASY listo en el puerto ${PORT}`);
});