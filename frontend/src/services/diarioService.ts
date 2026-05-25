const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export type StatusEntrada = 'pendente' | 'presente' | 'atrasado' | 'ausente';
export type StatusSaida = 'pendente' | 'saida_registrada';
export type StatusPresencaMensal = 'presente' | 'atrasado' | 'falta' | 'justificado' | 'pendente';

export interface PresencaDoDia {
  data: string;
  status: StatusPresencaMensal;
  horaEntradaReal?: string | null;
  justificativa?: string;
}

export interface PresencaMensalAluno {
  alunoId: string;
  nome: string;
  matricula: string;
  turma: string;
  dias: Record<string, PresencaDoDia>;
}

export interface RegistroDiario {
  id: string;
  data: string;

  alunoId: string;
  nome: string;
  matricula: string;
  turma: string;

  horaEntradaPrevista: string;
  horaLimiteEntrada: string;
  horaSaidaPrevista: string;

  horaEntradaReal: string | null;
  horaSaidaReal: string | null;

  statusEntrada: StatusEntrada;
  statusSaida: StatusSaida;

  origemEntrada?: 'manual' | 'reconhecimento_facial';
  origemSaida?: 'manual' | 'reconhecimento_facial';

  confidenceEntrada?: number;
  confidenceSaida?: number;
}

export async function listarDiario(params: { turma: string; data: string }) {
  const url = new URL(`${BACKEND_URL}/api/diario`);

  url.searchParams.set('turma', params.turma.trim());
  url.searchParams.set('data', params.data);

  const resposta = await fetch(url.toString());
  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.message || 'Erro ao listar diário.');
  }

  return resultado as {
    success: boolean;
    total: number;
    registros: RegistroDiario[];
  };
}

export async function confirmarEntrada(params: {
  matricula: string;
  data: string;
  origem?: 'manual' | 'reconhecimento_facial';
  confidence?: number;
}) {
  const resposta = await fetch(`${BACKEND_URL}/api/diario/entrada`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      matricula: params.matricula.trim(),
      data: params.data,
      origem: params.origem || 'manual',
      confidence: params.confidence,
    }),
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.message || 'Erro ao confirmar entrada.');
  }

  return resultado;
}

export async function confirmarSaida(params: {
  matricula: string;
  data: string;
  origem?: 'manual' | 'reconhecimento_facial';
  confidence?: number;
}) {
  const resposta = await fetch(`${BACKEND_URL}/api/diario/saida`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      matricula: params.matricula.trim(),
      data: params.data,
      origem: params.origem || 'manual',
      confidence: params.confidence,
    }),
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.message || 'Erro ao confirmar saída.');
  }

  return resultado;
}

export async function marcarFalta(params: { matricula: string; data: string }) {
  const resposta = await fetch(`${BACKEND_URL}/api/diario/falta`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      matricula: params.matricula.trim(),
      data: params.data,
    }),
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.message || 'Erro ao marcar falta.');
  }

  return resultado;
}

export async function listarDiarioMensal(params: {
  turmaId: string;
  mes: number;
  ano: number;
  componente?: string;
}) {
  const url = new URL(`${BACKEND_URL}/api/diario/${encodeURIComponent(params.turmaId)}/mensal`);
  url.searchParams.set('mes', String(params.mes));
  url.searchParams.set('ano', String(params.ano));
  if (params.componente) url.searchParams.set('componente', params.componente);

  const resposta = await fetch(url.toString());
  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.message || 'Erro ao listar diário mensal.');
  }

  return resultado as {
    success: boolean;
    total: number;
    alunos: PresencaMensalAluno[];
    totais: { presentes: number; atrasados: number; faltas: number; pendentes: number };
  };
}

export async function justificarFalta(params: {
  alunoId: string;
  turma: string;
  data: string;
  componente?: string;
  justificativa: string;
}) {
  const resposta = await fetch(`${BACKEND_URL}/api/diario/justificar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.message || 'Erro ao justificar falta.');
  }

  return resultado;
}

export async function fecharDia(params: { turmaId: string; data: string }) {
  const resposta = await fetch(`${BACKEND_URL}/api/diario/fechar-dia`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.message || 'Erro ao fechar dia.');
  }

  return resultado;
}

export async function fecharTurno(params: { turno: 'matutino' | 'vespertino'; data: string }) {
  const resposta = await fetch(`${BACKEND_URL}/api/diario/fechar-turno`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.message || 'Erro ao fechar turno.');
  }

  return resultado as { success: boolean; turno: string; processados: number; faltas: number };
}