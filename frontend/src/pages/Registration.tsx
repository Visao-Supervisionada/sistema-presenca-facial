import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Camera, Loader2, Save, Trash2, User, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  cadastrarAluno,
  excluirAluno,
  listarAlunos,
  type Aluno,
} from "@/services/alunosService";

export default function Registration() {
  const [imagemCapturada, setImagemCapturada] = useState<string | null>(null);
  const [capturando, setCapturando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [excluindoAlunoId, setExcluindoAlunoId] = useState<string | null>(null);

  const [dadosFormulario, setDadosFormulario] = useState({
    nome: "",
    perfil: "aluno",
    turma: "",
    matricula: "",
  });

  const webcamRef = useRef<Webcam>(null);

  async function carregarAlunos() {
    try {
      setCarregandoAlunos(true);

      const resultado = await listarAlunos();

      setAlunos(resultado.alunos);
    } catch (error) {
      toast.error("Erro ao carregar alunos.", {
        description:
          error instanceof Error ? error.message : "Erro inesperado.",
      });
    } finally {
      setCarregandoAlunos(false);
    }
  }

  useEffect(() => {
    carregarAlunos();
  }, []);

  const capturarImagem = useCallback(() => {
    const imagem = webcamRef.current?.getScreenshot();

    if (imagem) {
      setImagemCapturada(imagem);
      setCapturando(false);
      return;
    }

    toast.error("Não foi possível capturar a imagem.");
  }, []);

  function tirarOutraFoto() {
    setImagemCapturada(null);
    setCapturando(true);
  }

  async function salvarCadastro(evento: React.FormEvent) {
    evento.preventDefault();

    if (!imagemCapturada) {
      toast.error("Capture uma imagem facial antes de salvar.");
      return;
    }

    try {
      setSalvando(true);

      const resultado = await cadastrarAluno({
        nome: dadosFormulario.nome.trim(),
        matricula: dadosFormulario.matricula.trim(),
        turma: dadosFormulario.turma.trim(),
        perfil: dadosFormulario.perfil,
        imagemBase64: imagemCapturada,
      });

      toast.success("Aluno cadastrado com sucesso.", {
        description: resultado.aluno?.nome || dadosFormulario.nome,
      });

      setDadosFormulario({
        nome: "",
        perfil: "aluno",
        turma: "",
        matricula: "",
      });

      setImagemCapturada(null);
      setCapturando(false);

      await carregarAlunos();
    } catch (error) {
      toast.error("Erro ao cadastrar aluno.", {
        description:
          error instanceof Error ? error.message : "Erro inesperado.",
      });
    } finally {
      setSalvando(false);
    }
  }

  async function removerAluno(aluno: Aluno) {
    const confirmou = window.confirm(
      `Deseja excluir ${aluno.nome}? Isso também remove o cadastro facial da API.`,
    );

    if (!confirmou) return;

    try {
      setExcluindoAlunoId(aluno.id);

      await excluirAluno(aluno.id);

      toast.success("Aluno excluído com sucesso.", {
        description: "O aluno foi removido do Firebase e da API facial.",
      });

      await carregarAlunos();
    } catch (error) {
      toast.error("Erro ao excluir aluno.", {
        description:
          error instanceof Error ? error.message : "Erro inesperado.",
      });
    } finally {
      setExcluindoAlunoId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Cadastro de Usuários
        </h1>
        <p className="text-gray-500">
          Cadastre alunos e capture a biometria facial.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
            <CardDescription>Preencha as informações do aluno.</CardDescription>
          </CardHeader>

          <form onSubmit={salvarCadastro}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-gray-700"
                  htmlFor="nome"
                >
                  Nome completo
                </label>

                <Input
                  id="nome"
                  placeholder="Ex: João da Silva"
                  value={dadosFormulario.nome}
                  onChange={(evento) =>
                    setDadosFormulario({
                      ...dadosFormulario,
                      nome: evento.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-gray-700"
                    htmlFor="perfil"
                  >
                    Perfil
                  </label>

                  <select
                    id="perfil"
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={dadosFormulario.perfil}
                    onChange={(evento) =>
                      setDadosFormulario({
                        ...dadosFormulario,
                        perfil: evento.target.value,
                      })
                    }
                  >
                    <option value="aluno">Aluno</option>
                    <option value="professor">Professor</option>
                    <option value="funcionario">Funcionário</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-gray-700"
                    htmlFor="matricula"
                  >
                    Matrícula
                  </label>

                  <Input
                    id="matricula"
                    placeholder="Ex: 2026001"
                    value={dadosFormulario.matricula}
                    onChange={(evento) =>
                      setDadosFormulario({
                        ...dadosFormulario,
                        matricula: evento.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              {dadosFormulario.perfil === "aluno" && (
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-gray-700"
                    htmlFor="turma"
                  >
                    Turma
                  </label>

                  <Input
                    id="turma"
                    placeholder="Ex: 3º Ano A"
                    value={dadosFormulario.turma}
                    onChange={(evento) =>
                      setDadosFormulario({
                        ...dadosFormulario,
                        turma: evento.target.value,
                      })
                    }
                    required
                  />
                </div>
              )}
            </CardContent>

            <CardFooter className="mt-6 border-t border-gray-100 bg-gray-50 py-4">
              <Button
                type="submit"
                className="w-full"
                disabled={!imagemCapturada || salvando}
              >
                {salvando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Cadastro
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Biometria Facial</CardTitle>
            <CardDescription>
              Capture uma foto clara e frontal do rosto.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative flex aspect-[4/3] w-full max-w-sm items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-100">
                {!imagemCapturada && !capturando && (
                  <div className="p-6 text-center">
                    <User className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                    <p className="mb-4 text-sm text-gray-500">
                      Nenhuma imagem capturada
                    </p>

                    <Button
                      type="button"
                      onClick={() => setCapturando(true)}
                      variante="contorno"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Iniciar Câmera
                    </Button>
                  </div>
                )}

                {capturando && (
                  <div className="relative h-full w-full">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      screenshotQuality={0.75}
                      videoConstraints={{
                        width: 640,
                        height: 480,
                        facingMode: "user",
                      }}
                      className="h-full w-full object-cover"
                    />

                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="h-64 w-48 rounded-[100%] border-2 border-green-500/60 shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                    </div>
                  </div>
                )}

                {imagemCapturada && (
                  <img
                    src={imagemCapturada}
                    alt="Captura facial"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="flex w-full max-w-sm gap-3">
                {capturando && (
                  <>
                    <Button
                      type="button"
                      onClick={capturarImagem}
                      className="flex-1"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Capturar
                    </Button>

                    <Button
                      type="button"
                      onClick={() => setCapturando(false)}
                      variante="contorno"
                      tamanho="icone"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {imagemCapturada && (
                  <Button
                    type="button"
                    onClick={tirarOutraFoto}
                    className="flex-1"
                    variante="contorno"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Tirar Outra
                  </Button>
                )}
              </div>

              <div className="mt-4 max-w-sm text-center text-xs text-gray-500">
                <p>
                  Dicas: boa iluminação, olhar para a câmera e evitar óculos
                  escuros ou bonés.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alunos cadastrados</CardTitle>
          <CardDescription>
            Exclua por aqui para remover também o cadastro facial da API.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {carregandoAlunos ? (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Carregando alunos...
            </div>
          ) : alunos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
              Nenhum aluno cadastrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Aluno</th>
                    <th className="px-4 py-3">Matrícula</th>
                    <th className="px-4 py-3">Turma</th>
                    <th className="px-4 py-3">Perfil</th>
                    <th className="px-4 py-3">Face ID</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {alunos.map((aluno) => {
                    const excluindo = excluindoAlunoId === aluno.id;

                    return (
                      <tr
                        key={aluno.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {aluno.nome}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {aluno.matricula}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {aluno.turma}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {aluno.perfil}
                        </td>
                        <td className="max-w-[180px] truncate px-4 py-3 text-xs text-gray-500">
                          {aluno.faceId || "-"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variante="destrutivo"
                            tamanho="pequeno"
                            disabled={excluindo}
                            onClick={() => removerAluno(aluno)}
                          >
                            {excluindo ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Excluir
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}