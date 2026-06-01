const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export interface ResultadoClassificacaoReconhecimento {
  bbox: number[];
  matched: boolean;
  name: string;
  registration: string;
  confidence: number;
  cosine_confidence?: number;
}

export interface RespostaClassificarReconhecimento {
  success: boolean;
  total_faces: number;
  classifier_loaded: boolean;
  results: ResultadoClassificacaoReconhecimento[];
}

export interface RegistroReconhecimentoBackend {
  reconhecimento: {
    bbox: number[];
    matched: boolean;
    name: string;
    registration: string;
    confidence: number;
    cosine_confidence?: number;
  };
  acao:
    | "entrada"
    | "saida"
    | "ja_finalizada"
    | "aluno_nao_encontrado"
    | "desconhecido"
    | "em_aula"
    | "sem_horario"
    | "fora_da_janela"
    | "classificado";
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
  acao:
    | "entrada"
    | "saida"
    | "ja_finalizada"
    | "reconhecido"
    | "desconhecido"
    | "aluno_nao_encontrado"
    | "em_aula"
    | "sem_horario"
    | "fora_da_janela";
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
  const partes = base64.split(",");
  const tipo = partes[0].match(/:(.*?);/)?.[1] || "image/jpeg";
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

function criarFormularioComImagem(
  imagemBase64: string,
  nomeArquivo: string,
): FormData {
  const formulario = new FormData();

  const arquivoImagem = converterBase64ParaArquivo(
    imagemBase64,
    nomeArquivo,
  );

  formulario.append("file", arquivoImagem);

  return formulario;
}

function normalizarResultadosClassificacao(
  resultado: any,
): ResultadoClassificacaoReconhecimento[] {
  if (Array.isArray(resultado.results)) {
    return resultado.results;
  }

  if (Array.isArray(resultado.registros)) {
    return resultado.registros.map((registro: any) => {
      const reconhecimento = registro.reconhecimento || registro;

      return {
        bbox: reconhecimento.bbox || [],
        matched: Boolean(reconhecimento.matched),
        name: reconhecimento.name || "Desconhecido",
        registration: reconhecimento.registration || "",
        confidence: reconhecimento.confidence || 0,
        cosine_confidence: reconhecimento.cosine_confidence || 0,
      };
    });
  }

  return [];
}

export async function classificarReconhecimento(
  imagemBase64: string,
): Promise<RespostaClassificarReconhecimento> {
  const formulario = criarFormularioComImagem(
    imagemBase64,
    `frame-classificar-${Date.now()}.jpg`,
  );

  formulario.append("threshold", "0.6");
  formulario.append("minCosineThreshold", "0.35");

  const resposta = await fetch(`${BACKEND_URL}/api/reconhecimento/classificar`, {
    method: "POST",
    body: formulario,
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.message || "Erro ao classificar reconhecimento.");
  }

  const results = normalizarResultadosClassificacao(resultado);

  return {
    success: Boolean(resultado.success),
    total_faces: resultado.total_faces ?? results.length,
    classifier_loaded: resultado.classifier_loaded ?? true,
    results,
  };
}

export async function registrarPresencaPorReconhecimento(
  imagemBase64: string,
): Promise<RespostaPresencaReconhecimento> {
  const formulario = criarFormularioComImagem(
    imagemBase64,
    `reconhecimento-${Date.now()}.jpg`,
  );

  const resposta = await fetch(`${BACKEND_URL}/api/presencas/reconhecimento`, {
    method: "POST",
    body: formulario,
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.message || "Erro ao processar reconhecimento.");
  }

  return resultado;
}

export async function validarReconhecimento(
  imagemBase64: string,
): Promise<RespostaValidarReconhecimento> {
  const formulario = criarFormularioComImagem(
    imagemBase64,
    `frame-validar-${Date.now()}.jpg`,
  );

  const resposta = await fetch(`${BACKEND_URL}/api/reconhecimento/validar`, {
    method: "POST",
    body: formulario,
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.message || "Erro ao validar reconhecimento.");
  }

  return resultado;
}