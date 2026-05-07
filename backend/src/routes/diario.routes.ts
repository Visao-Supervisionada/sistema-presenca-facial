import { Router } from 'express';

import {
  confirmarEntradaController,
  confirmarSaidaController,
  listarDiarioController,
  marcarFaltaController,
} from '../controllers/diario.controller';

const router = Router();

router.get('/', listarDiarioController);
router.post('/entrada', confirmarEntradaController);
router.post('/saida', confirmarSaidaController);
router.post('/falta', marcarFaltaController);

export default router;