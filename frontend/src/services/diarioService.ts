const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export type StatusEntrada = 'pendente' | 'presente' | 'atrasado' | 'ausente';
export type StatusSaida = 'pendente' | 'saida_registrada';

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