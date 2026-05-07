import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Webcam from 'react-webcam';
import { AlertCircle, CheckCircle2, ScanFace, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { validarReconhecimento } from '@/services/reconhecimentoService';

const LARGURA_CAPTURA = 416;
const ALTURA_CAPTURA = 312;

const INTERVALO_RECONHECIMENTO_MS = 500;
const COOLDOWN_LOG_MESMA_PESSOA_MS = 30000;

interface RegistroTela {
  id: string;
  nome: string;
  matricula?: string;
  status: 'sucesso' | 'erro';
  acao: string;
  confianca: number;
  horario: string;
  bbox?: number[];
}

export default function Recognition() {
  const webcamRef = useRef<Webcam>(null);
  const areaCameraRef = useRef<HTMLDivElement>(null);
  const processandoRef = useRef(false);
  const ultimoLogPorPessoaRef = useRef<Record<string, number>>({});

  const [escaneando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [rostosReconhecidos, setRostosReconhecidos] = useState<RegistroTela[]>([]);
  const [ultimoReconhecimento, setUltimoReconhecimento] = useState<RegistroTela | null>(null);
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

        const resposta = await validarReconhecimento(imagem);

        if (resposta.total_faces === 0 || !resposta.registros?.length) {
          setRostosReconhecidos([]);
          setUltimoReconhecimento(null);
          return;
        }

        const novosRostos: RegistroTela[] = resposta.registros.map((registro) => {
          const reconhecimento = registro.reconhecimento;

          const reconhecimentoValido = registro.acao === 'reconhecido';

          const nomeReconhecido =
            registro.aluno?.nome ||
            reconhecimento?.name ||
            'Desconhecido';

          return {
            id: crypto.randomUUID(),
            nome: nomeReconhecido,
            matricula:
              registro.aluno?.matricula ||
              reconhecimento?.registration ||
              undefined,
            status: reconhecimentoValido ? 'sucesso' : 'erro',
            acao: registro.acao || 'desconhecido',
            confianca: reconhecimento?.confidence || 0,
            horario: new Date().toLocaleTimeString('pt-BR'),
            bbox: reconhecimento?.bbox,
          };
        });

        setRostosReconhecidos(novosRostos);

        const rostoPrincipal =
          novosRostos.find((rosto) => rosto.status === 'sucesso') || novosRostos[0];

        setUltimoReconhecimento(rostoPrincipal || null);

        registrarLogsComCooldown(novosRostos);
      } catch (error) {
        toast.error('Erro no reconhecimento.', {
          description: error instanceof Error ? error.message : 'Erro inesperado.',
        });
      } finally {
        processandoRef.current = false;
        setProcessando(false);
      }
    }, INTERVALO_RECONHECIMENTO_MS);

    return () => clearInterval(intervalo);
  }, [escaneando]);

  function registrarLogsComCooldown(novosRostos: RegistroTela[]) {
    const agora = Date.now();
    const novosLogs: RegistroTela[] = [];

    for (const rosto of novosRostos) {
      const chavePessoa = rosto.matricula || rosto.nome || 'desconhecido';

      const ultimoLog = ultimoLogPorPessoaRef.current[chavePessoa] || 0;
      const dentroDoCooldown = agora - ultimoLog < COOLDOWN_LOG_MESMA_PESSOA_MS;

      if (dentroDoCooldown) continue;

      ultimoLogPorPessoaRef.current[chavePessoa] = agora;
      novosLogs.push(rosto);

      if (rosto.status === 'sucesso') {
        toast.success(`Reconhecido: ${rosto.nome}`, {
          description: `Ação: ${formatarAcao(rosto.acao)} • Confiança: ${rosto.confianca.toFixed(2)}`,
        });
      } else {
        toast.error(
          rosto.nome === 'Desconhecido' ? 'Rosto desconhecido' : 'Aluno não encontrado',
          {
            description: `${formatarAcao(rosto.acao)} • Confiança: ${rosto.confianca.toFixed(2)}`,
          },
        );
      }
    }

    if (novosLogs.length > 0) {
      setRegistros((registrosAtuais) => [...novosLogs, ...registrosAtuais].slice(0, 20));
    }
  }

  function formatarAcao(acao: string) {
    if (acao === 'reconhecido') return 'Aluno reconhecido';
    if (acao === 'entrada') return 'Entrada registrada';
    if (acao === 'saida') return 'Saída registrada';
    if (acao === 'ja_finalizada') return 'Presença já finalizada';
    if (acao === 'aluno_nao_encontrado') return 'Aluno não encontrado';
    if (acao === 'desconhecido') return 'Desconhecido';

    return acao;
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
          <p className="text-gray-500">Monitoramento por câmera integrado ao backend.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                processando ? 'bg-yellow-400' : 'bg-green-400'
              }`}
            />
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${
                processando ? 'bg-yellow-500' : 'bg-green-500'
              }`}
            />
          </span>

          <span className="text-sm font-medium text-gray-700">
            {processando ? 'Processando...' : 'Câmera ativa'}
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
                facingMode: 'user',
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
                    rosto.status === 'sucesso' ? 'border-green-500' : 'border-red-500'
                  }`}
                  style={estiloCaixaRosto}
                >
                  <div className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-yellow-400" />
                  <div className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-yellow-400" />
                  <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-yellow-400" />
                  <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-yellow-400" />

                  <div
                    className={`absolute -top-8 left-0 whitespace-nowrap rounded px-2 py-1 text-xs font-bold text-white ${
                      rosto.status === 'sucesso' ? 'bg-green-600' : 'bg-red-600'
                    }`}
                  >
                    {rosto.nome} ({rosto.confianca.toFixed(2)})
                  </div>
                </div>
              );
            })}

            {ultimoReconhecimento && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div
                  className={`flex items-center gap-4 rounded-xl border p-4 text-white backdrop-blur-md ${
                    ultimoReconhecimento.status === 'sucesso'
                      ? 'border-green-500/50 bg-green-900/40'
                      : 'border-red-500/50 bg-red-900/40'
                  }`}
                >
                  {ultimoReconhecimento.status === 'sucesso' ? (
                    <CheckCircle2 className="h-8 w-8 text-green-400" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-400" />
                  )}

                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{ultimoReconhecimento.nome}</h3>
                    <p className="text-sm opacity-90">
                      {formatarAcao(ultimoReconhecimento.acao)} • Confiança:{' '}
                      {ultimoReconhecimento.confianca.toFixed(2)}
                    </p>
                  </div>

                  <div className="text-right text-xs opacity-70">
                    {ultimoReconhecimento.horario}
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
              Log de Acessos
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
                {registros.map((registro) => (
                  <div
                    key={registro.id}
                    className="flex items-start gap-3 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div
                      className={`mt-0.5 rounded-full p-1.5 ${
                        registro.status === 'sucesso'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {registro.status === 'sucesso' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
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
                        {formatarAcao(registro.acao)} • Confiança:{' '}
                        {registro.confianca.toFixed(2)}
                      </p>

                      {registro.matricula && (
                        <p className="mt-0.5 text-[10px] text-gray-400">
                          Matrícula: {registro.matricula}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}