import { useEffect, useRef, useState, type CSSProperties } from "react";
import Webcam from "react-webcam";
import { AlertCircle, CheckCircle2, ScanFace, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  classificarReconhecimento,
  registrarPresencaPorReconhecimento,
} from "@/services/reconhecimentoService";

const LARGURA_CAPTURA = 320;
const ALTURA_CAPTURA = 240;

const INTERVALO_RECONHECIMENTO_MS = 350;
const COOLDOWN_LOG_MESMA_PESSOA_MS = 30000;
const COOLDOWN_REGISTRO_SUCESSO_MS = 60000;
const COOLDOWN_AVISO_MS = 8000;
const CONFIANCA_MINIMA_REGISTRO = 0.6;

interface RegistroTela {
  id: string;
  nome: string;
  matricula?: string;
  status: "sucesso" | "aviso" | "erro";
  acao: string;
  confianca: number;
  horario: string;
  bbox?: number[];
}

export default function Recognition() {
  const webcamRef = useRef<Webcam>(null);
  const areaCameraRef = useRef<HTMLDivElement>(null);

  const processandoRef = useRef(false);
  const registrandoPresencaRef = useRef(false);

  const ultimoLogPorPessoaRef = useRef<Record<string, number>>({});
  const ultimoRegistroSucessoRef = useRef<Record<string, number>>({});
  const ultimoAvisoPresencaRef = useRef<Record<string, number>>({});

  const [escaneando] = useState(true);
  const [processando, setProcessando] = useState(false);

  const [rostosReconhecidos, setRostosReconhecidos] = useState<RegistroTela[]>(
    [],
  );

  const [ultimoReconhecimento, setUltimoReconhecimento] =
    useState<RegistroTela | null>(null);

  const [registros, setRegistros] = useState<RegistroTela[]>([]);

  useEffect(() => {
    if (!escaneando) return;

    const intervalo = setInterval(async () => {
      if (processandoRef.current) return;

      const imagem = webcamRef.current?.getScreenshot();

      if (!imagem) return;

      try {
        processandoRef.current = true;
        setProcessando(true);

        const resposta = await classificarReconhecimento(imagem);

        if (resposta.total_faces === 0 || !resposta.results?.length) {
          setRostosReconhecidos([]);
          setUltimoReconhecimento(null);
          return;
        }

        const novosRostos: RegistroTela[] = resposta.results.map(
          (resultado) => {
            const reconhecimentoValido = resultado.matched;

            return {
              id: crypto.randomUUID(),
              nome: resultado.name || "Desconhecido",
              matricula: resultado.registration || undefined,
              status: reconhecimentoValido ? "sucesso" : "erro",
              acao: reconhecimentoValido ? "classificado" : "desconhecido",
              confianca: resultado.confidence || 0,
              horario: new Date().toLocaleTimeString("pt-BR"),
              bbox: resultado.bbox,
            };
          },
        );

        setRostosReconhecidos(novosRostos);

        const rostoPrincipal =
          novosRostos.find((rosto) => rosto.status === "sucesso") ||
          novosRostos[0];

        setUltimoReconhecimento(rostoPrincipal || null);

        registrarLogsComCooldown(novosRostos);

        void tentarRegistrarPresenca(imagem, novosRostos);
      } catch (error) {
        toast.error("Erro no reconhecimento.", {
          description:
            error instanceof Error ? error.message : "Erro inesperado.",
        });
      } finally {
        processandoRef.current = false;
        setProcessando(false);
      }
    }, INTERVALO_RECONHECIMENTO_MS);

    return () => clearInterval(intervalo);
  }, [escaneando]);

  async function tentarRegistrarPresenca(
    imagem: string,
    novosRostos: RegistroTela[],
  ) {
    if (registrandoPresencaRef.current) return;

    const rostoReconhecido = novosRostos.find(
      (rosto) =>
        rosto.status === "sucesso" &&
        rosto.matricula &&
        rosto.confianca >= CONFIANCA_MINIMA_REGISTRO,
    );

    if (!rostoReconhecido?.matricula) return;

    const matricula = rostoReconhecido.matricula;
    const agora = Date.now();

    const ultimoRegistroSucesso =
      ultimoRegistroSucessoRef.current[matricula] || 0;

    const dentroDoCooldownSucesso =
      agora - ultimoRegistroSucesso < COOLDOWN_REGISTRO_SUCESSO_MS;

    if (dentroDoCooldownSucesso) return;

    try {
      registrandoPresencaRef.current = true;

      const respostaPresenca = await registrarPresencaPorReconhecimento(imagem);

      console.log("Resposta do registro de presença:", respostaPresenca);

      const registro = respostaPresenca.registros?.find(
        (item) => item.reconhecimento.registration === matricula,
      );

      if (!registro) {
        mostrarAvisoComCooldown(
          matricula,
          "Nenhum registro de presença retornado pelo backend.",
        );
        return;
      }

      adicionarLogDePresenca(rostoReconhecido, registro.acao);

      if (registro.acao === "entrada") {
        ultimoRegistroSucessoRef.current[matricula] = Date.now();

        toast.success(`Entrada registrada: ${rostoReconhecido.nome}`, {
          description: "A frequência deve aparecer como presente ou atrasado.",
        });
        return;
      }

      if (registro.acao === "saida") {
        ultimoRegistroSucessoRef.current[matricula] = Date.now();

        toast.success(`Saída registrada: ${rostoReconhecido.nome}`);
        return;
      }

      if (registro.acao === "em_aula") {
        ultimoRegistroSucessoRef.current[matricula] = Date.now();

        toast.info(`${rostoReconhecido.nome} já está em aula.`);
        return;
      }

      if (registro.acao === "ja_finalizada") {
        ultimoRegistroSucessoRef.current[matricula] = Date.now();

        toast.info(`${rostoReconhecido.nome} já finalizou a presença.`);
        return;
      }

      if (registro.acao === "sem_horario") {
        mostrarAvisoComCooldown(
          matricula,
          `${rostoReconhecido.nome} está sem horário cadastrado para hoje.`,
        );
        return;
      }

      if (registro.acao === "fora_da_janela") {
        mostrarAvisoComCooldown(
          matricula,
          `${rostoReconhecido.nome} está fora da janela de horário.`,
        );
        return;
      }

      if (registro.acao === "aluno_nao_encontrado") {
        mostrarAvisoComCooldown(
          matricula,
          "Aluno reconhecido, mas não encontrado no cadastro.",
        );
        return;
      }

      if (registro.acao === "desconhecido") {
        mostrarAvisoComCooldown(matricula, "Rosto desconhecido.");
      }
    } catch (error) {
      console.error(error);

      mostrarAvisoComCooldown(
        matricula,
        error instanceof Error
          ? error.message
          : "Erro inesperado ao registrar presença.",
      );
    } finally {
      registrandoPresencaRef.current = false;
    }
  }

  function mostrarAvisoComCooldown(matricula: string, mensagem: string) {
    const agora = Date.now();
    const ultimoAviso = ultimoAvisoPresencaRef.current[matricula] || 0;

    if (agora - ultimoAviso < COOLDOWN_AVISO_MS) return;

    ultimoAvisoPresencaRef.current[matricula] = agora;

    toast.info("Registro de presença não realizado", {
      description: mensagem,
    });
  }

  function obterStatusPorAcao(acao: string): RegistroTela["status"] {
    if (
      acao === "entrada" ||
      acao === "saida" ||
      acao === "em_aula" ||
      acao === "ja_finalizada" ||
      acao === "classificado"
    ) {
      return "sucesso";
    }

    if (acao === "sem_horario" || acao === "fora_da_janela") {
      return "aviso";
    }

    return "erro";
  }

  function adicionarRegistroAoLog(novoRegistro: RegistroTela) {
    setRegistros((registrosAtuais) => {
      const chaveNovoRegistro =
        `${novoRegistro.matricula || novoRegistro.nome}-${novoRegistro.acao}`;

      const registrosFiltrados = registrosAtuais.filter((registro) => {
        const chaveRegistro = `${registro.matricula || registro.nome}-${registro.acao}`;

        return chaveRegistro !== chaveNovoRegistro;
      });

      return [novoRegistro, ...registrosFiltrados].slice(0, 10);
    });

    setUltimoReconhecimento(novoRegistro);
  }

  function adicionarLogDePresenca(rosto: RegistroTela, acao: string) {
    const novoRegistro: RegistroTela = {
      ...rosto,
      id: crypto.randomUUID(),
      acao,
      horario: new Date().toLocaleTimeString("pt-BR"),
      status: obterStatusPorAcao(acao),
    };

    adicionarRegistroAoLog(novoRegistro);
  }

  function registrarLogsComCooldown(novosRostos: RegistroTela[]) {
    const agora = Date.now();

    for (const rosto of novosRostos) {
      const chavePessoa = rosto.matricula || rosto.nome || "desconhecido";
      const ultimoLog = ultimoLogPorPessoaRef.current[chavePessoa] || 0;

      const dentroDoCooldown =
        agora - ultimoLog < COOLDOWN_LOG_MESMA_PESSOA_MS;

      if (dentroDoCooldown) continue;

      ultimoLogPorPessoaRef.current[chavePessoa] = agora;

      adicionarRegistroAoLog(rosto);

      if (rosto.status === "sucesso") {
        toast.success(`Reconhecido: ${rosto.nome}`, {
          description: `Confiança: ${rosto.confianca.toFixed(2)}`,
        });
      } else {
        toast.error("Rosto desconhecido", {
          description: `Confiança: ${rosto.confianca.toFixed(2)}`,
        });
      }
    }
  }

  function formatarAcao(acao: string) {
    if (acao === "classificado") return "Classificado em tempo real";
    if (acao === "entrada") return "Entrada registrada";
    if (acao === "saida") return "Saída registrada";
    if (acao === "em_aula") return "Aluno já está em aula";
    if (acao === "ja_finalizada") return "Presença já finalizada";
    if (acao === "sem_horario") return "Sem horário cadastrado";
    if (acao === "fora_da_janela") return "Fora da janela de horário";
    if (acao === "aluno_nao_encontrado") return "Aluno não encontrado";
    if (acao === "desconhecido") return "Desconhecido";

    return acao;
  }

  function obterClassesStatus(status: RegistroTela["status"]) {
    if (status === "sucesso") {
      return {
        icone: "bg-green-100 text-green-600",
        caixa: "border-green-500/40 bg-green-950/60",
        texto: "text-green-300",
      };
    }

    if (status === "aviso") {
      return {
        icone: "bg-yellow-100 text-yellow-700",
        caixa: "border-yellow-400/40 bg-yellow-950/60",
        texto: "text-yellow-300",
      };
    }

    return {
      icone: "bg-red-100 text-red-600",
      caixa: "border-red-500/40 bg-red-950/60",
      texto: "text-red-300",
    };
  }

  function renderizarIconeStatus(status: RegistroTela["status"], tamanho = "h-4 w-4") {
    if (status === "sucesso") {
      return <CheckCircle2 className={tamanho} />;
    }

    if (status === "aviso") {
      return <AlertCircle className={tamanho} />;
    }

    return <XCircle className={tamanho} />;
  }

  function calcularEstiloCaixa(bbox?: number[]): CSSProperties | undefined {
    if (!bbox || bbox.length !== 4) return undefined;

    const areaCamera = areaCameraRef.current;

    if (!areaCamera) return undefined;

    const larguraTela = areaCamera.clientWidth;
    const alturaTela = areaCamera.clientHeight;

    if (!larguraTela || !alturaTela) return undefined;

    const [x1, y1, x2, y2] = bbox;

    const escalaX = larguraTela / LARGURA_CAPTURA;
    const escalaY = alturaTela / ALTURA_CAPTURA;

    return {
      left: `${x1 * escalaX}px`,
      top: `${y1 * escalaY}px`,
      width: `${(x2 - x1) * escalaX}px`,
      height: `${(y2 - y1) * escalaY}px`,
    };
  }

  return (
    <div className="flex h-full flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Reconhecimento em Tempo Real
          </h1>

          <p className="text-gray-500">
            Monitoramento por câmera integrado ao backend.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                processando ? "bg-yellow-400" : "bg-green-400"
              }`}
            />

            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${
                processando ? "bg-yellow-500" : "bg-green-500"
              }`}
            />
          </span>

          <span className="text-sm font-medium text-gray-700">
            {processando ? "Processando..." : "Câmera ativa"}
          </span>
        </div>
      </div>

      <div className="grid flex-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col overflow-hidden lg:col-span-2">
          <CardContent
            ref={areaCameraRef}
            className="relative aspect-[4/3] w-full overflow-hidden bg-black p-0"
          >
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.55}
              minScreenshotWidth={LARGURA_CAPTURA}
              minScreenshotHeight={ALTURA_CAPTURA}
              videoConstraints={{
                width: LARGURA_CAPTURA,
                height: ALTURA_CAPTURA,
                facingMode: "user",
              }}
              className="h-full w-full object-cover"
            />

            {rostosReconhecidos.map((rosto) => {
              const estiloCaixaRosto = calcularEstiloCaixa(rosto.bbox);

              if (!estiloCaixaRosto) return null;

              return (
                <div
                  key={rosto.id}
                  className={`pointer-events-none absolute border-2 ${
                    rosto.status === "sucesso"
                      ? "border-green-500"
                      : "border-red-500"
                  }`}
                  style={estiloCaixaRosto}
                >
                  <div className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-yellow-400" />

                  <div className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-yellow-400" />

                  <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-yellow-400" />

                  <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-yellow-400" />

                  <div
                    className={`absolute -top-8 left-0 whitespace-nowrap rounded px-2 py-1 text-xs font-bold text-white ${
                      rosto.status === "sucesso"
                        ? "bg-green-600"
                        : "bg-red-600"
                    }`}
                  >
                    {rosto.nome} ({rosto.confianca.toFixed(2)})
                  </div>
                </div>
              );
            })}

            {ultimoReconhecimento && (
              <div
                className={`absolute left-4 top-4 max-w-sm rounded-xl border px-4 py-3 text-white shadow-lg backdrop-blur-md ${
                  obterClassesStatus(ultimoReconhecimento.status).caixa
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={obterClassesStatus(ultimoReconhecimento.status).texto}>
                    {renderizarIconeStatus(ultimoReconhecimento.status, "h-5 w-5")}
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      {ultimoReconhecimento.nome}
                    </p>

                    <p className="text-xs text-white/80">
                      {formatarAcao(ultimoReconhecimento.acao)} • Confiança:{" "}
                      {ultimoReconhecimento.confianca.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex max-h-[600px] flex-col">
          <CardHeader className="border-b pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ScanFace className="h-5 w-5" />
              Eventos de Presença
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-0">
            {registros.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <AlertCircle className="mx-auto mb-2 h-8 w-8 opacity-50" />

                <p>Aguardando reconhecimentos...</p>
              </div>
            ) : (
              <div className="divide-y">
                {registros.map((registro) => {
                  const classes = obterClassesStatus(registro.status);

                  return (
                    <div
                      key={registro.id}
                      className="flex items-start gap-3 p-4 transition-colors hover:bg-gray-50"
                    >
                      <div className={`mt-0.5 rounded-full p-1.5 ${classes.icone}`}>
                        {renderizarIconeStatus(registro.status)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex items-center justify-between">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {registro.nome}
                          </p>

                          <span className="ml-2 whitespace-nowrap text-xs text-gray-500">
                            {registro.horario}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500">
                          {formatarAcao(registro.acao)} • Confiança:{" "}
                          {registro.confianca.toFixed(2)}
                        </p>

                        {registro.matricula && (
                          <p className="mt-0.5 text-[10px] text-gray-400">
                            Matrícula: {registro.matricula}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}