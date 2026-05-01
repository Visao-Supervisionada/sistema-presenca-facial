import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Camera, Loader2, Save, User, X } from "lucide-react";
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
import { cadastrarAluno } from "@/services/alunosService";

export default function Registration() {
  const [imagemCapturada, setImagemCapturada] = useState<string | null>(null);
  const [capturando, setCapturando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [dadosFormulario, setDadosFormulario] = useState({
    nome: "",
    perfil: "aluno",
    turma: "",
    matricula: "",
  });

  const webcamRef = useRef<Webcam>(null);

  const capturarImagem = useCallback(() => {
    const imagem = webcamRef.current?.getScreenshot();

    if (imagem) {
      setImagemCapturada(imagem);
      setCapturando(false);
    }
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
    } catch (error) {
      toast.error("Erro ao cadastrar aluno.", {
        description:
          error instanceof Error ? error.message : "Erro inesperado.",
      });
    } finally {
      setSalvando(false);
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
                      videoConstraints={{ facingMode: "user" }}
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
    </div>
  );
}
