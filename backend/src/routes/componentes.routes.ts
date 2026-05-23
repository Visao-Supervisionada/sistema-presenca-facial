import { Router } from 'express';

import { criarComponenteController, listarComponentesController } from '../controllers/componentes.controller';

const router = Router();

router.get('/:turmaId', listarComponentesController);
router.post('/', criarComponenteController);

export default router;
