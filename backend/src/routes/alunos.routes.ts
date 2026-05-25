import { Router } from 'express';

import {
  cadastrarAlunoController,
  excluirAlunoController,
  listarAlunosController,
  listarProfessoresController,
  listarTurmasController,
} from '../controllers/alunos.controller';
import { uploadImagem } from '../middlewares/upload';

const router = Router();

router.get('/turmas', listarTurmasController);
router.get('/professores', listarProfessoresController);
router.get('/', listarAlunosController);
router.post('/', uploadImagem.array('files', 5), cadastrarAlunoController);
router.delete('/:id', excluirAlunoController);

export default router;