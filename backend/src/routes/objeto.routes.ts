import { Router } from 'express';
import {
  criarObjetoController,
  excluirObjetoController,
  listarObjetosController,
} from '../controllers/objeto.controller';

const router = Router();

router.get('/:turmaId', listarObjetosController);
router.post('/', criarObjetoController);
router.delete('/:id', excluirObjetoController);

export default router;
