import { db, timestampServidor } from '../config/firebase';
import { RegistroDiario, StatusEntrada } from '../types/diario.types';
import { DiaSemana } from '../types/horario.types';
import { buscarAlunoPorMatricula, listarAlunosPorTurma } from './alunos.service';
import { buscarHorarioPorMatriculaEDia } from './horarios.service';

const colecaoDiario = db.collection('diario');

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

function calcularStatusEntrada(horaReal: string, horaLimite: string): StatusEntrada {
  const minutosReais = horaParaMinutos(horaReal);
  const minutosLimite = horaParaMinutos(horaLimite);

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