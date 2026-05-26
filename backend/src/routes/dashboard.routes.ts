import { Router } from 'express';
import { frequenciaSemanaController, resumoDashboardController } from '../controllers/dashboard.controller';

const router = Router();

router.get('/resumo', resumoDashboardController);
router.get('/semana', frequenciaSemanaController);

export default router;
