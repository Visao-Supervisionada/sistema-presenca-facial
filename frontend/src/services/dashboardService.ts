const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export interface PresencaDia {
  id: string;
  alunoId: string;
  nome: string;
  matricula: string;
  turma: string;
  perfil?: string;
  data: string;
  horaEntrada: string | null;
  horaSaida: string | null;
  status: string;
  origem: string;
  confidence?: number;
}

export interface ResumoDia {
  total: number;
  presentes: number;
  ausentes: number;
  atrasos: number;
  percentualPresenca: number;
  presencas: PresencaDia[];
}

export interface DadosSemana {
  dia: string;
  label: string;
  presentes: number;
}

function formatarData(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function labelDia(dataStr: string): string {
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const [ano, mes, dia] = dataStr.split('-').map(Number);
  const d = new Date(ano, mes - 1, dia);
  return dias[d.getDay()];
}

export async function buscarResumoDia(data: string): Promise<ResumoDia> {
  const [resAlunos, resPresencas] = await Promise.all([
    fetch(`${BACKEND_URL}/api/alunos`).then((r) => r.json()),
    fetch(`${BACKEND_URL}/api/presencas?data=${data}`).then((r) => r.json()),
  ]);

  const total: number = resAlunos.total ?? 0;
  const presencas: PresencaDia[] = resPresencas.presencas ?? [];

  const presentes = presencas.filter((p) => p.horaEntrada).length;
  const atrasos = presencas.filter((p) => p.status === 'atrasado').length;
  const ausentes = Math.max(0, total - presentes);
  const percentualPresenca = total > 0 ? Math.round((presentes / total) * 100) : 0;

  return { total, presentes, ausentes, atrasos, percentualPresenca, presencas };
}

export async function buscarDadosSemana(): Promise<DadosSemana[]> {
  const hoje = new Date();
  const dias: DadosSemana[] = [];

  for (let i = 4; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - i);

    const diaSemana = d.getDay();
    if (diaSemana === 0 || diaSemana === 6) continue;

    const dataStr = formatarData(d);

    try {
      const res = await fetch(`${BACKEND_URL}/api/presencas?data=${dataStr}`);
      const json = await res.json();
      const presentes = (json.presencas ?? []).filter((p: PresencaDia) => p.horaEntrada).length;
      dias.push({ dia: dataStr, label: labelDia(dataStr), presentes });
    } catch {
      dias.push({ dia: dataStr, label: labelDia(dataStr), presentes: 0 });
    }
  }

  return dias;
}
