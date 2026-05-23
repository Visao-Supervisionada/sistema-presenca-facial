import { db, timestampServidor } from '../config/firebase';
import { Nota, SalvarNotaDTO } from '../types/nota.types';

const colecao = db.collection('notas');

function calcularMedia(
  av1?: number | null,
  av2?: number | null,
  av3?: number | null,
  av4?: number | null,
): number | null {
  const notas = [av1, av2, av3, av4].filter((n): n is number => n != null);
  if (notas.length === 0) return null;
  return Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 100) / 100;
}

export async function listarNotas(params: {
  turmaId: string;
  componente?: string;
}): Promise<Nota[]> {
  const snapshot = await colecao.where('turmaId', '==', params.turmaId).get();

  let notas = snapshot.docs.map((d) => d.data() as Nota);

  if (params.componente) {
    notas = notas.filter((n) => n.componente === params.componente);
  }

  return notas;
}

export async function salvarNota(dados: SalvarNotaDTO): Promise<Nota> {
  const idSafe = `${dados.alunoId}_${dados.turmaId}_${dados.componente}_${dados.bimestre}`
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '');
  const ref = colecao.doc(idSafe);
  const docAtual = await ref.get();

  const media = calcularMedia(dados.av1, dados.av2, dados.av3, dados.av4);

  const nota: Nota = {
    id: idSafe,
    alunoId: dados.alunoId,
    turmaId: dados.turmaId,
    componente: dados.componente,
    bimestre: dados.bimestre,
    av1: dados.av1 ?? null,
    av2: dados.av2 ?? null,
    av3: dados.av3 ?? null,
    av4: dados.av4 ?? null,
    media,
    atualizadoEm: timestampServidor(),
    ...(docAtual.exists ? {} : { criadoEm: timestampServidor() }),
  };

  await ref.set(nota, { merge: true });
  return nota;
}
