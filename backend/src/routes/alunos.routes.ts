import { Router } from 'express';

import {
  cadastrarAlunoController,
  excluirAlunoController,
  listarAlunosController,
} from '../controllers/alunos.controller';
import { uploadImagem } from '../middlewares/upload';

const router = Router();

router.get('/', listarAlunosController);
router.post('/', uploadImagem.single('file'), cadastrarAlunoController);
router.delete('/:id', excluirAlunoController);

export default router;