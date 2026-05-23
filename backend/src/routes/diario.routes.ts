import { Router } from 'express';

import {
  confirmarEntradaController,
  confirmarSaidaController,
  fecharDiaController,
  justificarFaltaController,
  listarDiarioController,
  listarDiarioMensalController,
  marcarFaltaController,
} from '../controllers/diario.controller';

const router = Router();

router.get('/', listarDiarioController);
router.post('/entrada', confirmarEntradaController);
router.post('/saida', confirmarSaidaController);
router.post('/falta', marcarFaltaController);
router.post('/justificar', justificarFaltaController);
router.post('/fechar-dia', fecharDiaController);
router.get('/:turmaId/mensal', listarDiarioMensalController);

export default router;