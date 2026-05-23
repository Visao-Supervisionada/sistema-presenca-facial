export interface ComponenteCurricular {
  id: string;
  nome: string;
  turma: string;
  ativo: boolean;
  criadoEm?: FirebaseFirestore.FieldValue;
}

export interface CriarComponenteDTO {
  nome: string;
  turma: string;
}
