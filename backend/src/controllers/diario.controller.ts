import { RequestHandler } from 'express';

import {
  confirmarEntrada,
  confirmarSaida,
  fecharDia,
  justificarFalta,
  listarDiarioMensal,
  listarDiarioPorTurma,
  marcarFalta,
} from '../services/diario.service';

export const listarDiarioController: RequestHandler = async (req, res) => {
  try {
    const { turma, data } = req.query;

    if (!turma || !data) {
      res.status(400).json({
        success: false,
        message: 'Turma e data são obrigatórias.',
      });
      return;
    }

    const registros = await listarDiarioPorTurma({
      turma: String(turma),
      data: String(data),
    });

    res.json({
      success: true,
      total: registros.length,
      registros,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar diário.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const confirmarEntradaController: RequestHandler = async (req, res) => {
  try {
    const { matricula, data, origem, confidence } = req.body;

    if (!matricula || !data) {
      res.status(400).json({
        success: false,
        message: 'Matrícula e data são obrigatórias.',
      });
      return;
    }

    const registro = await confirmarEntrada({
      matricula,
      data,
      origem: origem || 'manual',
      confidence,
    });

    res.json({
      success: true,
      message: 'Entrada confirmada.',
      registro,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao confirmar entrada.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const confirmarSaidaController: RequestHandler = async (req, res) => {
  try {
    const { matricula, data, origem, confidence } = req.body;

    if (!matricula || !data) {
      res.status(400).json({
        success: false,
        message: 'Matrícula e data são obrigatórias.',
      });
      return;
    }

    const registro = await confirmarSaida({
      matricula,
      data,
      origem: origem || 'manual',
      confidence,
    });

    res.json({
      success: true,
      message: 'Saída confirmada.',
      registro,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao confirmar saída.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const marcarFaltaController: RequestHandler = async (req, res) => {
  try {
    const { matricula, data } = req.body;

    if (!matricula || !data) {
      res.status(400).json({
        success: false,
        message: 'Matrícula e data são obrigatórias.',
      });
      return;
    }

    const registro = await marcarFalta({
      matricula,
      data,
    });

    res.json({
      success: true,
      message: 'Falta registrada.',
      registro,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao marcar falta.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const listarDiarioMensalController: RequestHandler = async (req, res) => {
  try {
    const { turmaId } = req.params;
    const { mes, ano, componente } = req.query;

    if (!turmaId || !mes || !ano) {
      res.status(400).json({ success: false, message: 'turmaId, mes e ano são obrigatórios.' });
      return;
    }

    const resultado = await listarDiarioMensal({
      turmaId: String(turmaId),
      mes: Number(mes),
      ano: Number(ano),
      componente: componente ? String(componente) : undefined,
    });

    res.json({ success: true, total: resultado.length, alunos: resultado });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar diário mensal.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const justificarFaltaController: RequestHandler = async (req, res) => {
  try {
    const { alunoId, turma, data, componente, justificativa } = req.body;

    if (!alunoId || !turma || !data || !justificativa) {
      res.status(400).json({ success: false, message: 'alunoId, turma, data e justificativa são obrigatórios.' });
      return;
    }

    const resultado = await justificarFalta({ alunoId, turma, data, componente, justificativa });

    res.json({ success: true, message: 'Justificativa salva.', justificativa: resultado });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao justificar falta.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const fecharDiaController: RequestHandler = async (req, res) => {
  try {
    const { turmaId, data } = req.body;

    if (!turmaId || !data) {
      res.status(400).json({ success: false, message: 'turmaId e data são obrigatórios.' });
      return;
    }

    const resultado = await fecharDia({ turmaId, data });

    res.json({ success: true, message: 'Dia fechado.', ...resultado });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao fechar dia.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};