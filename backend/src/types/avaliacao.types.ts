export type TipoAvaliacao = 'Prova' | 'Trabalho' | 'Seminário' | 'Atividade' | 'Projeto';

export interface Avaliacao {
  id: string;
  turmaId: string;
  componente: string;
  data: string;
  titulo: string;
  tipo: TipoAvaliacao;
  valor: number;
  objetosIds: string[];
  criterios: string;
  criadoEm?: FirebaseFirestore.FieldValue;
}

export interface CriarAvaliacaoDTO {
  turmaId: string;
  componente: string;
  data: string;
  titulo: string;
  tipo: TipoAvaliacao;
  valor: number;
  objetosIds: string[];
  criterios: string;
}
