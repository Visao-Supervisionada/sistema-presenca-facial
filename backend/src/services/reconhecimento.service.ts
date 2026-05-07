import axios from 'axios';
import FormData from 'form-data';

import {
  RespostaEnrollFacial,
  RespostaReconhecimentoMultiplo,
} from '../types/reconhecimento.types';

const faceApiUrl = process.env.FACE_API_URL || 'http://localhost:8000';

export interface PessoaFacial {
  id: string;
  name: string;
  registration: string;
}

export async function cadastrarFaceNaApi(params: {
  nome: string;
  matricula: string;
  arquivo: Express.Multer.File;
}): Promise<RespostaEnrollFacial> {
  const formulario = new FormData();

  formulario.append('name', params.nome.trim());
  formulario.append('registration', params.matricula.trim());
  formulario.append('file', params.arquivo.buffer, {
    filename: params.arquivo.originalname,
    contentType: params.arquivo.mimetype,
  });

  const resposta = await axios.post<RespostaEnrollFacial>(
    `${faceApiUrl}/enroll`,
    formulario,
    {
      headers: formulario.getHeaders(),
      timeout: 30000,
    },
  );

  return resposta.data;
}

export async function reconhecerMultiplosRostos(params: {
  arquivo: Express.Multer.File;
  threshold?: number;
  minCosineThreshold?: number;
}): Promise<RespostaReconhecimentoMultiplo> {
  const formulario = new FormData();

  formulario.append('file', params.arquivo.buffer, {
    filename: params.arquivo.originalname,
    contentType: params.arquivo.mimetype,
  });
  
  const threshold = params.threshold ?? 0.7;
  const minCosineThreshold = params.minCosineThreshold ?? 0.35;

  formulario.append('threshold', String(threshold));
  formulario.append('min_cosine_threshold', String(minCosineThreshold));

  const resposta = await axios.post<RespostaReconhecimentoMultiplo>(
    `${faceApiUrl}/recognize-multiple`,
    formulario,
    {
      headers: formulario.getHeaders(),
      timeout: 30000,
    },
  );

  return resposta.data;
}

export async function listarPessoasNaApiFacial(): Promise<PessoaFacial[]> {
  const resposta = await axios.get<{
    total: number;
    people: PessoaFacial[];
  }>(`${faceApiUrl}/people`, {
    timeout: 15000,
  });

  return resposta.data.people;
}

export async function excluirFaceNaApi(matricula: string): Promise<{
  success: boolean;
  message: string;
  registration: string;
}> {
  const matriculaNormalizada = matricula.trim();

  const resposta = await axios.delete(
    `${faceApiUrl}/people/${encodeURIComponent(matriculaNormalizada)}`,
    {
      timeout: 15000,
    },
  );

  return resposta.data;
}

export async function limparTodasFacesNaApi(): Promise<{
  success: boolean;
  message: string;
}> {
  const resposta = await axios.delete(`${faceApiUrl}/people`, {
    timeout: 15000,
  });

  return resposta.data;
}