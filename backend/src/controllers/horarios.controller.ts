import { RequestHandler } from 'express';

import {
  criarHorario,
  excluirHorario,
  listarHorarios,
} from '../services/horarios.service';
import { DiaSemana } from '../types/horario.types';

export const criarHorarioController: RequestHandler = async (req, res) => {
  try {
    const {
      matricula,
      nome,
      turma,
      diaSemana,
      horaEntrada,
      horaLimiteEntrada,
      horaSaida,
    } = req.body;

    if (
      !matricula ||
      !nome ||
      !turma ||
      !diaSemana ||
      !horaEntrada ||
      !horaLimiteEntrada ||
      !horaSaida
    ) {
      res.status(400).json({
        success: false,
        message: 'Todos os campos do horário são obrigatórios.',
      });
      return;
    }

    const horario = await criarHorario({
      matricula,
      nome,
      turma,
      diaSemana,
      horaEntrada,
      horaLimiteEntrada,
      horaSaida,
    });

    res.status(201).json({
      success: true,
      message: 'Horário criado com sucesso.',
      horario,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao criar horário.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const listarHorariosController: RequestHandler = async (req, res) => {
  try {
    const { turma, matricula, diaSemana } = req.query;

    const horarios = await listarHorarios({
      turma: turma ? String(turma) : undefined,
      matricula: matricula ? String(matricula) : undefined,
      diaSemana: diaSemana ? (String(diaSemana) as DiaSemana) : undefined,
    });

    res.json({
      success: true,
      total: horarios.length,
      horarios,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar horários.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const excluirHorarioController: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await excluirHorario(id);

    res.json({
      success: true,
      message: 'Horário removido com sucesso.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao remover horário.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};