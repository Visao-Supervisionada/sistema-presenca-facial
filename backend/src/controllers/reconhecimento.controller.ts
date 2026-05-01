import { Request, Response } from 'express';

import { reconhecerMultiplosRostos } from '../services/reconhecimento.service';

export async function reconhecerRostosController(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'Imagem é obrigatória.',
      });
    }

    const threshold = req.body.threshold ? Number(req.body.threshold) : 0.6;
    const minCosineThreshold = req.body.min_cosine_threshold
      ? Number(req.body.min_cosine_threshold)
      : 0;

    const resultado = await reconhecerMultiplosRostos({
      arquivo: req.file,
      threshold,
      minCosineThreshold,
    });

    return res.json(resultado);
  } catch (error) {
    return res.status(500).json({
      message: 'Erro ao processar reconhecimento.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}