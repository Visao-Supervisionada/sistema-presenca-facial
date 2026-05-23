import { db, timestampServidor } from '../config/firebase';
import { ComponenteCurricular, CriarComponenteDTO } from '../types/componente.types';

const colecaoComponentes = db.collection('componentes_curriculares');

export async function listarComponentesPorTurma(turma: string): Promise<ComponenteCurricular[]> {
  const snapshot = await colecaoComponentes
    .where('turma', '==', String(turma).trim())
    .get();

  return snapshot.docs
    .map((doc) => doc.data() as ComponenteCurricular)
    .filter((c) => c.ativo)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export async function criarComponente(dados: CriarComponenteDTO): Promise<ComponenteCurricular> {
  const referencia = colecaoComponentes.doc();

  const componente: ComponenteCurricular = {
    id: referencia.id,
    nome: String(dados.nome).trim(),
    turma: String(dados.turma).trim(),
    ativo: true,
    criadoEm: timestampServidor(),
  };

  await referencia.set(componente);

  return componente;
}
