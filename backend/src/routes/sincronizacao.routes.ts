import { Router } from 'express';

import { limparBaseFacialController } from '../controllers/sincronizacao.controller';

const router = Router();

router.post('/limpar-base-facial', limparBaseFacialController);

export default router;