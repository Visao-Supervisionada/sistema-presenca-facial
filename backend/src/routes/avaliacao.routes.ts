import { Router } from 'express';
import {
  criarAvaliacaoController,
  excluirAvaliacaoController,
  listarAvaliacoesController,
} from '../controllers/avaliacao.controller';

const router = Router();

router.get('/:turmaId', listarAvaliacoesController);
router.post('/', criarAvaliacaoController);
router.delete('/:id', excluirAvaliacaoController);

export default router;
