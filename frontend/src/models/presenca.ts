export interface Presenca {
  id: string;
  alunoId: string;
  nome: string;
  matricula: string;
  data: string;
  horaEntrada: string;
  horaSaida: string | null;
  status: string;
  confidence: number;
  origem: string;
}