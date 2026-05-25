import { Presenca } from '../models/presenca';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export async function listarPresencas(): Promise<{
  success: boolean;
  total: number;
  presencas: Presenca[];
}> {
  const resposta = await fetch(`${BACKEND_URL}/api/presencas`);

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.message || 'Erro ao listar presenças');
  }

  return resultado;
}