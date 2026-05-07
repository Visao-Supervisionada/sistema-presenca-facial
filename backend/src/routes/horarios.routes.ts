import { Router } from 'express';

import {
  criarHorarioController,
  excluirHorarioController,
  listarHorariosController,
} from '../controllers/horarios.controller';

const router = Router();

router.get('/', listarHorariosController);
router.post('/', criarHorarioController);
router.delete('/:id', excluirHorarioController);

export default router;