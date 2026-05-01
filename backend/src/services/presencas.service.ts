import { db } from '../config/firebase';
import { buscarAlunoPorMatricula } from './alunos.service';
import { Presenca } from '../types/presenca.types';

const colecaoPresencas = db.collection('presencas');

function obterDataAtual() {
  return new Date().toISOString().slice(0, 10);
}

function obterHoraAtual() {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export async function registrarPresencaPorMatricula(params: {
  matricula: string;
  confidence: number;
}): Promise<{
  acao: 'entrada' | 'saida' | 'ja_finalizada' | 'aluno_nao_encontrado';
  presenca?: Presenca;
}> {
  const aluno = await buscarAlunoPorMatricula(params.matricula);

  if (!aluno) {
    return {
      acao: 'aluno_nao_encontrado',
    };
  }

  const dataHoje = obterDataAtual();

  const snapshot = await colecaoPresencas
    .where('alunoId', '==', aluno.id)
    .where('data', '==', dataHoje)
    .limit(1)
    .get();

  if (snapshot.empty) {
    const referencia = colecaoPresencas.doc();

    const novaPresenca: Presenca = {
      id: referencia.id,
      alunoId: aluno.id,
      nome: aluno.nome,
      matricula: aluno.matricula,
      data: dataHoje,
      horaEntrada: obterHoraAtual(),
      horaSaida: null,
      status: 'presente',
      confidence: params.confidence,
      origem: 'reconhecimento_facial',
    };

    await referencia.set(novaPresenca);

    return {
      acao: 'entrada',
      presenca: novaPresenca,
    };
  }

  const documentoPresenca = snapshot.docs[0];

  if (!documentoPresenca) {
    return {
      acao: 'aluno_nao_encontrado',
    };
  }

  const presencaAtual = documentoPresenca.data() as Presenca;

  if (presencaAtual.horaEntrada && !presencaAtual.horaSaida) {
    const presencaAtualizada: Presenca = {
      ...presencaAtual,
      horaSaida: obterHoraAtual(),
      status: 'saida_registrada',
      confidence: params.confidence,
    };

    await documentoPresenca.ref.update({
      horaSaida: presencaAtualizada.horaSaida,
      status: presencaAtualizada.status,
      confidence: presencaAtualizada.confidence,
    });

    return {
      acao: 'saida',
      presenca: presencaAtualizada,
    };
  }

  return {
    acao: 'ja_finalizada',
    presenca: presencaAtual,
  };
}

export async function listarPresencas(): Promise<Presenca[]> {
  const snapshot = await colecaoPresencas
    .orderBy('data', 'desc')
    .limit(100)
    .get();

  return snapshot.docs.map((documento) => documento.data() as Presenca);
}