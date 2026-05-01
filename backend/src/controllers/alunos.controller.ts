import { Request, Response, RequestHandler } from 'express';

import {
  buscarAlunoPorId,
  criarAluno,
  excluirAlunoPorId,
  listarAlunos,
} from '../services/alunos.service';

import {
  cadastrarFaceNaApi,
  excluirFaceNaApi,
} from '../services/reconhecimento.service';


export async function cadastrarAlunoController(req: Request, res: Response) {
  try {
    const { nome, matricula, turma, perfil } = req.body;

    if (!nome || !matricula || !perfil) {
      return res.status(400).json({
        success: false,
        message: 'Nome, matrícula e perfil são obrigatórios.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Imagem facial é obrigatória.',
      });
    }

    const nomeNormalizado = String(nome).trim();
    const matriculaNormalizada = String(matricula).trim();
    const turmaNormalizada = turma ? String(turma).trim() : '';

    const respostaFace = await cadastrarFaceNaApi({
      nome: nomeNormalizado,
      matricula: matriculaNormalizada,
      arquivo: req.file,
    });

    const aluno = await criarAluno({
      nome: nomeNormalizado,
      matricula: matriculaNormalizada,
      turma: turmaNormalizada,
      perfil,
      faceId: respostaFace.person.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Aluno cadastrado com sucesso.',
      aluno,
      face: respostaFace.person,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao cadastrar aluno.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}


export async function listarAlunosController(_req: Request, res: Response) {
  try {
    const alunos = await listarAlunos();

    return res.json({
      total: alunos.length,
      alunos,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar alunos.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}


export const excluirAlunoController: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const aluno = await buscarAlunoPorId(id);

    if (!aluno) {
      res.status(404).json({
        success: false,
        message: 'Aluno não encontrado no Firebase.',
      });
      return;
    }

    try {
      await excluirFaceNaApi(aluno.matricula);
    } catch (error) {
      console.warn(
        'Não foi possível excluir a face na API facial:',
        error instanceof Error ? error.message : String(error),
      );
    }

    await excluirAlunoPorId(id);

    res.json({
      success: true,
      message: 'Aluno excluído com sucesso.',
      aluno,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir aluno.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};