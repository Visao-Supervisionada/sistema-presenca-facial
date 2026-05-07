const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export type DiaSemana =
  | 'domingo'
  | 'segunda'
  | 'terca'
  | 'quarta'
  | 'quinta'
  | 'sexta'
  | 'sabado';

export interface Horario {
  id: string;
  matricula: string;
  nome: string;
  turma: string;
  diaSemana: DiaSemana;
  horaEntrada: string;
  horaLimiteEntrada: string;
  horaSaida: string;
  ativo: boolean;
}

export interface CriarHorarioDTO {
  matricula: string;
  nome: string;
  turma: string;
  diaSemana: DiaSemana;
  horaEntrada: string;
  horaLimiteEntrada: string;
  horaSaida: string;
}

export async function listarHorarios(params?: {
  turma?: string;
  matricula?: string;
  diaSemana?: DiaSemana;
}) {
  const url = new URL(`${BACKEND_URL}/api/horarios`);

  if (params?.turma) {
    url.searchParams.set('turma', params.turma);
  }

  if (params?.matricula) {
    url.searchParams.set('matricula', params.matricula);
  }

  if (params?.diaSemana) {
    url.searchParams.set('diaSemana', params.diaSemana);
  }

  const resposta = await fetch(url.toString());
  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.message || 'Erro ao listar horários.');
  }

  return resultado as {
    success: boolean;
    total: number;
    horarios: Horario[];
  };
}

export async function criarHorario(dados: CriarHorarioDTO) {
  const resposta = await fetch(`${BACKEND_URL}/api/horarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      matricula: dados.matricula.trim(),
      nome: dados.nome.trim(),
      turma: dados.turma.trim(),
      diaSemana: dados.diaSemana,
      horaEntrada: dados.horaEntrada.trim(),
      horaLimiteEntrada: dados.horaLimiteEntrada.trim(),
      horaSaida: dados.horaSaida.trim(),
    }),
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.message || 'Erro ao criar horário.');
  }

  return resultado;
}

export async function excluirHorario(id: string) {
  const resposta = await fetch(`${BACKEND_URL}/api/horarios/${id}`, {
    method: 'DELETE',
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.message || 'Erro ao excluir horário.');
  }

  return resultado;
}