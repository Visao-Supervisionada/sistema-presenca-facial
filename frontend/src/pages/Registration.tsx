import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Camera, CheckCircle2, Loader2, RotateCcw, Save, Trash2, Upload, User, X } from "lucide-react";
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

const TOTAL_FOTOS = 5;

const INSTRUCOES_FOTOS = [
  { titulo: "Foto 1 — Posição frontal", descricao: "Olhe diretamente para a câmera" },
  { titulo: "Foto 2 — Levemente para a esquerda", descricao: "Vire o rosto levemente para a esquerda" },
  { titulo: "Foto 3 — Levemente para a direita", descricao: "Vire o rosto levemente para a direita" },
  { titulo: "Foto 4 — Inclinado para baixo", descricao: "Incline levemente a cabeça para baixo" },
  { titulo: "Foto 5 — Inclinado para cima", descricao: "Incline levemente a cabeça para cima" },
];

type Modo = "captura" | "upload";

function lerArquivoComoBase64(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(arquivo);
  });
}

export default function Registration() {
  const [modo, setModo] = useState<Modo>("captura");
  const [imagensCapturadas, setImagensCapturadas] = useState<(string | null)[]>(
    Array(TOTAL_FOTOS).fill(null)
  );
  const [fotoAtual, setFotoAtual] = useState(0);
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
  const inputUploadRef = useRef<HTMLInputElement>(null);
  const inputSlotRef = useRef<HTMLInputElement>(null);
  const slotParaSubstituir = useRef<number | null>(null);

  const todasCapturadas = imagensCapturadas.every((img) => img !== null);
  const proximaFotoVazia = imagensCapturadas.findIndex((img) => img === null);
  const totalCapturadas = imagensCapturadas.filter((img) => img !== null).length;

  useEffect(() => { carregarAlunos(); }, []);

  async function carregarAlunos() {
    try {
      setCarregandoAlunos(true);
      const resultado = await listarAlunos();
      setAlunos(resultado.alunos);
    } catch (error) {
      toast.error("Erro ao carregar alunos.", {
        description: error instanceof Error ? error.message : "Erro inesperado.",
      });
    } finally {
      setCarregandoAlunos(false);
    }
  }

  function trocarModo(novoModo: Modo) {
    setModo(novoModo);
    reiniciarFotos();
  }

  // ── Captura (webcam) ──────────────────────────────────────────────────────

  const capturarImagem = useCallback(() => {
    const imagem = webcamRef.current?.getScreenshot();
    if (!imagem) { toast.error("Não foi possível capturar a imagem."); return; }

    setImagensCapturadas((prev) => {
      const novas = [...prev];
      novas[fotoAtual] = imagem;
      return novas;
    });

    const proxima = fotoAtual + 1;
    if (proxima < TOTAL_FOTOS) {
      setFotoAtual(proxima);
    } else {
      setCapturando(false);
    }
  }, [fotoAtual]);

  function iniciarCaptura() {
    const primeiraVazia = imagensCapturadas.findIndex((img) => img === null);
    setFotoAtual(primeiraVazia === -1 ? 0 : primeiraVazia);
    setCapturando(true);
  }

  function refazerFotoCaptura(indice: number) {
    setFotoAtual(indice);
    setCapturando(true);
  }

  function cancelarCaptura() { setCapturando(false); }

  // ── Upload ────────────────────────────────────────────────────────────────

  async function processarArquivos(arquivos: FileList | null, slotInicial = 0) {
    if (!arquivos || arquivos.length === 0) return;

    const lista = Array.from(arquivos).slice(0, TOTAL_FOTOS - slotInicial);
    const bases64 = await Promise.all(lista.map(lerArquivoComoBase64));

    setImagensCapturadas((prev) => {
      const novas = [...prev];
      bases64.forEach((b64, i) => { novas[slotInicial + i] = b64; });
      return novas;
    });
  }

  function abrirUploadGeral() {
    inputUploadRef.current?.click();
  }

  function substituirSlot(indice: number) {
    slotParaSubstituir.current = indice;
    inputSlotRef.current?.click();
  }

  async function onUploadGeral(e: React.ChangeEvent<HTMLInputElement>) {
    await processarArquivos(e.target.files, 0);
    e.target.value = "";
  }

  async function onUploadSlot(e: React.ChangeEvent<HTMLInputElement>) {
    const slot = slotParaSubstituir.current;
    if (slot === null) return;
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    const b64 = await lerArquivoComoBase64(arquivo);
    setImagensCapturadas((prev) => {
      const novas = [...prev];
      novas[slot] = b64;
      return novas;
    });
    slotParaSubstituir.current = null;
    e.target.value = "";
  }

  function removerFotoSlot(indice: number) {
    setImagensCapturadas((prev) => {
      const novas = [...prev];
      novas[indice] = null;
      return novas;
    });
  }

  // ── Geral ─────────────────────────────────────────────────────────────────

  function reiniciarFotos() {
    setImagensCapturadas(Array(TOTAL_FOTOS).fill(null));
    setFotoAtual(0);
    setCapturando(false);
  }

  async function salvarCadastro(evento: React.FormEvent) {
    evento.preventDefault();

    if (!todasCapturadas) {
      toast.error(`Adicione as ${TOTAL_FOTOS} fotos antes de salvar.`);
      return;
    }

    try {
      setSalvando(true);

      const resultado = await cadastrarAluno({
        nome: dadosFormulario.nome.trim(),
        matricula: dadosFormulario.matricula.trim(),
        turma: dadosFormulario.turma.trim(),
        perfil: dadosFormulario.perfil,
        imagensBase64: imagensCapturadas as string[],
      });

      toast.success("Aluno cadastrado com sucesso.", {
        description: `${resultado.aluno?.nome || dadosFormulario.nome} — ${resultado.totalFotosRegistradas ?? TOTAL_FOTOS} fotos registradas`,
      });

      setDadosFormulario({ nome: "", perfil: "aluno", turma: "", matricula: "" });
      reiniciarFotos();
      await carregarAlunos();
    } catch (error) {
      toast.error("Erro ao cadastrar aluno.", {
        description: error instanceof Error ? error.message : "Erro inesperado.",
      });
    } finally {
      setSalvando(false);
    }
  }

  async function removerAluno(aluno: Aluno) {
    const confirmou = window.confirm(
      `Deseja excluir ${aluno.nome}? Isso também remove o cadastro facial da API.`
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
        description: error instanceof Error ? error.message : "Erro inesperado.",
      });
    } finally {
      setExcluindoAlunoId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Cadastro de Usuários</h1>
        <p className="text-gray-500">
          Cadastre alunos e registre a biometria facial com 5 fotos em posições diferentes.
        </p>
      </div>

      {/* inputs de arquivo ocultos */}
      <input
        ref={inputUploadRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onUploadGeral}
      />
      <input
        ref={inputSlotRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onUploadSlot}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Dados pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
            <CardDescription>Preencha as informações do aluno.</CardDescription>
          </CardHeader>

          <form onSubmit={salvarCadastro}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="nome">Nome completo</label>
                <Input
                  id="nome"
                  placeholder="Ex: João da Silva"
                  value={dadosFormulario.nome}
                  onChange={(e) => setDadosFormulario({ ...dadosFormulario, nome: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="perfil">Perfil</label>
                  <select
                    id="perfil"
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={dadosFormulario.perfil}
                    onChange={(e) => setDadosFormulario({ ...dadosFormulario, perfil: e.target.value })}
                  >
                    <option value="aluno">Aluno</option>
                    <option value="professor">Professor</option>
                    <option value="funcionario">Funcionário</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="matricula">Matrícula</label>
                  <Input
                    id="matricula"
                    placeholder="Ex: 2026001"
                    value={dadosFormulario.matricula}
                    onChange={(e) => setDadosFormulario({ ...dadosFormulario, matricula: e.target.value })}
                    required
                  />
                </div>
              </div>

              {dadosFormulario.perfil === "aluno" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="turma">Turma</label>
                  <Input
                    id="turma"
                    placeholder="Ex: 3º Ano A"
                    value={dadosFormulario.turma}
                    onChange={(e) => setDadosFormulario({ ...dadosFormulario, turma: e.target.value })}
                    required
                  />
                </div>
              )}
            </CardContent>

            <CardFooter className="mt-6 border-t border-gray-100 bg-gray-50 py-4">
              <Button type="submit" className="w-full" disabled={!todasCapturadas || salvando}>
                {salvando ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" />
                    Salvar Cadastro{todasCapturadas ? "" : ` (${totalCapturadas}/${TOTAL_FOTOS} fotos)`}
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Biometria facial */}
        <Card>
          <CardHeader>
            <CardTitle>Biometria Facial</CardTitle>
            <CardDescription>
              {TOTAL_FOTOS} fotos em ângulos diferentes melhoram a precisão do reconhecimento.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Toggle modo */}
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => trocarModo("captura")}
                className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
                  modo === "captura"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Camera className="h-4 w-4" />
                Capturar pela câmera
              </button>
              <button
                type="button"
                onClick={() => trocarModo("upload")}
                className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
                  modo === "upload"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Upload className="h-4 w-4" />
                Fazer upload
              </button>
            </div>

            {/* ── Modo Captura ── */}
            {modo === "captura" && (
              <>
                <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-100">
                  {!capturando && (
                    <>
                      {totalCapturadas === 0 && (
                        <div className="p-6 text-center">
                          <User className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                          <p className="mb-4 text-sm text-gray-500">Nenhuma foto capturada ainda</p>
                          <Button type="button" onClick={iniciarCaptura} variante="contorno">
                            <Camera className="mr-2 h-4 w-4" />Iniciar Captura
                          </Button>
                        </div>
                      )}
                      {totalCapturadas > 0 && totalCapturadas < TOTAL_FOTOS && (
                        <div className="p-6 text-center">
                          <div className="mb-3 flex items-center justify-center gap-2 text-green-600">
                            <CheckCircle2 className="h-8 w-8" />
                            <span className="text-2xl font-bold">{totalCapturadas}/{TOTAL_FOTOS}</span>
                          </div>
                          <p className="mb-4 text-sm text-gray-500">Fotos capturadas. Continue para terminar.</p>
                          <Button type="button" onClick={iniciarCaptura} variante="contorno">
                            <Camera className="mr-2 h-4 w-4" />Continuar Captura
                          </Button>
                        </div>
                      )}
                      {todasCapturadas && (
                        <div className="p-6 text-center">
                          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-600" />
                          <p className="mb-1 text-sm font-semibold text-green-700">
                            Todas as {TOTAL_FOTOS} fotos capturadas!
                          </p>
                          <p className="mb-4 text-xs text-gray-500">
                            Preencha os dados e clique em Salvar Cadastro.
                          </p>
                          <Button type="button" onClick={reiniciarFotos} variante="contorno" className="text-xs">
                            <RotateCcw className="mr-2 h-3 w-3" />Refazer todas
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {capturando && (
                    <div className="relative h-full w-full">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        screenshotQuality={0.75}
                        videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
                        className="h-full w-full object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="h-64 w-48 rounded-[100%] border-2 border-green-500/60 shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-4 py-3 text-center text-white">
                        <p className="text-xs font-semibold uppercase tracking-wider text-green-400">
                          {INSTRUCOES_FOTOS[fotoAtual]?.titulo}
                        </p>
                        <p className="text-sm">{INSTRUCOES_FOTOS[fotoAtual]?.descricao}</p>
                      </div>
                    </div>
                  )}
                </div>

                {capturando && (
                  <div className="flex gap-3">
                    <Button type="button" onClick={capturarImagem} className="flex-1">
                      <Camera className="mr-2 h-4 w-4" />Capturar Foto {fotoAtual + 1}
                    </Button>
                    <Button type="button" onClick={cancelarCaptura} variante="contorno" tamanho="icone">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* ── Modo Upload ── */}
            {modo === "upload" && !todasCapturadas && (
              <div
                onClick={abrirUploadGeral}
                className="flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-green-400 hover:bg-green-50"
              >
                <Upload className="mb-3 h-12 w-12 text-gray-400" />
                <p className="mb-1 text-sm font-medium text-gray-700">
                  Clique para selecionar as fotos
                </p>
                <p className="text-xs text-gray-500">
                  Selecione até {TOTAL_FOTOS} imagens de uma vez (JPG, PNG, WEBP)
                </p>
                {totalCapturadas > 0 && (
                  <p className="mt-2 text-xs font-medium text-green-600">
                    {totalCapturadas} de {TOTAL_FOTOS} adicionadas
                  </p>
                )}
              </div>
            )}

            {modo === "upload" && todasCapturadas && (
              <div className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-xl border-2 border-green-300 bg-green-50">
                <CheckCircle2 className="mb-3 h-10 w-10 text-green-600" />
                <p className="mb-1 text-sm font-semibold text-green-700">
                  Todas as {TOTAL_FOTOS} fotos adicionadas!
                </p>
                <p className="mb-4 text-xs text-gray-500">
                  Preencha os dados e clique em Salvar Cadastro.
                </p>
                <Button type="button" onClick={reiniciarFotos} variante="contorno" className="text-xs">
                  <RotateCcw className="mr-2 h-3 w-3" />Limpar todas
                </Button>
              </div>
            )}

            {/* Grid de miniaturas (igual nos dois modos) */}
            <div className="grid grid-cols-5 gap-2">
              {imagensCapturadas.map((imagem, indice) => (
                <div key={indice} className="group relative aspect-square">
                  <div
                    className={`h-full w-full overflow-hidden rounded-lg border-2 ${
                      imagem
                        ? "border-green-500"
                        : indice === proximaFotoVazia && !todasCapturadas
                        ? "border-green-300 border-dashed"
                        : "border-gray-200 border-dashed"
                    } bg-gray-100`}
                  >
                    {imagem ? (
                      <img src={imagem} alt={`Foto ${indice + 1}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center">
                        <span className="text-xs font-medium text-gray-400">{indice + 1}</span>
                      </div>
                    )}
                  </div>

                  {imagem && (
                    <div className="absolute -right-1 -top-1 rounded-full bg-green-500 p-0.5">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                  )}

                  {/* Hover: substituir (captura) ou substituir/remover (upload) */}
                  {imagem && modo === "captura" && (
                    <button
                      type="button"
                      onClick={() => refazerFotoCaptura(indice)}
                      className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                      title={`Refazer foto ${indice + 1}`}
                    >
                      <RotateCcw className="h-4 w-4 text-white" />
                    </button>
                  )}

                  {imagem && modo === "upload" && (
                    <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => substituirSlot(indice)}
                        className="rounded p-1 hover:bg-white/20"
                        title="Substituir foto"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-white" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removerFotoSlot(indice)}
                        className="rounded p-1 hover:bg-white/20"
                        title="Remover foto"
                      >
                        <X className="h-3.5 w-3.5 text-white" />
                      </button>
                    </div>
                  )}

                  {/* Slot vazio no modo upload: clica para adicionar */}
                  {!imagem && modo === "upload" && (
                    <button
                      type="button"
                      onClick={() => substituirSlot(indice)}
                      className="absolute inset-0 flex items-center justify-center rounded-lg opacity-0 transition-opacity group-hover:opacity-100 group-hover:bg-green-100"
                      title={`Adicionar foto ${indice + 1}`}
                    >
                      <Upload className="h-4 w-4 text-green-600" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-gray-500">
              {modo === "captura"
                ? "Dicas: boa iluminação, olhar para a câmera e evitar óculos escuros ou bonés."
                : "Use fotos em ângulos diferentes: frontal, esquerda, direita, cima e baixo."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de alunos */}
      <Card>
        <CardHeader>
          <CardTitle>Alunos cadastrados</CardTitle>
          <CardDescription>Exclua por aqui para remover também o cadastro facial da API.</CardDescription>
        </CardHeader>

        <CardContent>
          {carregandoAlunos ? (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />Carregando alunos...
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
                      <tr key={aluno.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{aluno.nome}</td>
                        <td className="px-4 py-3 text-gray-600">{aluno.matricula}</td>
                        <td className="px-4 py-3 text-gray-600">{aluno.turma}</td>
                        <td className="px-4 py-3 text-gray-600">{aluno.perfil}</td>
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
                            {excluindo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
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
