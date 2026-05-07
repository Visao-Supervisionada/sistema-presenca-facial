import { listarAlunos } from './alunos.service';
import {
  excluirFaceNaApi,
  limparTodasFacesNaApi,
  listarPessoasNaApiFacial,
} from './reconhecimento.service';

function normalizarMatricula(valor: string) {
  return String(valor || '').trim();
}

export async function limparBaseFacialForaDoFirebase() {
  const alunos = await listarAlunos();
  const pessoasFaciais = await listarPessoasNaApiFacial();

  const matriculasValidas = new Set(
    alunos.map((aluno) => normalizarMatricula(aluno.matricula)),
  );


  if (alunos.length === 0 && pessoasFaciais.length > 0) {
    await limparTodasFacesNaApi();

    return {
      totalAlunosFirebase: 0,
      totalPessoasFaciais: pessoasFaciais.length,
      totalMantidas: 0,
      totalRemovidas: pessoasFaciais.length,
      totalErros: 0,
      matriculasValidas: [],
      pessoasMantidas: [],
      pessoasRemovidas: pessoasFaciais.map((pessoa) => ({
        id: pessoa.id,
        nome: pessoa.name,
        registration: normalizarMatricula(pessoa.registration),
        motivo: 'Firebase está vazio. Base facial foi limpa.',
      })),
      pessoasComErro: [],
    };
  }

  const pessoasMantidas = [];
  const pessoasRemovidas = [];
  const pessoasComErro = [];

  for (const pessoa of pessoasFaciais) {
    const registration = normalizarMatricula(pessoa.registration);

    if (registration && matriculasValidas.has(registration)) {
      pessoasMantidas.push({
        id: pessoa.id,
        nome: pessoa.name,
        registration,
      });

      continue;
    }

    try {
      await excluirFaceNaApi(registration);

      pessoasRemovidas.push({
        id: pessoa.id,
        nome: pessoa.name,
        registration,
        motivo: registration
          ? 'Matrícula não existe no Firebase.'
          : 'Pessoa sem matrícula na base facial.',
      });
    } catch (error) {
      pessoasComErro.push({
        id: pessoa.id,
        nome: pessoa.name,
        registration,
        erro: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    totalAlunosFirebase: alunos.length,
    totalPessoasFaciais: pessoasFaciais.length,
    totalMantidas: pessoasMantidas.length,
    totalRemovidas: pessoasRemovidas.length,
    totalErros: pessoasComErro.length,
    matriculasValidas: Array.from(matriculasValidas),
    pessoasMantidas,
    pessoasRemovidas,
    pessoasComErro,
  };
}