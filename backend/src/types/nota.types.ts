export interface Nota {
  id: string;
  alunoId: string;
  turmaId: string;
  componente: string;
  bimestre: 1 | 2 | 3 | 4;
  av1: number | null;
  av2: number | null;
  av3: number | null;
  av4: number | null;
  media: number | null;
  criadoEm?: FirebaseFirestore.FieldValue;
  atualizadoEm?: FirebaseFirestore.FieldValue;
}

export interface SalvarNotaDTO {
  alunoId: string;
  turmaId: string;
  componente: string;
  bimestre: 1 | 2 | 3 | 4;
  av1?: number | null;
  av2?: number | null;
  av3?: number | null;
  av4?: number | null;
}
