import { db } from "../config/firebase";
import { buscarAlunoPorMatricula } from "./alunos.service";
import {
  confirmarEntrada as confirmarEntradaDiario,
  confirmarSaida as confirmarSaidaDiario,
} from "./diario.service";
import { buscarHorarioPorMatriculaEDia } from "./horarios.service";
import { Presenca } from "../types/presenca.types";
import { DiaSemana } from "../types/horario.types";

const FUSO_HORARIO = "America/Manaus";
const MINUTOS_DIA = 24 * 60;

const colecaoPresencas = db.collection("presencas");
const colecaoDiario = db.collection("diario");
const colecaoJustificativas = db.collection("justificativas");

type AcaoPresenca =
  | "entrada"
  | "saida"
  | "ja_finalizada"
  | "aluno_nao_encontrado"
  | "em_aula"
  | "sem_horario"
  | "fora_da_janela";

function normalizarMinutos(minutos: number): number {
  return ((minutos % MINUTOS_DIA) + MINUTOS_DIA) % MINUTOS_DIA;
}

function horaParaMinutos(hora: string): number {
  const [hhTexto, mmTexto] = String(hora).split(":");

  const horas = Number(hhTexto);
  const minutos = Number(mmTexto);

  if (!Number.isFinite(horas) || !Number.isFinite(minutos)) {
    throw new Error(`Horário inválido: ${hora}`);
  }

  return horas * 60 + minutos;
}

function estaDentroDoIntervalo(
  agora: number,
  inicio: number,
  fim: number,
): boolean {
  const agoraNormalizado = normalizarMinutos(agora);
  const inicioNormalizado = normalizarMinutos(inicio);
  const fimNormalizado = normalizarMinutos(fim);

  if (inicioNormalizado <= fimNormalizado) {
    return (
      agoraNormalizado >= inicioNormalizado &&
      agoraNormalizado <= fimNormalizado
    );
  }

  return (
    agoraNormalizado >= inicioNormalizado ||
    agoraNormalizado <= fimNormalizado
  );
}

function obterDataAtual(): string {
  return new Intl.DateTimeFormat("sv", {
    timeZone: FUSO_HORARIO,
  }).format(new Date());
}

function obterHoraAtual(): string {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: FUSO_HORARIO,
  });
}

function obterDiaSemanaPorData(data: string): DiaSemana {
  const [ano, mes, dia] = data.split("-").map(Number);
  const indiceDia = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();

  const dias: DiaSemana[] = [
    "domingo",
    "segunda",
    "terca",
    "quarta",
    "quinta",
    "sexta",
    "sabado",
  ];

  return dias[indiceDia];
}

function obterDiaSemanaAtual(): DiaSemana {
  return obterDiaSemanaPorData(obterDataAtual());
}

function horaAtualEmMinutos(): number {
  const horaAtual = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSO_HORARIO,
  });

  return horaParaMinutos(horaAtual);
}

/**
 * Entrada:
 * - Antes da horaEntrada: fora_da_janela
 * - De horaEntrada até horaSaida: permite registrar entrada
 * - O diário decide se é presente ou atrasado usando horaLimiteEntrada
 */
function estaEmJanelaDeEntrada(
  horaEntrada: string,
  horaSaida: string,
): boolean {
  const agora = horaAtualEmMinutos();
  const inicioJanela = horaParaMinutos(horaEntrada);
  const fimJanela = horaParaMinutos(horaSaida);

  return estaDentroDoIntervalo(agora, inicioJanela, fimJanela);
}

/**
 * Saída:
 * - Da horaSaida até 30 minutos depois: permite registrar saída
 */
function estaEmJanelaDeSaida(horaSaida: string): boolean {
  const agora = horaAtualEmMinutos();
  const inicioJanela = horaParaMinutos(horaSaida);
  const fimJanela = inicioJanela + 30;

  return estaDentroDoIntervalo(agora, inicioJanela, fimJanela);
}

async function sincronizarEntradaNoDiario(params: {
  matricula: string;
  data: string;
  confidence: number;
}): Promise<void> {
  await confirmarEntradaDiario({
    matricula: params.matricula,
    data: params.data,
    origem: "reconhecimento_facial",
    confidence: params.confidence,
  });
}

async function tentarSincronizarSaidaNoDiario(params: {
  matricula: string;
  data: string;
  confidence: number;
}): Promise<void> {
  try {
    await confirmarSaidaDiario({
      matricula: params.matricula,
      data: params.data,
      origem: "reconhecimento_facial",
      confidence: params.confidence,
    });
  } catch (error) {
    console.warn(
      "[PRESENÇAS] Não foi possível sincronizar saída no diário:",
      error,
    );
  }
}

async function garantirDiarioSincronizado(params: {
  matricula: string;
  data: string;
  confidence: number;
  sincronizarSaida: boolean;
}): Promise<void> {
  await sincronizarEntradaNoDiario({
    matricula: params.matricula,
    data: params.data,
    confidence: params.confidence,
  });

  if (params.sincronizarSaida) {
    await tentarSincronizarSaidaNoDiario({
      matricula: params.matricula,
      data: params.data,
      confidence: params.confidence,
    });
  }
}

export async function registrarPresencaPorMatricula(params: {
  matricula: string;
  confidence: number;
}): Promise<{
  acao: AcaoPresenca;
  presenca?: Presenca;
}> {
  const matricula = String(params.matricula).trim();

  const aluno = await buscarAlunoPorMatricula(matricula);

  if (!aluno) {
    return { acao: "aluno_nao_encontrado" };
  }

  const dataHoje = obterDataAtual();
  const diaSemana = obterDiaSemanaAtual();

  const horario = await buscarHorarioPorMatriculaEDia({
    matricula: aluno.matricula,
    diaSemana,
  });

  if (!horario) {
    return { acao: "sem_horario" };
  }

  const dentroDaJanelaDeEntrada = estaEmJanelaDeEntrada(
    horario.horaEntrada,
    horario.horaSaida,
  );

  const dentroDaJanelaDeSaida = estaEmJanelaDeSaida(horario.horaSaida);

  const foraDeTodasAsJanelas =
    !dentroDaJanelaDeEntrada && !dentroDaJanelaDeSaida;

  const snapshot = await colecaoPresencas
    .where("alunoId", "==", aluno.id)
    .where("data", "==", dataHoje)
    .limit(1)
    .get();

  if (snapshot.empty) {
    if (!dentroDaJanelaDeEntrada) {
      return { acao: "fora_da_janela" };
    }

    const referencia = colecaoPresencas.doc();

    const novaPresenca: Presenca = {
      id: referencia.id,
      alunoId: aluno.id,
      nome: aluno.nome,
      matricula: aluno.matricula,
      data: dataHoje,
      horaEntrada: obterHoraAtual(),
      horaSaida: null,
      status: "presente",
      confidence: params.confidence,
      origem: "reconhecimento_facial",
    };

    await referencia.set(novaPresenca);

    await sincronizarEntradaNoDiario({
      matricula: aluno.matricula,
      data: dataHoje,
      confidence: params.confidence,
    });

    return {
      acao: "entrada",
      presenca: novaPresenca,
    };
  }

  const documentoPresenca = snapshot.docs[0];

  if (!documentoPresenca) {
    return { acao: "aluno_nao_encontrado" };
  }

  const presencaAtual = documentoPresenca.data() as Presenca;
  if (foraDeTodasAsJanelas) {
    return {
      acao: "fora_da_janela",
      presenca: presencaAtual,
    };
  }

  if (presencaAtual.horaEntrada && !presencaAtual.horaSaida) {
    if (!dentroDaJanelaDeSaida) {
      await sincronizarEntradaNoDiario({
        matricula: aluno.matricula,
        data: dataHoje,
        confidence: params.confidence,
      });

      return {
        acao: "em_aula",
        presenca: presencaAtual,
      };
    }

    const presencaAtualizada: Presenca = {
      ...presencaAtual,
      horaSaida: obterHoraAtual(),
      status: "saida_registrada",
      confidence: params.confidence,
    };

    await documentoPresenca.ref.update({
      horaSaida: presencaAtualizada.horaSaida,
      status: presencaAtualizada.status,
      confidence: presencaAtualizada.confidence,
    });

    await garantirDiarioSincronizado({
      matricula: aluno.matricula,
      data: dataHoje,
      confidence: params.confidence,
      sincronizarSaida: true,
    });

    return {
      acao: "saida",
      presenca: presencaAtualizada,
    };
  }

  if (presencaAtual.horaEntrada && presencaAtual.horaSaida) {
    await garantirDiarioSincronizado({
      matricula: aluno.matricula,
      data: dataHoje,
      confidence: params.confidence,
      sincronizarSaida: true,
    });

    return {
      acao: "ja_finalizada",
      presenca: presencaAtual,
    };
  }

  await garantirDiarioSincronizado({
    matricula: aluno.matricula,
    data: dataHoje,
    confidence: params.confidence,
    sincronizarSaida: Boolean(presencaAtual.horaSaida),
  });

  return {
    acao: "ja_finalizada",
    presenca: presencaAtual,
  };
}

export async function listarPresencas(): Promise<Presenca[]> {
  const snapshot = await colecaoPresencas
    .orderBy("data", "desc")
    .limit(100)
    .get();

  return snapshot.docs.map((documento) => documento.data() as Presenca);
}

export async function resetarPresencaPorMatriculaEData(params: {
  matricula: string;
  data: string;
}): Promise<{
  presencasRemovidas: number;
  diarioRemovido: boolean;
  justificativasRemovidas: number;
}> {
  const matricula = String(params.matricula).trim();
  const data = String(params.data).trim();

  if (!matricula || !data) {
    throw new Error("Matrícula e data são obrigatórias.");
  }

  const aluno = await buscarAlunoPorMatricula(matricula);

  const lote = db.batch();
  let operacoes = 0;

  /**
   * Remove registros da coleção "presencas".
   * Aqui apagamos por matrícula/data e também por alunoId/data,
   * porque alguns registros podem ter sido salvos usando o ID do aluno.
   */
  const snapshotPresencasPorMatricula = await colecaoPresencas
    .where("matricula", "==", matricula)
    .where("data", "==", data)
    .get();

  const snapshotPresencasPorAlunoId = aluno
    ? await colecaoPresencas
        .where("alunoId", "==", aluno.id)
        .where("data", "==", data)
        .get()
    : null;

  const idsPresencasRemovidas = new Set<string>();

  for (const documento of snapshotPresencasPorMatricula.docs) {
    if (!idsPresencasRemovidas.has(documento.id)) {
      lote.delete(documento.ref);
      idsPresencasRemovidas.add(documento.id);
      operacoes++;
    }
  }

  if (snapshotPresencasPorAlunoId) {
    for (const documento of snapshotPresencasPorAlunoId.docs) {
      if (!idsPresencasRemovidas.has(documento.id)) {
        lote.delete(documento.ref);
        idsPresencasRemovidas.add(documento.id);
        operacoes++;
      }
    }
  }

  /**
   * Remove registros da coleção "diario".
   * A tela de frequência normalmente lê essa coleção.
   * Por isso apagamos por:
   * - ID fixo: matricula_data
   * - matrícula + data
   * - alunoId + data
   */
  const idDiario = `${matricula}_${data}`;
  const referenciaDiario = colecaoDiario.doc(idDiario);
  const documentoDiarioPorId = await referenciaDiario.get();

  const snapshotDiarioPorMatricula = await colecaoDiario
    .where("matricula", "==", matricula)
    .where("data", "==", data)
    .get();

  const snapshotDiarioPorAlunoId = aluno
    ? await colecaoDiario
        .where("alunoId", "==", aluno.id)
        .where("data", "==", data)
        .get()
    : null;

  const idsDiarioRemovidos = new Set<string>();

  if (documentoDiarioPorId.exists) {
    lote.delete(referenciaDiario);
    idsDiarioRemovidos.add(referenciaDiario.id);
    operacoes++;
  }

  for (const documento of snapshotDiarioPorMatricula.docs) {
    if (!idsDiarioRemovidos.has(documento.id)) {
      lote.delete(documento.ref);
      idsDiarioRemovidos.add(documento.id);
      operacoes++;
    }
  }

  if (snapshotDiarioPorAlunoId) {
    for (const documento of snapshotDiarioPorAlunoId.docs) {
      if (!idsDiarioRemovidos.has(documento.id)) {
        lote.delete(documento.ref);
        idsDiarioRemovidos.add(documento.id);
        operacoes++;
      }
    }
  }

  /**
   Remove justificativas vinculadas a mesma matrícula/data.
   */
  const snapshotJustificativasPorMatricula = await colecaoJustificativas
    .where("matricula", "==", matricula)
    .where("data", "==", data)
    .get();

  const snapshotJustificativasPorAlunoId = aluno
    ? await colecaoJustificativas
        .where("alunoId", "==", aluno.id)
        .where("data", "==", data)
        .get()
    : null;

  const idsJustificativasRemovidas = new Set<string>();

  for (const documento of snapshotJustificativasPorMatricula.docs) {
    if (!idsJustificativasRemovidas.has(documento.id)) {
      lote.delete(documento.ref);
      idsJustificativasRemovidas.add(documento.id);
      operacoes++;
    }
  }

  if (snapshotJustificativasPorAlunoId) {
    for (const documento of snapshotJustificativasPorAlunoId.docs) {
      if (!idsJustificativasRemovidas.has(documento.id)) {
        lote.delete(documento.ref);
        idsJustificativasRemovidas.add(documento.id);
        operacoes++;
      }
    }
  }

  if (operacoes > 0) {
    await lote.commit();
  }

  return {
    presencasRemovidas: idsPresencasRemovidas.size,
    diarioRemovido: idsDiarioRemovidos.size > 0,
    justificativasRemovidas: idsJustificativasRemovidas.size,
  };
}