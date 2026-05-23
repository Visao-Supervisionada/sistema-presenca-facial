import { Router } from 'express';
import { listarNotasController, salvarNotaController } from '../controllers/nota.controller';

const router = Router();

router.get('/:turmaId', listarNotasController);
router.post('/', salvarNotaController);
router.put('/:id', salvarNotaController);

export default router;
