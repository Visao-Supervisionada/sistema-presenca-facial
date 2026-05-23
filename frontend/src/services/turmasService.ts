const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export interface Professor {
  id: string;
  nome: string;
  matricula: string;
  turma: string;
  perfil: string;
}

export async function listarTurmasDisponiveis(): Promise<string[]> {
  const resposta = await fetch(`${BACKEND_URL}/api/alunos/turmas`);
  const resultado = await resposta.json();
  if (!resposta.ok) throw new Error(resultado.message || 'Erro ao listar turmas.');
  return resultado.turmas as string[];
}

export async function listarProfessoresDisponiveis(): Promise<Professor[]> {
  const resposta = await fetch(`${BACKEND_URL}/api/alunos/professores`);
  const resultado = await resposta.json();
  if (!resposta.ok) throw new Error(resultado.message || 'Erro ao listar professores.');
  return resultado.professores as Professor[];
}
