export type DiaSemana =
  | 'domingo'
  | 'segunda'
  | 'terca'
  | 'quarta'
  | 'quinta'
  | 'sexta'
  | 'sabado';

export interface CriarHorarioDTO {
  matricula: string;
  nome: string;
  turma: string;
  diaSemana: DiaSemana;
  horaEntrada: string;
  horaLimiteEntrada: string;
  horaSaida: string;
}

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
  criadoEm?: FirebaseFirestore.FieldValue;
  atualizadoEm?: FirebaseFirestore.FieldValue;
}