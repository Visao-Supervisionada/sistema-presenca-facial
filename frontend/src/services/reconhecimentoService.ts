const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export interface RegistroReconhecimentoBackend {
  reconhecimento: {
    bbox: number[];
    matched: boolean;
    name: string;
    registration: string;
    confidence: number;
    cosine_confidence?: number;
  };
  acao: 'entrada' | 'saida' | 'ja_finalizada' | 'aluno_nao_encontrado' | 'desconhecido';
  presenca?: {
    id?: string;
    alunoId: string;
    nome: string;
    matricula: string;
    data: string;
    horaEntrada?: string | null;
    horaSaida?: string | null;
    status: string;
    confidence?: number;
    origem: string;
  };
}

export interface RespostaPresencaReconhecimento {
  success: boolean;
  total_faces: number;
  classifier_loaded: boolean;
  registros: RegistroReconhecimentoBackend[];
}

export interface ReconhecimentoValidado {
  acao: 'reconhecido' | 'desconhecido' | 'aluno_nao_encontrado';
  alunoEncontrado: boolean;
  aluno?: {
    id: string;
    nome: string;
    matricula: string;
    turma: string;
    perfil: string;
  };
  reconhecimento: {
    bbox?: number[];
    matched: boolean;
    name: string;
    registration: string;
    confidence: number;
    cosine_confidence?: number;
  };
}

export interface RespostaValidarReconhecimento {
  success: boolean;
  total_faces: number;
  registros: ReconhecimentoValidado[];
}

function converterBase64ParaArquivo(base64: string, nomeArquivo: string): File {
  const partes = base64.split(',');
  const tipo = partes[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binario = atob(partes[1]);

  const arrayBuffer = new ArrayBuffer(binario.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let indice = 0; indice < binario.length; indice++) {
    uint8Array[indice] = binario.charCodeAt(indice);
  }

  return new File([arrayBuffer], nomeArquivo, {
    type: tipo,
  });
}

export async function registrarPresencaPorReconhecimento(
  imagemBase64: string,
): Promise<RespostaPresencaReconhecimento> {
  const formulario = new FormData();

  const arquivoImagem = converterBase64ParaArquivo(
    imagemBase64,
    `reconhecimento-${Date.now()}.jpg`,
  );

  formulario.append('file', arquivoImagem);

  const resposta = await fetch(`${BACKEND_URL}/api/presencas/reconhecimento`, {
    method: 'POST',
    body: formulario,
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.message || 'Erro ao processar reconhecimento.');
  }

  return resultado;
}

export async function validarReconhecimento(
  imagemBase64: string,
): Promise<RespostaValidarReconhecimento> {
  const formulario = new FormData();

  const arquivoImagem = converterBase64ParaArquivo(
    imagemBase64,
    `frame-${Date.now()}.jpg`,
  );

  formulario.append('file', arquivoImagem);

  const resposta = await fetch(`${BACKEND_URL}/api/reconhecimento/validar`, {
    method: 'POST',
    body: formulario,
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.message || 'Erro ao validar reconhecimento.');
  }

  return resultado;
}