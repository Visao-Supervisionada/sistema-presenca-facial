import { db, timestampServidor } from "../config/firebase";
import {
  JustificativaFalta,
  PresencaDoDia,
  PresencaMensalAluno,
  RegistroDiario,
  RespostaDiarioMensal,
  StatusEntrada,
  StatusPresencaMensal,
  TotaisMensais,
} from "../types/diario.types";
import { DiaSemana, Horario } from "../types/horario.types";
import {
  buscarAlunoPorMatricula,
  listarAlunosPorTurma,
} from "./alunos.service";
import { buscarHorarioPorMatriculaEDia } from "./horarios.service";

const FUSO_HORARIO = "America/Manaus";
const MINUTOS_DIA = 24 * 60;

const colecaoHorarios = db.collection("horarios");
const colecaoDiario = db.collection("diario");
const colecaoJustificativas = db.collection("justificativas");

function removerCamposIndefinidos<T extends object>(objeto: T): T {
  return Object.fromEntries(
    Object.entries(objeto).filter(([, valor]) => valor !== undefined),
  ) as T;
}

function normalizarMinutos(minutos: number): number {
  return ((minutos % MINUTOS_DIA) + MINUTOS_DIA) % MINUTOS_DIA;
}

function obterDataAtual(): string {
  return new Intl.DateTimeFormat("sv", {
    timeZone: FUSO_HORARIO,
  }).format(new Date());
}

function formatarDataManaus(data: Date): string {
  return new Intl.DateTimeFormat("sv", {
    timeZone: FUSO_HORARIO,
  }).format(data);
}

function obterDiaSemana(data: string): DiaSemana {
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

function obterHoraAtual(): string {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: FUSO_HORARIO,
  });
}

function criarIdDiario(matricula: string, data: string): string {
  return `${String(matricula).trim()}_${data}`;
}

function horaParaMinutos(hora: string): number {
  const [horasTexto, minutosTexto] = String(hora || "00:00").split(":");

  const horas = Number(horasTexto);
  const minutos = Number(minutosTexto);

  if (!Number.isFinite(horas) || !Number.isFinite(minutos)) {
    return 0;
  }

  return horas * 60 + minutos;
}

function minutosParaHora(totalMinutos: number): string {
  const minutosNormalizados = normalizarMinutos(totalMinutos);
  const horas = Math.floor(minutosNormalizados / 60);
  const minutos = minutosNormalizados % 60;

  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

function calcularHoraLimiteComTolerancia(horaEntrada: string): string {
  const tolerancia = Number.parseInt(
    process.env.TOLERANCIA_ATRASO_MINUTOS || "15",
    10,
  );

  return minutosParaHora(horaParaMinutos(horaEntrada) + tolerancia);
}

function calcularStatusEntrada(
  horaReal: string,
  horaLimite: string,
  horaEntrada?: string,
): StatusEntrada {
  const minutosReais = horaParaMinutos(horaReal);

  const limiteEfetivo =
    horaLimite && horaLimite.length >= 4
      ? horaLimite
      : horaEntrada
        ? calcularHoraLimiteComTolerancia(horaEntrada)
        : horaReal;

  const minutosLimite = horaParaMinutos(limiteEfetivo);

  if (minutosReais <= minutosLimite) {
    return "presente";
  }

  return "atrasado";
}

async function buscarHorarioAluno(
  matricula: string,
  data: string,
): Promise<Horario | null> {
  const diaSemana = obterDiaSemana(data);

  return buscarHorarioPorMatriculaEDia({
    matricula,
    diaSemana,
  });
}

function deveSubstituirPorFalta(registro?: RegistroDiario): boolean {
  if (!registro) return true;

  return registro.statusEntrada === "pendente";
}

function converterStatusMensal(statusEntrada: string): StatusPresencaMensal {
  if (statusEntrada === "ausente") return "falta";
  if (statusEntrada === "presente") return "presente";
  if (statusEntrada === "atrasado") return "atrasado";
  if (statusEntrada === "justificado") return "justificado";

  return "pendente";
}

export async function listarDiarioPorTurma(params: {
  turma: string;
  data: string;
}): Promise<RegistroDiario[]> {
  const alunos = await listarAlunosPorTurma(params.turma);
  const registros: RegistroDiario[] = [];

  for (const aluno of alunos) {
    const id = criarIdDiario(aluno.matricula, params.data);
    const documento = await colecaoDiario.doc(id).get();

    if (documento.exists) {
      registros.push(documento.data() as RegistroDiario);
      continue;
    }

    const horario = await buscarHorarioAluno(aluno.matricula, params.data);

    registros.push({
      id,
      data: params.data,
      alunoId: aluno.id,
      nome: aluno.nome,
      matricula: aluno.matricula,
      turma: aluno.turma,
      horaEntradaPrevista: horario?.horaEntrada || "",
      horaLimiteEntrada: horario?.horaLimiteEntrada || "",
      horaSaidaPrevista: horario?.horaSaida || "",
      horaEntradaReal: null,
      horaSaidaReal: null,
      statusEntrada: "pendente",
      statusSaida: "pendente",
    });
  }

  return registros;
}

export async function confirmarEntrada(params: {
  matricula: string;
  data: string;
  origem: "manual" | "reconhecimento_facial";
  confidence?: number;
}): Promise<RegistroDiario> {
  const aluno = await buscarAlunoPorMatricula(params.matricula);

  if (!aluno) {
    throw new Error("Aluno não encontrado.");
  }

  const horario = await buscarHorarioAluno(aluno.matricula, params.data);
  const id = criarIdDiario(aluno.matricula, params.data);

  const documentoAtual = await colecaoDiario.doc(id).get();

  const registroAtual = documentoAtual.exists
    ? (documentoAtual.data() as RegistroDiario)
    : null;

  const entradaJaRegistrada = Boolean(registroAtual?.horaEntradaReal);

  const horaEntradaReal: string | null = entradaJaRegistrada
    ? (registroAtual?.horaEntradaReal ?? null)
    : obterHoraAtual();

  const statusEntrada: StatusEntrada =
    entradaJaRegistrada && registroAtual?.statusEntrada
      ? registroAtual.statusEntrada
      : horario
        ? calcularStatusEntrada(
            String(horaEntradaReal ?? obterHoraAtual()).slice(0, 5),
            horario.horaLimiteEntrada,
            horario.horaEntrada,
          )
        : "presente";

  const registro: RegistroDiario = removerCamposIndefinidos({
    id,
    data: params.data,

    alunoId: aluno.id,
    nome: aluno.nome,
    matricula: aluno.matricula,
    turma: aluno.turma,

    horaEntradaPrevista:
      horario?.horaEntrada || registroAtual?.horaEntradaPrevista || "",
    horaLimiteEntrada:
      horario?.horaLimiteEntrada || registroAtual?.horaLimiteEntrada || "",
    horaSaidaPrevista:
      horario?.horaSaida || registroAtual?.horaSaidaPrevista || "",

    horaEntradaReal,
    horaSaidaReal: registroAtual?.horaSaidaReal || null,

    statusEntrada,
    statusSaida: registroAtual?.statusSaida || "pendente",

    origemEntrada: registroAtual?.origemEntrada || params.origem,
    origemSaida: registroAtual?.origemSaida,

    confidenceEntrada:
      registroAtual?.confidenceEntrada !== undefined
        ? registroAtual.confidenceEntrada
        : params.confidence,

    confidenceSaida: registroAtual?.confidenceSaida,

    criadoEm: registroAtual?.criadoEm || timestampServidor(),
    atualizadoEm: timestampServidor(),
  });

  await colecaoDiario.doc(id).set(registro, { merge: true });

  return registro;
}

export async function confirmarSaida(params: {
  matricula: string;
  data: string;
  origem: "manual" | "reconhecimento_facial";
  confidence?: number;
}): Promise<RegistroDiario> {
  const aluno = await buscarAlunoPorMatricula(params.matricula);

  if (!aluno) {
    throw new Error("Aluno não encontrado.");
  }

  const id = criarIdDiario(aluno.matricula, params.data);
  const documento = await colecaoDiario.doc(id).get();

  if (!documento.exists) {
    throw new Error("Entrada ainda não foi registrada.");
  }

  const registroAtual = documento.data() as RegistroDiario;

  const registroAtualizado: RegistroDiario = removerCamposIndefinidos({
    ...registroAtual,
    horaSaidaReal: obterHoraAtual(),
    statusSaida: "saida_registrada",
    origemSaida: params.origem,
    confidenceSaida: params.confidence,
    atualizadoEm: timestampServidor(),
  });

  await colecaoDiario.doc(id).set(registroAtualizado, { merge: true });

  return registroAtualizado;
}

export async function marcarFalta(params: {
  matricula: string;
  data: string;
}): Promise<RegistroDiario> {
  const aluno = await buscarAlunoPorMatricula(params.matricula);

  if (!aluno) {
    throw new Error("Aluno não encontrado.");
  }

  const horario = await buscarHorarioAluno(aluno.matricula, params.data);
  const id = criarIdDiario(aluno.matricula, params.data);
  const documentoAtual = await colecaoDiario.doc(id).get();

  const registroAtual = documentoAtual.exists
    ? (documentoAtual.data() as RegistroDiario)
    : null;

  if (registroAtual && !deveSubstituirPorFalta(registroAtual)) {
    return registroAtual;
  }

  const registro: RegistroDiario = {
    id,
    data: params.data,

    alunoId: aluno.id,
    nome: aluno.nome,
    matricula: aluno.matricula,
    turma: aluno.turma,

    horaEntradaPrevista: horario?.horaEntrada || "",
    horaLimiteEntrada: horario?.horaLimiteEntrada || "",
    horaSaidaPrevista: horario?.horaSaida || "",

    horaEntradaReal: null,
    horaSaidaReal: null,

    statusEntrada: "ausente",
    statusSaida: "pendente",

    criadoEm: registroAtual?.criadoEm || timestampServidor(),
    atualizadoEm: timestampServidor(),
  };

  await colecaoDiario.doc(id).set(registro, { merge: true });

  return registro;
}

export async function fecharDia(params: {
  turmaId: string;
  data: string;
}): Promise<{ processados: number; faltas: number }> {
  const alunos = await listarAlunosPorTurma(params.turmaId);
  let faltas = 0;

  for (const aluno of alunos) {
    const id = criarIdDiario(aluno.matricula, params.data);
    const documento = await colecaoDiario.doc(id).get();

    const registroAtual = documento.exists
      ? (documento.data() as RegistroDiario)
      : undefined;

    if (!deveSubstituirPorFalta(registroAtual)) {
      continue;
    }

    const horario = await buscarHorarioAluno(aluno.matricula, params.data);

    const registroFalta: RegistroDiario = {
      id,
      data: params.data,
      alunoId: aluno.id,
      nome: aluno.nome,
      matricula: aluno.matricula,
      turma: aluno.turma,
      horaEntradaPrevista: horario?.horaEntrada || "",
      horaLimiteEntrada: horario?.horaLimiteEntrada || "",
      horaSaidaPrevista: horario?.horaSaida || "",
      horaEntradaReal: null,
      horaSaidaReal: null,
      statusEntrada: "ausente",
      statusSaida: "pendente",
      criadoEm: registroAtual?.criadoEm || timestampServidor(),
      atualizadoEm: timestampServidor(),
    };

    await colecaoDiario.doc(id).set(registroFalta, { merge: true });
    faltas++;
  }

  return { processados: alunos.length, faltas };
}

export async function justificarFalta(params: {
  alunoId: string;
  turma: string;
  componente?: string;
  data: string;
  justificativa: string;
}): Promise<JustificativaFalta> {
  const referencia = colecaoJustificativas.doc();

  const registroJustificativa: JustificativaFalta = removerCamposIndefinidos({
    id: referencia.id,
    alunoId: params.alunoId,
    turma: params.turma,
    componente: params.componente,
    data: params.data,
    justificativa: params.justificativa,
    criadoEm: timestampServidor(),
  });

  await referencia.set(registroJustificativa);

  const snapshotDiario = await colecaoDiario
    .where("alunoId", "==", params.alunoId)
    .get();

  const docDiario = snapshotDiario.docs.find(
    (documento) => documento.data().data === params.data,
  );

  if (docDiario) {
    await docDiario.ref.update({
      statusEntrada: "justificado",
      atualizadoEm: timestampServidor(),
    });
  }

  return registroJustificativa;
}

export async function listarDiarioMensal(params: {
  turmaId: string;
  mes: number;
  ano: number;
  componente?: string;
}): Promise<RespostaDiarioMensal> {
  const { turmaId, mes, ano } = params;

  const dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const dataFim = `${ano}-${String(mes).padStart(2, "0")}-${String(
    ultimoDia,
  ).padStart(2, "0")}`;
  const hoje = obterDataAtual();

  const alunos = await listarAlunosPorTurma(turmaId);

  const snapshotDiario = await colecaoDiario
    .where("turma", "==", turmaId)
    .get();

  const registrosPorAluno: Record<string, Record<string, RegistroDiario>> = {};

  for (const doc of snapshotDiario.docs) {
    const reg = doc.data() as RegistroDiario;

    if (reg.data < dataInicio || reg.data > dataFim) continue;

    if (!registrosPorAluno[reg.alunoId]) {
      registrosPorAluno[reg.alunoId] = {};
    }

    registrosPorAluno[reg.alunoId][reg.data] = reg;
  }

  const snapshotJust = await colecaoJustificativas
    .where("turma", "==", turmaId)
    .get();

  const justificativasPorAluno: Record<string, Record<string, string>> = {};

  for (const doc of snapshotJust.docs) {
    const just = doc.data() as JustificativaFalta;

    if (just.data < dataInicio || just.data > dataFim) continue;

    if (!justificativasPorAluno[just.alunoId]) {
      justificativasPorAluno[just.alunoId] = {};
    }

    justificativasPorAluno[just.alunoId][just.data] = just.justificativa;
  }

  const totais: TotaisMensais = {
    presentes: 0,
    atrasados: 0,
    faltas: 0,
    pendentes: 0,
  };

  const alunosResult: PresencaMensalAluno[] = alunos.map((aluno) => {
    const registrosAluno = registrosPorAluno[aluno.id] || {};
    const justAluno = justificativasPorAluno[aluno.id] || {};
    const dias: Record<string, PresencaDoDia> = {};

    const criadoEm = aluno.criadoEm as FirebaseFirestore.Timestamp | undefined;

    const dataCadastro = criadoEm?.toDate
      ? formatarDataManaus(criadoEm.toDate())
      : "1900-01-01";

    for (let dia = 1; dia <= ultimoDia; dia++) {
      const dataStr = `${ano}-${String(mes).padStart(2, "0")}-${String(
        dia,
      ).padStart(2, "0")}`;

      const diaSemana = obterDiaSemana(dataStr);

      if (diaSemana === "domingo" || diaSemana === "sabado") {
        continue;
      }

      const reg = registrosAluno[dataStr];
      const justificativa = justAluno[dataStr];

      let status: StatusPresencaMensal;

      if (justificativa) {
        status = "justificado";
      } else if (reg) {
        status = converterStatusMensal(String(reg.statusEntrada));
      } else if (dataStr < dataCadastro) {
        status = "pendente";
      } else if (dataStr < hoje) {
        status = "falta";
      } else {
        status = "pendente";
      }

      if (status === "presente") {
        totais.presentes++;
      } else if (status === "atrasado") {
        totais.atrasados++;
      } else if (status === "falta" || status === "justificado") {
        totais.faltas++;
      } else {
        totais.pendentes++;
      }

      dias[dataStr] = {
        data: dataStr,
        status,
        horaEntradaReal: reg?.horaEntradaReal,
        justificativa,
      };
    }

    return {
      alunoId: aluno.id,
      nome: aluno.nome,
      matricula: aluno.matricula,
      turma: aluno.turma,
      dias,
    };
  });

  return {
    alunos: alunosResult,
    totais,
  };
}

export async function fecharDiaPorTurno(params: {
  turno: "matutino" | "vespertino" | "noturno";
  data: string;
}): Promise<{ processados: number; faltas: number }> {
  const { turno, data } = params;
  const diaSemana = obterDiaSemana(data);

  const snapshotHorarios = await colecaoHorarios
    .where("diaSemana", "==", diaSemana)
    .where("ativo", "==", true)
    .get();

  const horariosPorMatricula: Record<string, Horario> = {};

  for (const doc of snapshotHorarios.docs) {
    const horario = doc.data() as Horario;

    const ehMatutino = horario.horaEntrada < "12:00";
    const ehNoturno = horario.horaEntrada >= "18:00";
    const ehVespertino = !ehMatutino && !ehNoturno;

    if (turno === "matutino" && ehMatutino) {
      horariosPorMatricula[horario.matricula] = horario;
    }

    if (turno === "vespertino" && ehVespertino) {
      horariosPorMatricula[horario.matricula] = horario;
    }

    if (turno === "noturno" && ehNoturno) {
      horariosPorMatricula[horario.matricula] = horario;
    }
  }

  const matriculas = Object.keys(horariosPorMatricula);
  let faltas = 0;

  for (const matricula of matriculas) {
    const aluno = await buscarAlunoPorMatricula(matricula);

    if (!aluno) continue;

    const id = criarIdDiario(aluno.matricula, data);
    const documento = await colecaoDiario.doc(id).get();

    const registroAtual = documento.exists
      ? (documento.data() as RegistroDiario)
      : undefined;

    if (!deveSubstituirPorFalta(registroAtual)) {
      continue;
    }

    const horario = horariosPorMatricula[matricula];

    const registroFalta: RegistroDiario = {
      id,
      data,
      alunoId: aluno.id,
      nome: aluno.nome,
      matricula: aluno.matricula,
      turma: aluno.turma,
      horaEntradaPrevista: horario.horaEntrada,
      horaLimiteEntrada: horario.horaLimiteEntrada,
      horaSaidaPrevista: horario.horaSaida,
      horaEntradaReal: null,
      horaSaidaReal: null,
      statusEntrada: "ausente",
      statusSaida: "pendente",
      criadoEm: registroAtual?.criadoEm || timestampServidor(),
      atualizadoEm: timestampServidor(),
    };

    await colecaoDiario.doc(id).set(registroFalta, { merge: true });
    faltas++;
  }

  return {
    processados: matriculas.length,
    faltas,
  };
}
