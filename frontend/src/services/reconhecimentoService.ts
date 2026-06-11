const BACKEND_URL = ( import.meta.env.VITE_BACKEND_URL || "http://localhost:3000" ).replace(/\/$/, "");

export type AcaoReconhecimento =
  | "entrada"
  | "saida"
  | "ja_finalizada"
  | "aluno_nao_encontrado"
  | "desconhecido"
  | "em_aula"
  | "sem_horario"
  | "fora_da_janela"
  | "classificado"
  | "reconhecido";

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

export interface PresencaReconhecimento {
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
}

export interface RegistroReconhecimentoBackend {
  reconhecimento: ResultadoClassificacaoReconhecimento;
  acao: AcaoReconhecimento;
  presenca?: PresencaReconhecimento;
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
  reconhecimento: ResultadoClassificacaoReconhecimento;
}

export interface RespostaValidarReconhecimento {
  success: boolean;
  total_faces: number;
  registros: ReconhecimentoValidado[];
}

type ObjetoGenerico = Record<string, unknown>;

function ehObjeto(valor: unknown): valor is ObjetoGenerico {
  return typeof valor === "object" && valor !== null;
}

function lerString(
  objeto: ObjetoGenerico,
  chave: string,
  padrao = "",
): string {
  const valor = objeto[chave];

  if (typeof valor === "string") return valor;
  if (typeof valor === "number") return String(valor);

  return padrao;
}

function lerNumero(
  objeto: ObjetoGenerico,
  chave: string,
  padrao = 0,
): number {
  const valor = objeto[chave];

  if (typeof valor === "number" && Number.isFinite(valor)) {
    return valor;
  }

  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : padrao;
}

function lerBooleano(
  objeto: ObjetoGenerico,
  chave: string,
  padrao = false,
): boolean {
  const valor = objeto[chave];

  if (typeof valor === "boolean") return valor;
  if (typeof valor === "string") return valor === "true";
  if (typeof valor === "number") return valor > 0;

  return padrao;
}

function lerObjeto(
  objeto: ObjetoGenerico,
  chave: string,
): ObjetoGenerico | undefined {
  const valor = objeto[chave];

  return ehObjeto(valor) ? valor : undefined;
}

function lerArrayNumeros(
  objeto: ObjetoGenerico,
  chave: string,
): number[] {
  const valor = objeto[chave];

  if (!Array.isArray(valor)) return [];

  return valor
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
}

function normalizarAcao(
  valor: unknown,
  padrao: AcaoReconhecimento = "desconhecido",
): AcaoReconhecimento {
  const acoesValidas: AcaoReconhecimento[] = [
    "entrada",
    "saida",
    "ja_finalizada",
    "aluno_nao_encontrado",
    "desconhecido",
    "em_aula",
    "sem_horario",
    "fora_da_janela",
    "classificado",
    "reconhecido",
  ];

  if (typeof valor === "string" && acoesValidas.includes(valor as AcaoReconhecimento)) {
    return valor as AcaoReconhecimento;
  }

  return padrao;
}

function normalizarAcaoValidacao(
  valor: unknown,
  padrao: ReconhecimentoValidado["acao"] = "desconhecido",
): ReconhecimentoValidado["acao"] {
  const acoesValidas: ReconhecimentoValidado["acao"][] = [
    "entrada",
    "saida",
    "ja_finalizada",
    "reconhecido",
    "desconhecido",
    "aluno_nao_encontrado",
    "em_aula",
    "sem_horario",
    "fora_da_janela",
  ];

  if (typeof valor === "string" && acoesValidas.includes(valor as ReconhecimentoValidado["acao"])) {
    return valor as ReconhecimentoValidado["acao"];
  }

  return padrao;
}

function converterBase64ParaArquivo(base64: string, nomeArquivo: string): File {
  if (!base64.trim()) {
    throw new Error("Imagem inválida ou vazia.");
  }

  const temCabecalho = base64.includes(",");
  const cabecalho = temCabecalho ? base64.split(",")[0] : "data:image/jpeg;base64";
  const conteudoBase64 = temCabecalho ? base64.split(",")[1] : base64;

  if (!conteudoBase64) {
    throw new Error("Não foi possível ler a imagem capturada.");
  }

  const tipo = cabecalho.match(/:(.*?);/)?.[1] || "image/jpeg";
  const binario = atob(conteudoBase64);
  const bytes = new Uint8Array(binario.length);

  for (let indice = 0; indice < binario.length; indice++) {
    bytes[indice] = binario.charCodeAt(indice);
  }

  return new File([bytes], nomeArquivo, {
    type: tipo,
  });
}

function criarFormularioComImagem(
  imagemBase64: string,
  nomeArquivo: string,
): FormData {
  const formulario = new FormData();
  const arquivoImagem = converterBase64ParaArquivo(imagemBase64, nomeArquivo);

  formulario.append("file", arquivoImagem);

  return formulario;
}

async function lerRespostaJson(
  resposta: Response,
  mensagemErroPadrao: string,
): Promise<ObjetoGenerico> {
  const texto = await resposta.text();
  const json = texto ? JSON.parse(texto) : {};

  if (!ehObjeto(json)) {
    throw new Error("Resposta inválida do servidor.");
  }

  if (!resposta.ok) {
    throw new Error(lerString(json, "message", mensagemErroPadrao));
  }

  return json;
}

function normalizarReconhecimento(
  valor: unknown,
): ResultadoClassificacaoReconhecimento {
  const objeto = ehObjeto(valor) ? valor : {};
  const pessoa = lerObjeto(objeto, "person");

  const nome =
    lerString(objeto, "name") ||
    lerString(objeto, "nome") ||
    (pessoa ? lerString(pessoa, "name") : "") ||
    (pessoa ? lerString(pessoa, "nome") : "") ||
    "Desconhecido";

  const matricula =
    lerString(objeto, "registration") ||
    lerString(objeto, "matricula") ||
    (pessoa ? lerString(pessoa, "registration") : "") ||
    (pessoa ? lerString(pessoa, "matricula") : "");

  const matched =
    typeof objeto.matched === "boolean"
      ? objeto.matched
      : typeof objeto.match === "boolean"
        ? objeto.match
        : Boolean(matricula);

  const bbox = lerArrayNumeros(objeto, "bbox");
  const box = lerArrayNumeros(objeto, "box");
  const boundingBox = lerArrayNumeros(objeto, "bounding_box");

  return {
    bbox: bbox.length ? bbox : box.length ? box : boundingBox,
    matched,
    name: nome,
    registration: matricula,
    confidence:
      lerNumero(objeto, "confidence") ||
      lerNumero(objeto, "score") ||
      lerNumero(objeto, "similarity"),
    cosine_confidence:
      lerNumero(objeto, "cosine_confidence") ||
      lerNumero(objeto, "cosineConfidence"),
  };
}

function normalizarResultadosClassificacao(
  resultado: ObjetoGenerico,
): ResultadoClassificacaoReconhecimento[] {
  if (Array.isArray(resultado.results)) {
    return resultado.results.map(normalizarReconhecimento);
  }

  if (Array.isArray(resultado.registros)) {
    return resultado.registros.map((registro) => {
      if (!ehObjeto(registro)) {
        return normalizarReconhecimento(registro);
      }

      return normalizarReconhecimento(registro.reconhecimento || registro);
    });
  }

  return [];
}

function normalizarPresenca(valor: unknown): PresencaReconhecimento | undefined {
  if (!ehObjeto(valor)) return undefined;

  return {
    id: lerString(valor, "id") || undefined,
    alunoId: lerString(valor, "alunoId"),
    nome: lerString(valor, "nome"),
    matricula: lerString(valor, "matricula"),
    data: lerString(valor, "data"),
    horaEntrada: lerString(valor, "horaEntrada") || null,
    horaSaida: lerString(valor, "horaSaida") || null,
    status: lerString(valor, "status"),
    confidence: lerNumero(valor, "confidence"),
    origem: lerString(valor, "origem"),
  };
}

function normalizarRegistroPresenca(
  valor: unknown,
): RegistroReconhecimentoBackend {
  const objeto = ehObjeto(valor) ? valor : {};
  const reconhecimento = normalizarReconhecimento(
    objeto.reconhecimento || objeto,
  );

  return {
    reconhecimento,
    acao: normalizarAcao(
      objeto.acao,
      reconhecimento.matched ? "classificado" : "desconhecido",
    ),
    presenca: normalizarPresenca(objeto.presenca),
  };
}

function normalizarRespostaPresenca(
  resultado: ObjetoGenerico,
): RespostaPresencaReconhecimento {
  const registros: RegistroReconhecimentoBackend[] = Array.isArray(resultado.registros)
    ? resultado.registros.map(normalizarRegistroPresenca)
    : normalizarResultadosClassificacao(resultado).map(
        (reconhecimento): RegistroReconhecimentoBackend => ({
          reconhecimento,
          acao: reconhecimento.matched ? "classificado" : "desconhecido",
        }),
      );

  return {
    success: lerBooleano(resultado, "success", true),
    total_faces: lerNumero(resultado, "total_faces", registros.length),
    classifier_loaded: lerBooleano(resultado, "classifier_loaded", true),
    registros,
  };
}

function normalizarRespostaValidacao(
  resultado: ObjetoGenerico,
): RespostaValidarReconhecimento {
  const registrosOriginais = Array.isArray(resultado.registros)
    ? resultado.registros
    : [];

  const registros = registrosOriginais.map((registro): ReconhecimentoValidado => {
    const objeto = ehObjeto(registro) ? registro : {};
    const reconhecimento = normalizarReconhecimento(
      objeto.reconhecimento || objeto,
    );

    const alunoBruto = lerObjeto(objeto, "aluno");

    const aluno = alunoBruto
      ? {
          id: lerString(alunoBruto, "id"),
          nome: lerString(alunoBruto, "nome"),
          matricula: lerString(alunoBruto, "matricula"),
          turma: lerString(alunoBruto, "turma"),
          perfil: lerString(alunoBruto, "perfil"),
        }
      : undefined;

    return {
      acao: normalizarAcaoValidacao(
        objeto.acao,
        reconhecimento.matched ? "reconhecido" : "desconhecido",
      ),
      alunoEncontrado: lerBooleano(objeto, "alunoEncontrado", Boolean(aluno)),
      aluno,
      reconhecimento,
    };
  });

  return {
    success: lerBooleano(resultado, "success", true),
    total_faces: lerNumero(resultado, "total_faces", registros.length),
    registros,
  };
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

  const resultado = await lerRespostaJson(
    resposta,
    "Erro ao classificar reconhecimento.",
  );

  const results = normalizarResultadosClassificacao(resultado);

  return {
    success: lerBooleano(resultado, "success", true),
    total_faces: lerNumero(resultado, "total_faces", results.length),
    classifier_loaded: lerBooleano(resultado, "classifier_loaded", true),
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

  formulario.append("threshold", "0.6");
  formulario.append("minCosineThreshold", "0.35");

  const resposta = await fetch(`${BACKEND_URL}/api/presencas/reconhecimento`, {
    method: "POST",
    body: formulario,
  });

  const resultado = await lerRespostaJson(
    resposta,
    "Erro ao registrar presença por reconhecimento.",
  );

  return normalizarRespostaPresenca(resultado);
}

export async function validarReconhecimento(
  imagemBase64: string,
): Promise<RespostaValidarReconhecimento> {
  const formulario = criarFormularioComImagem(
    imagemBase64,
    `frame-validar-${Date.now()}.jpg`,
  );

  formulario.append("threshold", "0.6");
  formulario.append("minCosineThreshold", "0.35");

  const resposta = await fetch(`${BACKEND_URL}/api/reconhecimento/validar`, {
    method: "POST",
    body: formulario,
  });

  const resultado = await lerRespostaJson(
    resposta,
    "Erro ao validar reconhecimento.",
  );

  return normalizarRespostaValidacao(resultado);
}