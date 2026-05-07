import { db, timestampServidor } from '../config/firebase';
import { Aluno, CriarAlunoDTO } from '../types/aluno.types';

const colecaoAlunos = db.collection('alunos');

function normalizarTexto(valor: string) {
  return String(valor).trim();
}

export async function criarAluno(dados: CriarAlunoDTO): Promise<Aluno> {
  const referencia = colecaoAlunos.doc();

  const aluno: Aluno = {
    id: referencia.id,
    nome: normalizarTexto(dados.nome),
    matricula: normalizarTexto(dados.matricula),
    turma: dados.turma ? normalizarTexto(dados.turma) : '',
    perfil: dados.perfil,
    faceId: dados.faceId || '',
    ativo: true,
    criadoEm: timestampServidor(),
  };

  await referencia.set(aluno);

  return aluno;
}


export async function listarAlunos(): Promise<Aluno[]> {
  const snapshot = await colecaoAlunos.orderBy('nome', 'asc').get();

  return snapshot.docs.map((documento) => documento.data() as Aluno);
}


export async function buscarAlunoPorMatricula(matricula: string): Promise<Aluno | null> {
  const matriculaNormalizada = normalizarTexto(matricula);

  const snapshot = await colecaoAlunos
    .where('matricula', '==', matriculaNormalizada)
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.log('Aluno não encontrado para matrícula:', matriculaNormalizada);
    return null;
  }

  return snapshot.docs[0].data() as Aluno;
}


export async function buscarAlunoPorId(id: string): Promise<Aluno | null> {
  const documento = await colecaoAlunos.doc(id).get();

  if (!documento.exists) {
    return null;
  }

  return documento.data() as Aluno;
}


export async function excluirAlunoPorId(id: string): Promise<void> {
  await colecaoAlunos.doc(id).delete();
}

export async function listarAlunosPorTurma(turma: string): Promise<Aluno[]> {
  const turmaNormalizada = String(turma).trim();

  const snapshot = await colecaoAlunos
    .where('turma', '==', turmaNormalizada)
    .where('ativo', '==', true)
    .get();

  return snapshot.docs.map((documento) => documento.data() as Aluno);
}