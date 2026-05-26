import { RequestHandler } from 'express';
import { db } from '../config/firebase';
import { listarAlunos } from '../services/alunos.service';
import { listarHorarios } from '../services/horarios.service';
import { DiaSemana } from '../types/horario.types';
import { Presenca } from '../types/presenca.types';

const colecaoPresencas = db.collection('presencas');

function horaParaMinutos(hora: string): number {
  const [hh, mm] = hora.split(':').map(Number);
  return hh * 60 + mm;
}

function diaSemanaDeData(dataStr: string): DiaSemana {
  const [ano, mes, dia] = dataStr.split('-').map(Number);
  const d = new Date(ano, mes - 1, dia);
  const dias: DiaSemana[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return dias[d.getDay()];
}

function horaAtualEmMinutos(): number {
  const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return horaParaMinutos(agora);
}

export const resumoDashboardController: RequestHandler = async (req, res) => {
  try {
    const data = String(req.query['data'] || new Date().toISOString().slice(0, 10));
    const diaSemana = diaSemanaDeData(data);
    const agoraMins = horaAtualEmMinutos();

    const [alunos, horarios, snapshotPresencas] = await Promise.all([
      listarAlunos(),
      listarHorarios({ diaSemana }),
      colecaoPresencas.where('data', '==', data).get(),
    ]);

    const presencas = snapshotPresencas.docs.map((d) => d.data() as Presenca);

    const presencasPorMatricula = new Map(presencas.map((p) => [p.matricula, p]));

    const presentes = presencas.filter((p) => p.horaEntrada).length;
    const atrasos = presencas.filter((p) => p.status === 'atrasado').length;

    const ausentes = horarios.filter((h) => {
      const limiteEntradaMins = horaParaMinutos(h.horaLimiteEntrada);
      const jaPaouLimite = agoraMins > limiteEntradaMins;
      const semPresenca = !presencasPorMatricula.has(h.matricula);
      return jaPaouLimite && semPresenca;
    }).length;

    const percentualPresenca =
      presentes + ausentes > 0
        ? Math.round((presentes / (presentes + ausentes)) * 100)
        : 0;

    const presencasOrdenadas = [...presencas]
      .sort((a, b) => (b.horaEntrada ?? '').localeCompare(a.horaEntrada ?? ''))
      .slice(0, 10);

    res.json({
      success: true,
      data,
      total: alunos.length,
      presentes,
      ausentes,
      atrasos,
      percentualPresenca,
      presencas: presencasOrdenadas,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar resumo do dashboard.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const frequenciaSemanaController: RequestHandler = async (req, res) => {
  try {
    const hoje = new Date();
    const resultado = [];

    for (let i = 4; i >= 0; i--) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() - i);

      const diaSemana = d.getDay();
      if (diaSemana === 0 || diaSemana === 6) continue;

      const dataStr = d.toISOString().slice(0, 10);
      const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

      const snapshot = await colecaoPresencas
        .where('data', '==', dataStr)
        .get();

      const presentes = snapshot.docs
        .map((doc) => doc.data() as Presenca)
        .filter((p) => p.horaEntrada).length;

      resultado.push({ dia: dataStr, label: dias[diaSemana], presentes });
    }

    res.json({ success: true, semana: resultado });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar frequência da semana.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
