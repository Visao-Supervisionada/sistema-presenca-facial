import { db, timestampServidor } from "../config/firebase";
import { buscarAlunoPorMatricula } from "./alunos.service";
import { CriarHorarioDTO, DiaSemana, Horario } from "../types/horario.types";

const FUSO_HORARIO = "America/Manaus";

const colecaoHorarios = db.collection("horarios");
const colecaoPresencas = db.collection("presencas");
const colecaoDiario = db.collection("diario");
const colecaoJustificativas = db.collection("justificativas");

const DIAS_SEMANA: DiaSemana[] = [
  "domingo",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
];

function normalizarTexto(valor: string): string {
  return String(valor).trim();
}

function normalizarDiaSemana(valor: string): DiaSemana {
  const diaNormalizado = String(valor)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace("-feira", "") as DiaSemana;

  if (!DIAS_SEMANA.includes(diaNormalizado)) {
    throw new Error(`Dia da semana inválido: ${valor}`);
  }

  return diaNormalizado;
}

function validarHorario(valor: string, nomeCampo: string): string {
  const horario = normalizarTexto(valor);

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(horario)) {
    throw new Error(`${nomeCampo} deve estar no formato HH:mm.`);
  }

  return horario;
}

function obterDataAtual(): string {
  return new Intl.DateTimeFormat("sv", {
    timeZone: FUSO_HORARIO,
  }).format(new Date());
}

function obterDiaSemanaPorData(data: string): DiaSemana {
  const [ano, mes, dia] = data.split("-").map(Number);
  const indiceDia = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();

  return DIAS_SEMANA[indiceDia];
}

function timestampParaMillis(valor: unknown): number {
  if (
    valor &&
    typeof valor === "object" &&
    "toMillis" in valor &&
    typeof valor.toMillis === "function"
  ) {
    return valor.toMillis();
  }

  return 0;
}

function ordenarHorariosMaisRecentesPrimeiro(a: Horario, b: Horario): number {
  const atualizadoA = timestampParaMillis(a.atualizadoEm);
  const atualizadoB = timestampParaMillis(b.atualizadoEm);

  if (atualizadoA !== atualizadoB) {
    return atualizadoB - atualizadoA;
  }

  const criadoA = timestampParaMillis(a.criadoEm);
  const criadoB = timestampParaMillis(b.criadoEm);

  return criadoB - criadoA;
}

async function desativarHorariosAtivosDaMatriculaNoDia(params: {
  matricula: string;
  diaSemana: DiaSemana;
}): Promise<void> {
  const snapshot = await colecaoHorarios
    .where("matricula", "==", params.matricula)
    .where("diaSemana", "==", params.diaSemana)
    .where("ativo", "==", true)
    .get();

  if (snapshot.empty) return;

  const lote = db.batch();

  snapshot.docs.forEach((documento) => {
    lote.update(documento.ref, {
      ativo: false,
      atualizadoEm: timestampServidor(),
    });
  });

  await lote.commit();
}

async function limparFrequenciaDoHorarioDeHoje(horario: Horario): Promise<{
  presencasRemovidas: number;
  diarioRemovido: boolean;
  justificativasRemovidas: number;
}> {
  const dataHoje = obterDataAtual();
  const diaSemanaHoje = obterDiaSemanaPorData(dataHoje);
  const diaSemanaHorario = normalizarDiaSemana(horario.diaSemana);

  if (diaSemanaHoje !== diaSemanaHorario) {
    return {
      presencasRemovidas: 0,
      diarioRemovido: false,
      justificativasRemovidas: 0,
    };
  }

  const matricula = normalizarTexto(horario.matricula);
  const aluno = await buscarAlunoPorMatricula(matricula);

  const snapshotPresencas = await colecaoPresencas
    .where("matricula", "==", matricula)
    .where("data", "==", dataHoje)
    .get();

  const idDiario = `${matricula}_${dataHoje}`;
  const referenciaDiario = colecaoDiario.doc(idDiario);
  const documentoDiario = await referenciaDiario.get();

  const snapshotJustificativas = aluno
    ? await colecaoJustificativas
        .where("alunoId", "==", aluno.id)
        .where("data", "==", dataHoje)
        .get()
    : null;

  const lote = db.batch();
  let operacoes = 0;

  for (const documento of snapshotPresencas.docs) {
    lote.delete(documento.ref);
    operacoes++;
  }

  if (documentoDiario.exists) {
    lote.delete(referenciaDiario);
    operacoes++;
  }

  if (snapshotJustificativas) {
    for (const documento of snapshotJustificativas.docs) {
      lote.delete(documento.ref);
      operacoes++;
    }
  }

  if (operacoes > 0) {
    await lote.commit();
  }

  return {
    presencasRemovidas: snapshotPresencas.size,
    diarioRemovido: documentoDiario.exists,
    justificativasRemovidas: snapshotJustificativas?.size ?? 0,
  };
}

export async function criarHorario(dados: CriarHorarioDTO): Promise<Horario> {
  const matricula = normalizarTexto(dados.matricula);
  const nome = normalizarTexto(dados.nome);
  const turma = normalizarTexto(dados.turma);
  const diaSemana = normalizarDiaSemana(dados.diaSemana);

  const horaEntrada = validarHorario(dados.horaEntrada, "horaEntrada");
  const horaLimiteEntrada = validarHorario(
    dados.horaLimiteEntrada,
    "horaLimiteEntrada",
  );
  const horaSaida = validarHorario(dados.horaSaida, "horaSaida");

  if (!matricula || !nome || !turma) {
    throw new Error("Matrícula, nome e turma são obrigatórios.");
  }

  await desativarHorariosAtivosDaMatriculaNoDia({
    matricula,
    diaSemana,
  });

  const referencia = colecaoHorarios.doc();

  const horario: Horario = {
    id: referencia.id,
    matricula,
    nome,
    turma,
    diaSemana,
    horaEntrada,
    horaLimiteEntrada,
    horaSaida,
    ativo: true,
    criadoEm: timestampServidor(),
    atualizadoEm: timestampServidor(),
  };

  await referencia.set(horario);

  return horario;
}

export async function listarHorarios(params?: {
  turma?: string;
  matricula?: string;
  diaSemana?: DiaSemana;
}): Promise<Horario[]> {
  let consulta: FirebaseFirestore.Query = colecaoHorarios.where(
    "ativo",
    "==",
    true,
  );

  if (params?.turma) {
    consulta = consulta.where("turma", "==", normalizarTexto(params.turma));
  }

  if (params?.matricula) {
    consulta = consulta.where(
      "matricula",
      "==",
      normalizarTexto(params.matricula),
    );
  }

  if (params?.diaSemana) {
    consulta = consulta.where(
      "diaSemana",
      "==",
      normalizarDiaSemana(params.diaSemana),
    );
  }

  const snapshot = await consulta.get();

  return snapshot.docs
    .map((documento) => documento.data() as Horario)
    .sort(ordenarHorariosMaisRecentesPrimeiro);
}

export async function buscarHorarioPorMatriculaEDia(params: {
  matricula: string;
  diaSemana: DiaSemana;
}): Promise<Horario | null> {
  const matricula = normalizarTexto(params.matricula);
  const diaSemana = normalizarDiaSemana(params.diaSemana);

  const snapshot = await colecaoHorarios
    .where("matricula", "==", matricula)
    .where("diaSemana", "==", diaSemana)
    .where("ativo", "==", true)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const horarios = snapshot.docs
    .map((documento) => documento.data() as Horario)
    .sort(ordenarHorariosMaisRecentesPrimeiro);

  return horarios[0] ?? null;
}

export async function excluirHorario(id: string): Promise<{
  horarioRemovido: boolean;
  frequenciaResetada: {
    presencasRemovidas: number;
    diarioRemovido: boolean;
    justificativasRemovidas: number;
  };
}> {
  const referencia = colecaoHorarios.doc(id);
  const documento = await referencia.get();

  if (!documento.exists) {
    return {
      horarioRemovido: false,
      frequenciaResetada: {
        presencasRemovidas: 0,
        diarioRemovido: false,
        justificativasRemovidas: 0,
      },
    };
  }

  const horario = documento.data() as Horario;

  const frequenciaResetada = await limparFrequenciaDoHorarioDeHoje(horario);

  await referencia.delete();

  return {
    horarioRemovido: true,
    frequenciaResetada,
  };
}