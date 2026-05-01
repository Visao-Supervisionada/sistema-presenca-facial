import { Router } from 'express';

import { reconhecerRostosController } from '../controllers/reconhecimento.controller';
import { uploadImagem } from '../middlewares/upload';

const router = Router();

router.post('/processar', uploadImagem.single('file'), reconhecerRostosController);

export default router;