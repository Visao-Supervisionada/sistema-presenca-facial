import { RequestHandler } from 'express';

import { criarComponente, listarComponentesPorTurma } from '../services/componentes.service';

export const listarComponentesController: RequestHandler = async (req, res) => {
  try {
    const { turmaId } = req.params;

    if (!turmaId) {
      res.status(400).json({ success: false, message: 'turmaId é obrigatório.' });
      return;
    }

    const componentes = await listarComponentesPorTurma(String(turmaId));

    res.json({ success: true, total: componentes.length, componentes });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar componentes.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const criarComponenteController: RequestHandler = async (req, res) => {
  try {
    const { nome, turma } = req.body;

    if (!nome || !turma) {
      res.status(400).json({ success: false, message: 'nome e turma são obrigatórios.' });
      return;
    }

    const componente = await criarComponente({ nome, turma });

    res.status(201).json({ success: true, message: 'Componente criado.', componente });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao criar componente.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
