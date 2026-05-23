import { db, timestampServidor } from '../config/firebase';
import {
  JustificativaFalta,
  PresencaDoDia,
  PresencaMensalAluno,
  RegistroDiario,
  StatusEntrada,
  StatusPresencaMensal,
} from '../types/diario.types';
import { DiaSemana } from '../types/horario.types';
import { buscarAlunoPorMatricula, listarAlunosPorTurma } from './alunos.service';
import { buscarHorarioPorMatriculaEDia } from './horarios.service';

const colecaoDiario = db.collection('diario');
const colecaoJustificativas = db.collection('justificativas');

function obterDiaSemana(data: string): DiaSemana {
  const dia = new Date(`${data}T00:00:00`).getDay();

  const dias: DiaSemana[] = [
    'domingo',
    'segunda',
    'terca',
    'quarta',
    'quinta',
    'sexta',
    'sabado',
  ];

  return dias[dia];
}

function obterHoraAtual() {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function criarIdDiario(matricula: string, data: string) {
  return `${String(matricula).trim()}_${data}`;
}

function horaParaMinutos(hora: string) {
  const [horasTexto, minutosTexto] = hora.split(':');

  const horas = Number(horasTexto);
  const minutos = Number(minutosTexto);

  return horas * 60 + minutos;
}

function calcularHoraLimiteComTolerancia(horaEntrada: string): string {
  const tolerancia = parseInt(process.env.TOLERANCIA_ATRASO_MINUTOS || '15', 10);
  const [horasTexto, minutosTexto] = horaEntrada.split(':');
  const totalMinutos = Number(horasTexto) * 60 + Number(minutosTexto) + tolerancia;
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

function calcularStatusEntrada(horaReal: string, horaLimite: string, horaEntrada?: string): StatusEntrada {
  const minutosReais = horaParaMinutos(horaReal);

  const limiteEfetivo = horaLimite && horaLimite.length >= 4
    ? horaLimite
    : horaEntrada
      ? calcularHoraLimiteComTolerancia(horaEntrada)
      : horaReal;

  const minutosLimite = horaParaMinutos(limiteEfetivo);

  if (minutosReais <= minutosLimite) {
    return 'presente';
  }

  return 'atrasado';
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

    const diaSemana = obterDiaSemana(params.data);

    const horario = await buscarHorarioPorMatriculaEDia({
      matricula: aluno.matricula,
      diaSemana,
    });

    registros.push({
      id,
      data: params.data,
      alunoId: aluno.id,
      nome: aluno.nome,
      matricula: aluno.matricula,
      turma: aluno.turma,
      horaEntradaPrevista: horario?.horaEntrada || '',
      horaLimiteEntrada: horario?.horaLimiteEntrada || '',
      horaSaidaPrevista: horario?.horaSaida || '',
      horaEntradaReal: null,
      horaSaidaReal: null,
      statusEntrada: 'pendente',
      statusSaida: 'pendente',
    });
  }

  return registros;
}

export async function confirmarEntrada(params: {
  matricula: string;
  data: string;
  origem: 'manual' | 'reconhecimento_facial';
  confidence?: number;
}): Promise<RegistroDiario> {
  const aluno = await buscarAlunoPorMatricula(params.matricula);

  if (!aluno) {
    throw new Error('Aluno não encontrado.');
  }

  const diaSemana = obterDiaSemana(params.data);

  const horario = await buscarHorarioPorMatriculaEDia({
    matricula: aluno.matricula,
    diaSemana,
  });

  if (!horario) {
    throw new Error('Horário não encontrado para este aluno neste dia.');
  }

  const id = criarIdDiario(aluno.matricula, params.data);
  const horaEntradaReal = obterHoraAtual();

  const statusEntrada = calcularStatusEntrada(
    horaEntradaReal.slice(0, 5),
    horario.horaLimiteEntrada,
    horario.horaEntrada,
  );

  const registro: RegistroDiario = {
    id,
    data: params.data,

    alunoId: aluno.id,
    nome: aluno.nome,
    matricula: aluno.matricula,
    turma: aluno.turma,

    horaEntradaPrevista: horario.horaEntrada,
    horaLimiteEntrada: horario.horaLimiteEntrada,
    horaSaidaPrevista: horario.horaSaida,

    horaEntradaReal,
    horaSaidaReal: null,

    statusEntrada,
    statusSaida: 'pendente',

    origemEntrada: params.origem,
    confidenceEntrada: params.confidence,

    criadoEm: timestampServidor(),
    atualizadoEm: timestampServidor(),
  };

  await colecaoDiario.doc(id).set(registro, { merge: true });

  return registro;
}

export async function confirmarSaida(params: {
  matricula: string;
  data: string;
  origem: 'manual' | 'reconhecimento_facial';
  confidence?: number;
}): Promise<RegistroDiario> {
  const aluno = await buscarAlunoPorMatricula(params.matricula);

  if (!aluno) {
    throw new Error('Aluno não encontrado.');
  }

  const id = criarIdDiario(aluno.matricula, params.data);
  const documento = await colecaoDiario.doc(id).get();

  if (!documento.exists) {
    throw new Error('Entrada ainda não foi registrada.');
  }

  const registroAtual = documento.data() as RegistroDiario;

  const registroAtualizado: RegistroDiario = {
    ...registroAtual,
    horaSaidaReal: obterHoraAtual(),
    statusSaida: 'saida_registrada',
    origemSaida: params.origem,
    confidenceSaida: params.confidence,
    atualizadoEm: timestampServidor(),
  };

  await colecaoDiario.doc(id).set(registroAtualizado, { merge: true });

  return registroAtualizado;
}

export async function marcarFalta(params: {
  matricula: string;
  data: string;
}): Promise<RegistroDiario> {
  const aluno = await buscarAlunoPorMatricula(params.matricula);

  if (!aluno) {
    throw new Error('Aluno não encontrado.');
  }

  const diaSemana = obterDiaSemana(params.data);

  const horario = await buscarHorarioPorMatriculaEDia({
    matricula: aluno.matricula,
    diaSemana,
  });

  const id = criarIdDiario(aluno.matricula, params.data);

  const registro: RegistroDiario = {
    id,
    data: params.data,

    alunoId: aluno.id,
    nome: aluno.nome,
    matricula: aluno.matricula,
    turma: aluno.turma,

    horaEntradaPrevista: horario?.horaEntrada || '',
    horaLimiteEntrada: horario?.horaLimiteEntrada || '',
    horaSaidaPrevista: horario?.horaSaida || '',

    horaEntradaReal: null,
    horaSaidaReal: null,

    statusEntrada: 'ausente',
    statusSaida: 'pendente',

    criadoEm: timestampServidor(),
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

    if (!documento.exists) {
      const diaSemana = obterDiaSemana(params.data);
      const horario = await buscarHorarioPorMatriculaEDia({ matricula: aluno.matricula, diaSemana });

      const registroFalta: RegistroDiario = {
        id,
        data: params.data,
        alunoId: aluno.id,
        nome: aluno.nome,
        matricula: aluno.matricula,
        turma: aluno.turma,
        horaEntradaPrevista: horario?.horaEntrada || '',
        horaLimiteEntrada: horario?.horaLimiteEntrada || '',
        horaSaidaPrevista: horario?.horaSaida || '',
        horaEntradaReal: null,
        horaSaidaReal: null,
        statusEntrada: 'ausente',
        statusSaida: 'pendente',
        criadoEm: timestampServidor(),
        atualizadoEm: timestampServidor(),
      };

      await colecaoDiario.doc(id).set(registroFalta, { merge: true });
      faltas++;
    }
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

  const registroJustificativa: JustificativaFalta = {
    id: referencia.id,
    alunoId: params.alunoId,
    turma: params.turma,
    componente: params.componente,
    data: params.data,
    justificativa: params.justificativa,
    criadoEm: timestampServidor(),
  };

  await referencia.set(registroJustificativa);

  const snapshotDiario = await colecaoDiario
    .where('alunoId', '==', params.alunoId)
    .where('data', '==', params.data)
    .limit(1)
    .get();

  const statusJustificado: StatusPresencaMensal = 'justificado';

  if (!snapshotDiario.empty) {
    await snapshotDiario.docs[0].ref.update({ statusEntrada: statusJustificado, atualizadoEm: timestampServidor() });
  }

  return registroJustificativa;
}

export async function listarDiarioMensal(params: {
  turmaId: string;
  mes: number;
  ano: number;
  componente?: string;
}): Promise<PresencaMensalAluno[]> {
  const { turmaId, mes, ano } = params;

  const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

  const alunos = await listarAlunosPorTurma(turmaId);

  const snapshotDiario = await colecaoDiario
    .where('turma', '==', turmaId)
    .where('data', '>=', dataInicio)
    .where('data', '<=', dataFim)
    .get();

  const registrosPorAluno: Record<string, Record<string, RegistroDiario>> = {};
  for (const doc of snapshotDiario.docs) {
    const reg = doc.data() as RegistroDiario;
    if (!registrosPorAluno[reg.alunoId]) registrosPorAluno[reg.alunoId] = {};
    registrosPorAluno[reg.alunoId][reg.data] = reg;
  }

  const snapshotJust = await colecaoJustificativas
    .where('turma', '==', turmaId)
    .where('data', '>=', dataInicio)
    .where('data', '<=', dataFim)
    .get();

  const justificativasPorAluno: Record<string, Record<string, string>> = {};
  for (const doc of snapshotJust.docs) {
    const just = doc.data() as JustificativaFalta;
    if (!justificativasPorAluno[just.alunoId]) justificativasPorAluno[just.alunoId] = {};
    justificativasPorAluno[just.alunoId][just.data] = just.justificativa;
  }

  const resultado: PresencaMensalAluno[] = alunos.map((aluno) => {
    const registrosAluno = registrosPorAluno[aluno.id] || {};
    const justAluno = justificativasPorAluno[aluno.id] || {};
    const dias: Record<string, PresencaDoDia> = {};

    for (let dia = 1; dia <= ultimoDia; dia++) {
      const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const diaSemana = new Date(`${dataStr}T00:00:00`).getDay();
      if (diaSemana === 0 || diaSemana === 6) continue;

      const reg = registrosAluno[dataStr];
      const justificativa = justAluno[dataStr];

      let status: StatusPresencaMensal = 'pendente';
      if (justificativa) {
        status = 'justificado';
      } else if (reg) {
        const s = reg.statusEntrada;
        status = s === 'ausente' ? 'falta' : (s as StatusPresencaMensal);
      }

      dias[dataStr] = {
        data: dataStr,
        status,
        horaEntradaReal: reg?.horaEntradaReal,
        justificativa,
      };
    }

    return { alunoId: aluno.id, nome: aluno.nome, matricula: aluno.matricula, turma: aluno.turma, dias };
  });

  return resultado;
}