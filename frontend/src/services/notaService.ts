const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export interface Nota {
  id: string;
  alunoId: string;
  turmaId: string;
  componente: string;
  bimestre: 1 | 2 | 3 | 4;
  av1: number | null;
  av2: number | null;
  av3: number | null;
  av4: number | null;
  media: number | null;
}

export async function listarNotas(params: {
  turmaId: string;
  componente?: string;
}): Promise<Nota[]> {
  const url = new URL(`${BACKEND_URL}/api/notas/${encodeURIComponent(params.turmaId)}`);
  if (params.componente) url.searchParams.set('componente', params.componente);

  const resposta = await fetch(url.toString());
  const resultado = await resposta.json();
  if (!resposta.ok) throw new Error(resultado.message || 'Erro ao listar notas.');
  return resultado.notas as Nota[];
}

export async function salvarNota(dados: {
  alunoId: string;
  turmaId: string;
  componente: string;
  bimestre: 1 | 2 | 3 | 4;
  av1?: number | null;
  av2?: number | null;
  av3?: number | null;
  av4?: number | null;
}): Promise<Nota> {
  const resposta = await fetch(`${BACKEND_URL}/api/notas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  const resultado = await resposta.json();
  if (!resposta.ok) throw new Error(resultado.message || 'Erro ao salvar nota.');
  return resultado.nota as Nota;
}
