import { Router } from 'express';

import {
  listarPresencasController,
  registrarPresencaPorReconhecimentoController,
} from '../controllers/presencas.controller';
import { uploadImagem } from '../middlewares/upload';

const router = Router();

router.get('/', listarPresencasController);

router.post(
  '/reconhecimento',
  uploadImagem.single('file'),
  registrarPresencaPorReconhecimentoController,
);

export default router;