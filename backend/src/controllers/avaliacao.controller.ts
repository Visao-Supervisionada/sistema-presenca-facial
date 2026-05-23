import { RequestHandler } from 'express';
import { criarAvaliacao, excluirAvaliacao, listarAvaliacoes } from '../services/avaliacao.service';

export const listarAvaliacoesController: RequestHandler = async (req, res) => {
  try {
    const { turmaId } = req.params;
    const { componente, mes, ano } = req.query;

    if (!turmaId) {
      res.status(400).json({ success: false, message: 'turmaId é obrigatório.' });
      return;
    }

    const avaliacoes = await listarAvaliacoes({
      turmaId: String(turmaId),
      componente: componente ? String(componente) : undefined,
      mes: mes ? Number(mes) : undefined,
      ano: ano ? Number(ano) : undefined,
    });

    res.json({ success: true, total: avaliacoes.length, avaliacoes });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar avaliações.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const criarAvaliacaoController: RequestHandler = async (req, res) => {
  try {
    const { turmaId, componente, data, titulo, tipo, valor, objetosIds, criterios } = req.body;

    if (!turmaId || !componente || !data || !titulo || !tipo) {
      res.status(400).json({ success: false, message: 'turmaId, componente, data, titulo e tipo são obrigatórios.' });
      return;
    }

    const avaliacao = await criarAvaliacao({
      turmaId,
      componente,
      data,
      titulo,
      tipo,
      valor: Number(valor) || 10,
      objetosIds: objetosIds || [],
      criterios: criterios || '',
    });

    res.status(201).json({ success: true, avaliacao });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao criar avaliação.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const excluirAvaliacaoController: RequestHandler = async (req, res) => {
  try {
    const id = String(req.params['id'] ?? '');
    await excluirAvaliacao(id);
    res.json({ success: true, message: 'Avaliação removida.' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir avaliação.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
