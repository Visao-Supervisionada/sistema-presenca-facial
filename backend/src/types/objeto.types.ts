export type StatusObjeto = 'letivo' | 'ministrado' | 'nao_ministrado' | 'evento';

export interface ObjetoConhecimento {
  id: string;
  turmaId: string;
  componente: string;
  data: string;
  conteudo: string;
  status: StatusObjeto;
  criadoEm?: FirebaseFirestore.FieldValue;
  atualizadoEm?: FirebaseFirestore.FieldValue;
}

export interface CriarObjetoDTO {
  turmaId: string;
  componente: string;
  data: string;
  conteudo: string;
  status: StatusObjeto;
}
