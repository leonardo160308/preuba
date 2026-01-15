import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar TODAS las rutas
import userRoutes from './backend/routes/userRoutes.js';
import movementRoutes from './backend/routes/movementRoutes.js';
import skinRoutes from './backend/routes/skinRoutes.js';
import dashboardRoutes from './backend/routes/dashboardRoutes.js';
import gameRoutes from './backend/routes/gameRoutes.js';
import challengeRoutes from './backend/routes/challengeRoutes.js';

dotenv.config();
const app = express();

// Configurar __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cors());

// ✅ Servir archivos estáticos
app.use('/public', express.static(path.join(__dirname, 'frontend/public')));
app.use(express.static(path.join(__dirname, 'frontend/views')));

// ✅ Rutas API
app.use('/api', userRoutes);
app.use('/api', movementRoutes);
app.use('/api', skinRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', gameRoutes);
app.use('/api', challengeRoutes);

// ❌ ELIMINA ESTA PARTE (o déjala comentada)
// app.use((req, res, next) => {
//     if (!req.path.startsWith('/api')) {
//         res.sendFile(path.join(__dirname, 'frontend/views/index.html'));
//     } else {
//         next();
//     }
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor TOO-EASY listo en http://localhost:${PORT}`);
});