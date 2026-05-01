import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import alunosRoutes from './routes/alunos.routes';
import presencasRoutes from './routes/presencas.routes';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
  }),
);

app.use(express.json());

app.get('/health', (_req, res) => {
  return res.json({
    status: 'ok',
    service: 'backend-presenca-facial',
    firebase: 'firestore',
    faceApiUrl: process.env.FACE_API_URL,
  });
});

app.use('/api/alunos', alunosRoutes);
app.use('/api/presencas', presencasRoutes);

export default app;