import { Router } from 'express';

import { validarReconhecimentoController } from '../controllers/reconhecimento.controller';
import { uploadImagem } from '../middlewares/upload';

const router = Router();

router.post(
  '/validar',
  uploadImagem.single('file'),
  validarReconhecimentoController,
);

export default router;