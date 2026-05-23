import { RequestHandler } from 'express';
import { criarObjeto, excluirObjeto, listarObjetos } from '../services/objeto.service';

export const listarObjetosController: RequestHandler = async (req, res) => {
  try {
    const { turmaId } = req.params;
    const { componente, mes, ano } = req.query;

    if (!turmaId) {
      res.status(400).json({ success: false, message: 'turmaId é obrigatório.' });
      return;
    }

    const objetos = await listarObjetos({
      turmaId: String(turmaId),
      componente: componente ? String(componente) : undefined,
      mes: mes ? Number(mes) : undefined,
      ano: ano ? Number(ano) : undefined,
    });

    res.json({ success: true, total: objetos.length, objetos });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar objetos.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const criarObjetoController: RequestHandler = async (req, res) => {
  try {
    const { turmaId, componente, data, conteudo, status } = req.body;

    if (!turmaId || !componente || !data || !conteudo || !status) {
      res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
      return;
    }

    const objeto = await criarObjeto({ turmaId, componente, data, conteudo, status });
    res.status(201).json({ success: true, objeto });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao criar objeto.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const excluirObjetoController: RequestHandler = async (req, res) => {
  try {
    const id = String(req.params['id'] ?? '');
    await excluirObjeto(id);
    res.json({ success: true, message: 'Objeto removido.' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir objeto.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
