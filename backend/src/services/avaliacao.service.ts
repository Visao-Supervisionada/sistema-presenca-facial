import { db, timestampServidor } from '../config/firebase';
import { Avaliacao, CriarAvaliacaoDTO } from '../types/avaliacao.types';

const colecao = db.collection('avaliacoes');

export async function listarAvaliacoes(params: {
  turmaId: string;
  componente?: string;
  mes?: number;
  ano?: number;
}): Promise<Avaliacao[]> {
  const snapshot = await colecao.where('turmaId', '==', params.turmaId).get();

  let avaliacoes = snapshot.docs.map((d) => d.data() as Avaliacao);

  if (params.componente) {
    avaliacoes = avaliacoes.filter((a) => a.componente === params.componente);
  }

  if (params.mes && params.ano) {
    const inicio = `${params.ano}-${String(params.mes).padStart(2, '0')}-01`;
    const ultimoDia = new Date(params.ano, params.mes, 0).getDate();
    const fim = `${params.ano}-${String(params.mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
    avaliacoes = avaliacoes.filter((a) => a.data >= inicio && a.data <= fim);
  }

  return avaliacoes.sort((a, b) => a.data.localeCompare(b.data));
}

export async function criarAvaliacao(dados: CriarAvaliacaoDTO): Promise<Avaliacao> {
  const ref = colecao.doc();
  const avaliacao: Avaliacao = {
    id: ref.id,
    turmaId: dados.turmaId,
    componente: dados.componente,
    data: dados.data,
    titulo: dados.titulo,
    tipo: dados.tipo,
    valor: dados.valor,
    objetosIds: dados.objetosIds,
    criterios: dados.criterios,
    criadoEm: timestampServidor(),
  };
  await ref.set(avaliacao);
  return avaliacao;
}

export async function excluirAvaliacao(id: string): Promise<void> {
  await colecao.doc(id).delete();
}
