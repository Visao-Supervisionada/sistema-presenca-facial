const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export interface ComponenteCurricular {
  id: string;
  nome: string;
  turma: string;
  ativo: boolean;
}

export async function listarComponentes(turmaId: string): Promise<ComponenteCurricular[]> {
  const resposta = await fetch(`${BACKEND_URL}/api/componentes/${encodeURIComponent(turmaId)}`);
  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.message || 'Erro ao listar componentes.');
  }

  return resultado.componentes as ComponenteCurricular[];
}
