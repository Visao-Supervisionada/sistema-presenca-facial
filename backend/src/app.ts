import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import dashboardRoutes from './routes/dashboard.routes';
import alunosRoutes from './routes/alunos.routes';
import presencasRoutes from './routes/presencas.routes';
import horariosRoutes from './routes/horarios.routes';
import diarioRoutes from './routes/diario.routes';
import sincronizacaoRoutes from './routes/sincronizacao.routes';
import reconhecimentoRoutes from './routes/reconhecimento.routes';
import componentesRoutes from './routes/componentes.routes';
import objetoRoutes from './routes/objeto.routes';
import avaliacaoRoutes from './routes/avaliacao.routes';
import notaRoutes from './routes/nota.routes';

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
    routes: {
      alunos: '/api/alunos',
      presencas: '/api/presencas',
      horarios: '/api/horarios',
      diario: '/api/diario',
      sincronizacao: '/api/sincronizacao',
      reconhecimento: '/api/reconhecimento',
    },
  });
});

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alunos', alunosRoutes);
app.use('/api/presencas', presencasRoutes);
app.use('/api/horarios', horariosRoutes);
app.use('/api/diario', diarioRoutes);
app.use('/api/sincronizacao', sincronizacaoRoutes);
app.use('/api/reconhecimento', reconhecimentoRoutes);
app.use('/api/componentes', componentesRoutes);
app.use('/api/objetos-conhecimento', objetoRoutes);
app.use('/api/avaliacoes', avaliacaoRoutes);
app.use('/api/notas', notaRoutes);

export default app;