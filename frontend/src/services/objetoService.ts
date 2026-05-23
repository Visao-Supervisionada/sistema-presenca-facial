const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export type StatusObjeto = 'letivo' | 'ministrado' | 'nao_ministrado' | 'evento';

export interface ObjetoConhecimento {
  id: string;
  turmaId: string;
  componente: string;
  data: string;
  conteudo: string;
  status: StatusObjeto;
}

export async function listarObjetos(params: {
  turmaId: string;
  componente?: string;
  mes?: number;
  ano?: number;
}): Promise<ObjetoConhecimento[]> {
  const url = new URL(`${BACKEND_URL}/api/objetos-conhecimento/${encodeURIComponent(params.turmaId)}`);
  if (params.componente) url.searchParams.set('componente', params.componente);
  if (params.mes) url.searchParams.set('mes', String(params.mes));
  if (params.ano) url.searchParams.set('ano', String(params.ano));

  const resposta = await fetch(url.toString());
  const resultado = await resposta.json();
  if (!resposta.ok) throw new Error(resultado.message || 'Erro ao listar objetos.');
  return resultado.objetos as ObjetoConhecimento[];
}

export async function criarObjeto(dados: {
  turmaId: string;
  componente: string;
  data: string;
  conteudo: string;
  status: StatusObjeto;
}): Promise<ObjetoConhecimento> {
  const resposta = await fetch(`${BACKEND_URL}/api/objetos-conhecimento`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  const resultado = await resposta.json();
  if (!resposta.ok) throw new Error(resultado.message || 'Erro ao criar objeto.');
  return resultado.objeto as ObjetoConhecimento;
}

export async function excluirObjeto(id: string): Promise<void> {
  const resposta = await fetch(`${BACKEND_URL}/api/objetos-conhecimento/${id}`, { method: 'DELETE' });
  if (!resposta.ok) {
    const resultado = await resposta.json();
    throw new Error(resultado.message || 'Erro ao excluir objeto.');
  }
}
