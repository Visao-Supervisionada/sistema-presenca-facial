import { db, timestampServidor } from '../config/firebase';
import { CriarHorarioDTO, DiaSemana, Horario } from '../types/horario.types';

const colecaoHorarios = db.collection('horarios');

function normalizarTexto(valor: string) {
  return String(valor).trim();
}

export async function criarHorario(dados: CriarHorarioDTO): Promise<Horario> {
  const referencia = colecaoHorarios.doc();

  const horario: Horario = {
    id: referencia.id,
    matricula: normalizarTexto(dados.matricula),
    nome: normalizarTexto(dados.nome),
    turma: normalizarTexto(dados.turma),
    diaSemana: dados.diaSemana,
    horaEntrada: normalizarTexto(dados.horaEntrada),
    horaLimiteEntrada: normalizarTexto(dados.horaLimiteEntrada),
    horaSaida: normalizarTexto(dados.horaSaida),
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
  let consulta: FirebaseFirestore.Query = colecaoHorarios.where('ativo', '==', true);

  if (params?.turma) {
    consulta = consulta.where('turma', '==', normalizarTexto(params.turma));
  }

  if (params?.matricula) {
    consulta = consulta.where('matricula', '==', normalizarTexto(params.matricula));
  }

  if (params?.diaSemana) {
    consulta = consulta.where('diaSemana', '==', params.diaSemana);
  }

  const snapshot = await consulta.get();

  return snapshot.docs.map((documento) => documento.data() as Horario);
}

export async function buscarHorarioPorMatriculaEDia(params: {
  matricula: string;
  diaSemana: DiaSemana;
}): Promise<Horario | null> {
  const snapshot = await colecaoHorarios
    .where('matricula', '==', normalizarTexto(params.matricula))
    .where('diaSemana', '==', params.diaSemana)
    .where('ativo', '==', true)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const documento = snapshot.docs[0];

  if (!documento) {
    return null;
  }

  return documento.data() as Horario;
}

export async function excluirHorario(id: string): Promise<void> {
  await colecaoHorarios.doc(id).update({
    ativo: false,
    atualizadoEm: timestampServidor(),
  });
}