import { RequestHandler } from 'express';

import { reconhecerMultiplosRostos } from '../services/reconhecimento.service';
import {
  listarPresencas,
  registrarPresencaPorMatricula,
} from '../services/presencas.service';

export const registrarPresencaPorReconhecimentoController: RequestHandler = async (
  req,
  res,
) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'Imagem é obrigatória.',
      });
      return;
    }

    const resultadoReconhecimento = await reconhecerMultiplosRostos({
      arquivo: req.file,
      threshold: 0.6,
      minCosineThreshold: 0,
    });

    const registros = [];

    for (const resultado of resultadoReconhecimento.results) {
      if (!resultado.matched || !resultado.registration) {
        registros.push({
          reconhecimento: resultado,
          acao: 'desconhecido',
        });

        continue;
      }

      const presenca = await registrarPresencaPorMatricula({
        matricula: resultado.registration,
        confidence: resultado.confidence,
      });

      registros.push({
        reconhecimento: resultado,
        ...presenca,
      });
    }

    res.json({
      success: true,
      total_faces: resultadoReconhecimento.total_faces,
      classifier_loaded: resultadoReconhecimento.classifier_loaded,
      registros,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar presença por reconhecimento.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const listarPresencasController: RequestHandler = async (_req, res) => {
  try {
    const presencas = await listarPresencas();

    res.json({
      success: true,
      total: presencas.length,
      presencas,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar presenças.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};