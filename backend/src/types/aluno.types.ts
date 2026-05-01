export interface CriarAlunoDTO {
  nome: string;
  matricula: string;
  turma?: string;
  perfil: 'aluno' | 'professor' | 'funcionario';
  faceId?: string;
}

export interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  turma: string;
  perfil: 'aluno' | 'professor' | 'funcionario';
  faceId: string;
  ativo: boolean;
  criadoEm?: FirebaseFirestore.FieldValue;
}