import { db, timestampServidor } from '../config/firebase';
import { CriarObjetoDTO, ObjetoConhecimento } from '../types/objeto.types';

const colecao = db.collection('objetos_conhecimento');

export async function listarObjetos(params: {
  turmaId: string;
  componente?: string;
  mes?: number;
  ano?: number;
}): Promise<ObjetoConhecimento[]> {
  const snapshot = await colecao.where('turmaId', '==', params.turmaId).get();

  let objetos = snapshot.docs.map((d) => d.data() as ObjetoConhecimento);

  if (params.componente) {
    objetos = objetos.filter((o) => o.componente === params.componente);
  }

  if (params.mes && params.ano) {
    const inicio = `${params.ano}-${String(params.mes).padStart(2, '0')}-01`;
    const ultimoDia = new Date(params.ano, params.mes, 0).getDate();
    const fim = `${params.ano}-${String(params.mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
    objetos = objetos.filter((o) => o.data >= inicio && o.data <= fim);
  }

  return objetos.sort((a, b) => a.data.localeCompare(b.data));
}

export async function criarObjeto(dados: CriarObjetoDTO): Promise<ObjetoConhecimento> {
  const ref = colecao.doc();
  const objeto: ObjetoConhecimento = {
    id: ref.id,
    turmaId: dados.turmaId,
    componente: dados.componente,
    data: dados.data,
    conteudo: dados.conteudo,
    status: dados.status,
    criadoEm: timestampServidor(),
    atualizadoEm: timestampServidor(),
  };
  await ref.set(objeto);
  return objeto;
}

export async function atualizarObjeto(
  id: string,
  dados: Partial<CriarObjetoDTO>,
): Promise<void> {
  await colecao.doc(id).update({ ...dados, atualizadoEm: timestampServidor() });
}

export async function excluirObjeto(id: string): Promise<void> {
  await colecao.doc(id).delete();
}
