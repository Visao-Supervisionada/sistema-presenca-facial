export interface PessoaReconhecida {
  id: string;
  name: string;
  registration: string;
}

export interface ResultadoReconhecimentoFacial {
  bbox: number[];
  matched: boolean;
  name: string;
  registration: string;
  confidence: number;
  cosine_confidence: number;
}

export interface RespostaReconhecimentoMultiplo {
  total_faces: number;
  results: ResultadoReconhecimentoFacial[];
  threshold: number;
  min_cosine_threshold: number;
  classifier_loaded: boolean;
}

export interface RespostaEnrollFacial {
  success: boolean;
  message: string;
  person: PessoaReconhecida;
}