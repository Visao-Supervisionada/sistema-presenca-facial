import { db } from '../config/firebase';
import { buscarAlunoPorMatricula } from './alunos.service';
import { confirmarEntrada as confirmarEntradaDiario, confirmarSaida as confirmarSaidaDiario } from './diario.service';
import { buscarHorarioPorMatriculaEDia } from './horarios.service';
import { Presenca } from '../types/presenca.types';
import { DiaSemana } from '../types/horario.types';

function horaParaMinutos(hora: string): number {
  const [hh, mm] = hora.split(':').map(Number);
  return hh * 60 + mm;
}

function obterDiaSemanaAtual(): DiaSemana {
  const dia = new Date().getDay();
  const dias: DiaSemana[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return dias[dia];
}

function horaAtualEmMinutos(): number {
  const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return horaParaMinutos(agora);
}

function estaEmJanelaDeEntrada(horaEntrada: string, horaSaida: string): boolean {
  const agora = horaAtualEmMinutos();
  const inicioJanela = horaParaMinutos(horaEntrada) - 30;
  const fimJanela = horaParaMinutos(horaSaida);
  return agora >= inicioJanela && agora <= fimJanela;
}

function estaEmJanelaDeSaida(horaSaida: string): boolean {
  const agora = horaAtualEmMinutos();
  const inicioPrev = horaParaMinutos(horaSaida);
  const fimPrev = inicioPrev + 30;
  return agora >= inicioPrev && agora <= fimPrev;
}

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
  acao: 'entrada' | 'saida' | 'ja_finalizada' | 'aluno_nao_encontrado' | 'em_aula' | 'sem_horario' | 'fora_da_janela';
  presenca?: Presenca;
}> {
  const aluno = await buscarAlunoPorMatricula(params.matricula);

  if (!aluno) {
    return { acao: 'aluno_nao_encontrado' };
  }

  const diaSemana = obterDiaSemanaAtual();
  const horario = await buscarHorarioPorMatriculaEDia({ matricula: aluno.matricula, diaSemana });

  if (!horario) {
    return { acao: 'sem_horario' };
  }

  const dataHoje = obterDataAtual();

  const snapshot = await colecaoPresencas
    .where('alunoId', '==', aluno.id)
    .where('data', '==', dataHoje)
    .limit(1)
    .get();

  if (snapshot.empty) {
    if (!estaEmJanelaDeEntrada(horario.horaEntrada, horario.horaSaida)) {
      return { acao: 'fora_da_janela' };
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
      status: 'presente',
      confidence: params.confidence,
      origem: 'reconhecimento_facial',
    };

    await referencia.set(novaPresenca);

    await confirmarEntradaDiario({
      matricula: aluno.matricula,
      data: dataHoje,
      origem: 'reconhecimento_facial',
      confidence: params.confidence,
    });

    return { acao: 'entrada', presenca: novaPresenca };
  }

  const documentoPresenca = snapshot.docs[0];

  if (!documentoPresenca) {
    return { acao: 'aluno_nao_encontrado' };
  }

  const presencaAtual = documentoPresenca.data() as Presenca;

  if (presencaAtual.horaEntrada && !presencaAtual.horaSaida) {
    if (!estaEmJanelaDeSaida(horario.horaSaida)) {
      return { acao: 'em_aula', presenca: presencaAtual };
    }

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

    await confirmarSaidaDiario({
      matricula: aluno.matricula,
      data: dataHoje,
      origem: 'reconhecimento_facial',
      confidence: params.confidence,
    });

    return { acao: 'saida', presenca: presencaAtualizada };
  }

  return { acao: 'ja_finalizada', presenca: presencaAtual };
}

export async function listarPresencas(): Promise<Presenca[]> {
  const snapshot = await colecaoPresencas
    .orderBy('data', 'desc')
    .limit(100)
    .get();

  return snapshot.docs.map((documento) => documento.data() as Presenca);
}