const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export type TipoAvaliacao = 'Prova' | 'Trabalho' | 'Seminário' | 'Atividade' | 'Projeto';

export interface Avaliacao {
  id: string;
  turmaId: string;
  componente: string;
  data: string;
  titulo: string;
  tipo: TipoAvaliacao;
  valor: number;
  objetosIds: string[];
  criterios: string;
}

export async function listarAvaliacoes(params: {
  turmaId: string;
  componente?: string;
  mes?: number;
  ano?: number;
}): Promise<Avaliacao[]> {
  const url = new URL(`${BACKEND_URL}/api/avaliacoes/${encodeURIComponent(params.turmaId)}`);
  if (params.componente) url.searchParams.set('componente', params.componente);
  if (params.mes) url.searchParams.set('mes', String(params.mes));
  if (params.ano) url.searchParams.set('ano', String(params.ano));

  const resposta = await fetch(url.toString());
  const resultado = await resposta.json();
  if (!resposta.ok) throw new Error(resultado.message || 'Erro ao listar avaliações.');
  return resultado.avaliacoes as Avaliacao[];
}

export async function criarAvaliacao(dados: {
  turmaId: string;
  componente: string;
  data: string;
  titulo: string;
  tipo: TipoAvaliacao;
  valor: number;
  objetosIds: string[];
  criterios: string;
}): Promise<Avaliacao> {
  const resposta = await fetch(`${BACKEND_URL}/api/avaliacoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  const resultado = await resposta.json();
  if (!resposta.ok) throw new Error(resultado.message || 'Erro ao criar avaliação.');
  return resultado.avaliacao as Avaliacao;
}

export async function excluirAvaliacao(id: string): Promise<void> {
  const resposta = await fetch(`${BACKEND_URL}/api/avaliacoes/${id}`, { method: 'DELETE' });
  if (!resposta.ok) {
    const resultado = await resposta.json();
    throw new Error(resultado.message || 'Erro ao excluir avaliação.');
  }
}
