const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  turma: string;
  perfil: string;
  faceId?: string;
  ativo: boolean;
}

export interface DadosCadastroAluno {
  nome: string;
  matricula: string;
  turma: string;
  perfil: string;
  imagensBase64: string[];
}

function converterBase64ParaArquivo(base64: string, nomeArquivo: string): File {
  const partes = base64.split(',');
  const tipo = partes[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binario = atob(partes[1]);

  const arrayBuffer = new ArrayBuffer(binario.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let indice = 0; indice < binario.length; indice++) {
    uint8Array[indice] = binario.charCodeAt(indice);
  }

  return new File([arrayBuffer], nomeArquivo, {
    type: tipo,
  });
}

export async function cadastrarAluno(dados: DadosCadastroAluno) {
  const formulario = new FormData();

  const matriculaNormalizada = dados.matricula.trim();

  formulario.append('nome', dados.nome.trim());
  formulario.append('matricula', matriculaNormalizada);
  formulario.append('turma', dados.turma.trim());
  formulario.append('perfil', dados.perfil.trim());

  dados.imagensBase64.forEach((imagem, indice) => {
    const arquivo = converterBase64ParaArquivo(
      imagem,
      `${matriculaNormalizada}_foto${indice + 1}.jpg`,
    );
    formulario.append('files', arquivo);
  });

  const resposta = await fetch(`${BACKEND_URL}/api/alunos`, {
    method: 'POST',
    body: formulario,
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.message || 'Erro ao cadastrar aluno.');
  }

  return resultado;
}

export async function listarAlunos() {
  const resposta = await fetch(`${BACKEND_URL}/api/alunos`);
  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.message || 'Erro ao listar alunos.');
  }

  return resultado as {
    total: number;
    alunos: Aluno[];
  };
}

export async function excluirAluno(id: string) {
  const resposta = await fetch(`${BACKEND_URL}/api/alunos/${id}`, {
    method: 'DELETE',
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.message || 'Erro ao excluir aluno.');
  }

  return resultado;
}