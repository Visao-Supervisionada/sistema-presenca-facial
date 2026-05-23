export type StatusEntrada = 'pendente' | 'presente' | 'atrasado' | 'ausente';

export type StatusSaida = 'pendente' | 'saida_registrada';

export type StatusPresencaMensal = 'presente' | 'atrasado' | 'falta' | 'justificado' | 'pendente';

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

  criadoEm?: FirebaseFirestore.FieldValue;
  atualizadoEm?: FirebaseFirestore.FieldValue;
}

export interface JustificativaFalta {
  id: string;
  alunoId: string;
  turma: string;
  componente?: string;
  data: string;
  justificativa: string;
  criadoEm?: FirebaseFirestore.FieldValue;
}

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

export interface TotaisMensais {
  presentes: number;
  atrasados: number;
  faltas: number;
  pendentes: number;
}

export interface RespostaDiarioMensal {
  alunos: PresencaMensalAluno[];
  totais: TotaisMensais;
}