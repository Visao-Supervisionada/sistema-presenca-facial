import { RequestHandler } from "express";

import { reconhecerMultiplosRostos } from "../services/reconhecimento.service";
import {
  listarPresencas,
  registrarPresencaPorMatricula,
  resetarPresencaPorMatriculaEData,
} from "../services/presencas.service";

type AcaoPresenca =
  | "entrada"
  | "saida"
  | "ja_finalizada"
  | "aluno_nao_encontrado"
  | "desconhecido"
  | "em_aula"
  | "sem_horario"
  | "fora_da_janela";

interface RegistroPresencaReconhecimento {
  reconhecimento: unknown;
  acao: AcaoPresenca;
  presenca?: unknown;
}

function obterNumeroFormulario(
  valor: unknown,
  padrao: number,
): number {
  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : padrao;
}

export const registrarPresencaPorReconhecimentoController: RequestHandler =
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "Imagem é obrigatória.",
        });
        return;
      }

      const threshold = obterNumeroFormulario(req.body.threshold, 0.6);

      const minCosineThreshold = obterNumeroFormulario(
        req.body.minCosineThreshold ?? req.body.min_cosine_threshold,
        0.35,
      );

      const resultadoReconhecimento = await reconhecerMultiplosRostos({
        arquivo: req.file,
        threshold,
        minCosineThreshold,
      });

      const registros: RegistroPresencaReconhecimento[] = [];

      for (const resultado of resultadoReconhecimento.results || []) {
        const matricula = String(resultado.registration || "").trim();

        if (!resultado.matched || !matricula) {
          registros.push({
            reconhecimento: resultado,
            acao: "desconhecido",
          });

          continue;
        }

        const resultadoPresenca = await registrarPresencaPorMatricula({
          matricula,
          confidence: resultado.confidence,
        });

        registros.push({
          reconhecimento: resultado,
          acao: resultadoPresenca.acao,
          presenca: resultadoPresenca.presenca,
        });
      }

      res.json({
        success: true,
        total_faces: resultadoReconhecimento.total_faces ?? registros.length,
        classifier_loaded: resultadoReconhecimento.classifier_loaded ?? true,
        registros,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erro ao registrar presença por reconhecimento.",
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
      message: "Erro ao listar presenças.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const resetarPresencaController: RequestHandler = async (req, res) => {
  try {
    const matricula = String(
      req.body.matricula ?? req.query.matricula ?? "",
    ).trim();

    const data = String(req.body.data ?? req.query.data ?? "").trim();

    if (!matricula || !data) {
      res.status(400).json({
        success: false,
        message: "Matrícula e data são obrigatórias.",
      });
      return;
    }

    const resultado = await resetarPresencaPorMatriculaEData({
      matricula,
      data,
    });

    res.json({
      success: true,
      message: "Frequência resetada com sucesso.",
      matricula,
      data,
      ...resultado,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao resetar frequência.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};