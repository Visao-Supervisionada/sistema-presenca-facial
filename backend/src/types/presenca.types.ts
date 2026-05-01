export interface Presenca {
  id?: string;
  alunoId: string;
  nome: string;
  matricula: string;
  data: string;
  horaEntrada?: string | null;
  horaSaida?: string | null;
  status: 'presente' | 'saida_registrada';
  confidence?: number;
  origem: 'reconhecimento_facial';
}