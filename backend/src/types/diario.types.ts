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

  criadoEm?: FirebaseFirestore.FieldValue;
  atualizadoEm?: FirebaseFirestore.FieldValue;
}