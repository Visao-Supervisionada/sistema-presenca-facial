import { RequestHandler } from 'express';

import { reconhecerMultiplosRostos } from '../services/reconhecimento.service';
import { buscarAlunoPorMatricula } from '../services/alunos.service';
import { registrarPresencaPorMatricula } from '../services/presencas.service';

export const validarReconhecimentoController: RequestHandler = async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'Imagem é obrigatória.',
      });
      return;
    }

    const respostaReconhecimento = await reconhecerMultiplosRostos({
      arquivo: req.file,
      threshold: 0.7,
      minCosineThreshold: 0.35,
    });

    const respostaComoAny = respostaReconhecimento as any;

    const rostos =
      respostaComoAny.results ||
      respostaComoAny.faces ||
      respostaComoAny.people ||
      respostaComoAny.registros ||
      respostaComoAny.detections ||
      [];

    const registros = await Promise.all(
      rostos.map(async (rosto: any) => {
        const reconhecimento = rosto.reconhecimento || rosto;

        const matricula =
          reconhecimento.registration ||
          reconhecimento.matricula ||
          reconhecimento.person?.registration ||
          '';

        const nome =
          reconhecimento.name ||
          reconhecimento.nome ||
          reconhecimento.person?.name ||
          'Desconhecido';

        const matched =
          reconhecimento.matched ??
          reconhecimento.match ??
          Boolean(matricula);

        const confidence =
          reconhecimento.confidence ??
          reconhecimento.score ??
          reconhecimento.similarity ??
          0;

        const bbox =
          reconhecimento.bbox ||
          reconhecimento.box ||
          reconhecimento.bounding_box;

        if (!matched || !matricula) {
          return {
            acao: 'desconhecido',
            alunoEncontrado: false,
            reconhecimento: {
              matched: false,
              name: nome,
              registration: matricula,
              confidence,
              bbox,
            },
          };
        }

        const aluno = await buscarAlunoPorMatricula(String(matricula).trim());

        if (!aluno) {
          return {
            acao: 'aluno_nao_encontrado',
            alunoEncontrado: false,
            reconhecimento: {
              matched: true,
              name: nome,
              registration: String(matricula).trim(),
              confidence,
              bbox,
            },
          };
        }

        const presenca = await registrarPresencaPorMatricula({
          matricula: aluno.matricula,
          confidence,
        });

        return {
          acao: presenca.acao,
          alunoEncontrado: true,
          aluno,
          reconhecimento: {
            matched: true,
            name: aluno.nome,
            registration: aluno.matricula,
            confidence,
            bbox,
          },
        };
      }),
    );

    res.json({
      success: true,
      total_faces:
        respostaComoAny.total_faces ??
        respostaComoAny.total ??
        registros.length,
      registros,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao validar reconhecimento.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const classificarReconhecimentoController: RequestHandler = async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Imagem é obrigatória.",
      });
      return;
    }

    const respostaReconhecimento = await reconhecerMultiplosRostos({
      arquivo: req.file,
      threshold: Number(req.body.threshold ?? 0.6),
      minCosineThreshold: Number(req.body.minCosineThreshold ?? 0.35),
    });

    const respostaComoAny = respostaReconhecimento as any;

    const rostos =
      respostaComoAny.results ||
      respostaComoAny.faces ||
      respostaComoAny.people ||
      respostaComoAny.registros ||
      respostaComoAny.detections ||
      [];

    const results = rostos.map((rosto: any) => {
      const reconhecimento = rosto.reconhecimento || rosto;

      return {
        bbox:
          reconhecimento.bbox ||
          reconhecimento.box ||
          reconhecimento.bounding_box ||
          [],
        matched:
          reconhecimento.matched ??
          reconhecimento.match ??
          Boolean(reconhecimento.registration || reconhecimento.matricula),
        name:
          reconhecimento.name ||
          reconhecimento.nome ||
          reconhecimento.person?.name ||
          "Desconhecido",
        registration:
          reconhecimento.registration ||
          reconhecimento.matricula ||
          reconhecimento.person?.registration ||
          "",
        confidence:
          reconhecimento.confidence ??
          reconhecimento.score ??
          reconhecimento.similarity ??
          0,
        cosine_confidence:
          reconhecimento.cosine_confidence ??
          reconhecimento.cosineConfidence ??
          0,
      };
    });

    res.json({
      success: true,
      total_faces:
        respostaComoAny.total_faces ??
        respostaComoAny.total ??
        results.length,
      classifier_loaded: respostaComoAny.classifier_loaded ?? true,
      results,

      // compatibilidade se o frontend ainda estiver lendo registros
      registros: results.map((reconhecimento: any) => ({
        acao: reconhecimento.matched ? "classificado" : "desconhecido",
        alunoEncontrado: reconhecimento.matched,
        reconhecimento,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao classificar reconhecimento.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};