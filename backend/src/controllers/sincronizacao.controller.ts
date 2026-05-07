import { RequestHandler } from 'express';

import { limparBaseFacialForaDoFirebase } from '../services/sincronizacao.service';

export const limparBaseFacialController: RequestHandler = async (_req, res) => {
  try {
    const resultado = await limparBaseFacialForaDoFirebase();

    res.json({
      success: true,
      message: 'Base facial sincronizada com o Firebase.',
      resultado,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao sincronizar base facial.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};