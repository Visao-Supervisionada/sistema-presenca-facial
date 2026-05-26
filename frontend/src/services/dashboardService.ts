const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export interface PresencaDia {
  id: string;
  alunoId: string;
  nome: string;
  matricula: string;
  turma: string;
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

export async function buscarResumoDia(data: string): Promise<ResumoDia> {
  const resposta = await fetch(`${BACKEND_URL}/api/dashboard/resumo?data=${data}`);
  const json = await resposta.json();

  if (!resposta.ok) {
    throw new Error(json.message || 'Erro ao buscar resumo do dashboard.');
  }

  return json as ResumoDia;
}

export async function buscarDadosSemana(): Promise<DadosSemana[]> {
  const resposta = await fetch(`${BACKEND_URL}/api/dashboard/semana`);
  const json = await resposta.json();

  if (!resposta.ok) {
    throw new Error(json.message || 'Erro ao buscar frequência da semana.');
  }

  return json.semana as DadosSemana[];
}
