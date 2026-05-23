import { RequestHandler } from 'express';
import { listarNotas, salvarNota } from '../services/nota.service';

export const listarNotasController: RequestHandler = async (req, res) => {
  try {
    const { turmaId } = req.params;
    const { componente } = req.query;

    if (!turmaId) {
      res.status(400).json({ success: false, message: 'turmaId é obrigatório.' });
      return;
    }

    const notas = await listarNotas({
      turmaId: String(turmaId),
      componente: componente ? String(componente) : undefined,
    });

    res.json({ success: true, total: notas.length, notas });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar notas.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const salvarNotaController: RequestHandler = async (req, res) => {
  try {
    const { alunoId, turmaId, componente, bimestre, av1, av2, av3, av4 } = req.body;

    if (!alunoId || !turmaId || !componente || !bimestre) {
      res.status(400).json({ success: false, message: 'alunoId, turmaId, componente e bimestre são obrigatórios.' });
      return;
    }

    const nota = await salvarNota({
      alunoId,
      turmaId,
      componente,
      bimestre: Number(bimestre) as 1 | 2 | 3 | 4,
      av1: av1 != null ? Number(av1) : null,
      av2: av2 != null ? Number(av2) : null,
      av3: av3 != null ? Number(av3) : null,
      av4: av4 != null ? Number(av4) : null,
    });

    res.json({ success: true, nota });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar nota.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
