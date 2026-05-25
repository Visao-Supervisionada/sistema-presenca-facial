import { useEffect, useRef, useState } from 'react';
import { Download, Loader2, Printer, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listarDiarioMensal, type PresencaMensalAluno } from '@/services/diarioService';
import { listarTurmasDisponiveis } from '@/services/turmasService';
import { listarComponentes, type ComponenteCurricular } from '@/services/componentesService';

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

const SELECT_CLASS =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500';

interface CardRelatorioProps {
  titulo: string;
  descricao: string;
  ativo?: boolean;
  onGerar?: () => void;
}

function CardRelatorio({ titulo, descricao, ativo, onGerar }: CardRelatorioProps) {
  return (
    <div className={`flex items-center justify-between rounded-lg border p-4 ${ativo ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'}`}>
      <div>
        <p className={`font-medium ${ativo ? 'text-gray-900' : 'text-gray-400'}`}>{titulo}</p>
        <p className={`text-sm ${ativo ? 'text-gray-500' : 'text-gray-300'}`}>{descricao}</p>
      </div>
      {ativo ? (
        <Button tamanho="pequeno" onClick={onGerar}>Gerar</Button>
      ) : (
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-400">Em breve</span>
      )}
    </div>
  );
}

function diasLetivos(mes: number, ano: number): string[] {
  const dias: string[] = [];
  const ultimoDia = new Date(ano, mes, 0).getDate();
  for (let d = 1; d <= ultimoDia; d++) {
    const ds = `${ano}-${String(mes).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const diaSemana = new Date(`${ds}T00:00:00`).getDay();
    if (diaSemana !== 0 && diaSemana !== 6) dias.push(ds);
  }
  return dias;
}

function calcularTotaisAluno(aluno: PresencaMensalAluno) {
  const valores = Object.values(aluno.dias);
  const presentes = valores.filter((d) => d.status === 'presente').length;
  const atrasados = valores.filter((d) => d.status === 'atrasado').length;
  const faltas = valores.filter((d) => d.status === 'falta').length;
  const justificados = valores.filter((d) => d.status === 'justificado').length;
  const totalDias = presentes + atrasados + faltas + justificados;
  const frequencia = totalDias > 0 ? Math.round(((presentes + atrasados) / totalDias) * 100) : 0;
  return { presentes, atrasados, faltas, justificados, totalDias, frequencia };
}

const STATUS_SIGLA: Record<string, string> = {
  presente: 'P', atrasado: 'A', falta: 'F', justificado: 'J', pendente: '-',
};

const STATUS_COR_PRINT: Record<string, string> = {
  presente: '#16a34a',
  atrasado: '#f97316',
  falta: '#dc2626',
  justificado: '#ca8a04',
  pendente: '#d1d5db',
};

interface RelatorioFrequenciaProps {
  alunos: PresencaMensalAluno[];
  turmaId: string;
  componente: string;
  mes: number;
  ano: number;
}

function RelatorioFrequencia({ alunos, turmaId, componente, mes, ano }: RelatorioFrequenciaProps) {
  const dias = diasLetivos(mes, ano);
  const dataGeracao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const totaisTurma = alunos.map(calcularTotaisAluno);
  const mediaFrequencia = totaisTurma.length > 0
    ? Math.round(totaisTurma.reduce((acc, t) => acc + t.frequencia, 0) / totaisTurma.length)
    : 0;
  const totalFaltas = totaisTurma.reduce((acc, t) => acc + t.faltas, 0);
  const totalPresencas = totaisTurma.reduce((acc, t) => acc + t.presentes + t.atrasados, 0);

  return (
    <div className="print-area font-sans text-sm text-gray-900">
      {/* Cabeçalho */}
      <div className="mb-6 border-b border-gray-300 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Relatório de Frequência</h1>
            <p className="mt-0.5 text-sm text-gray-600">
              Turma: <strong>{turmaId}</strong>
              {componente ? <> · Componente: <strong>{componente}</strong></> : ''}
              {' '}· <strong>{MESES[mes - 1]} de {ano}</strong>
            </p>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p>Gerado em {dataGeracao}</p>
            <p>{alunos.length} aluno(s)</p>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center">
            <p className="text-xs text-gray-500">Alunos</p>
            <p className="text-2xl font-bold text-gray-800">{alunos.length}</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-center">
            <p className="text-xs text-green-600">Presenças</p>
            <p className="text-2xl font-bold text-green-700">{totalPresencas}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center">
            <p className="text-xs text-red-600">Faltas</p>
            <p className="text-2xl font-bold text-red-700">{totalFaltas}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-center">
            <p className="text-xs text-blue-600">Freq. Média</p>
            <p className="text-2xl font-bold text-blue-700">{mediaFrequencia}%</p>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Aluno</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold">Matrícula</th>
              {dias.map((d) => (
                <th key={d} className="border border-gray-300 px-1 py-2 text-center font-semibold">
                  {d.slice(8, 10)}
                </th>
              ))}
              <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-green-700">P</th>
              <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-orange-500">A</th>
              <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-red-600">F</th>
              <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-yellow-600">J</th>
              <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-blue-700">%</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((aluno, idx) => {
              const { presentes, atrasados, faltas, justificados, frequencia } = calcularTotaisAluno(aluno);
              return (
                <tr key={aluno.alunoId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-200 px-3 py-1.5 font-medium">{aluno.nome}</td>
                  <td className="border border-gray-200 px-2 py-1.5 text-gray-500">{aluno.matricula}</td>
                  {dias.map((d) => {
                    const status = aluno.dias[d]?.status ?? 'pendente';
                    return (
                      <td
                        key={d}
                        className="border border-gray-200 px-1 py-1.5 text-center font-bold"
                        style={{ color: STATUS_COR_PRINT[status] }}
                      >
                        {STATUS_SIGLA[status]}
                      </td>
                    );
                  })}
                  <td className="border border-gray-200 px-2 py-1.5 text-center font-bold text-green-700">{presentes}</td>
                  <td className="border border-gray-200 px-2 py-1.5 text-center font-bold text-orange-500">{atrasados}</td>
                  <td className="border border-gray-200 px-2 py-1.5 text-center font-bold text-red-600">{faltas}</td>
                  <td className="border border-gray-200 px-2 py-1.5 text-center font-bold text-yellow-600">{justificados}</td>
                  <td className={`border border-gray-200 px-2 py-1.5 text-center font-bold ${frequencia >= 75 ? 'text-green-700' : 'text-red-600'}`}>
                    {frequencia}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legenda */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
        <span><strong style={{ color: STATUS_COR_PRINT.presente }}>P</strong> = Presente</span>
        <span><strong style={{ color: STATUS_COR_PRINT.atrasado }}>A</strong> = Atrasado</span>
        <span><strong style={{ color: STATUS_COR_PRINT.falta }}>F</strong> = Falta</span>
        <span><strong style={{ color: STATUS_COR_PRINT.justificado }}>J</strong> = Justificado</span>
        <span><strong>-</strong> = Pendente</span>
        <span className="ml-auto">Frequência mínima: 75% · <span className="text-green-700 font-semibold">Verde ≥ 75%</span> · <span className="text-red-600 font-semibold">Vermelho &lt; 75%</span></span>
      </div>
    </div>
  );
}

function exportarCSV(
  alunos: PresencaMensalAluno[],
  turmaId: string,
  componente: string,
  mes: number,
  ano: number,
) {
  const dias = diasLetivos(mes, ano);
  const nomeMes = MESES[mes - 1];

  const cabecalho = [
    'Nome',
    'Matrícula',
    'Turma',
    ...(componente ? [`Componente`] : []),
    ...dias.map((d) => d.slice(8, 10) + '/' + String(mes).padStart(2, '0')),
    'Presenças',
    'Atrasados',
    'Faltas',
    'Justificados',
    'Total Dias',
    'Frequência (%)',
  ];

  const linhas = alunos.map((aluno) => {
    const { presentes, atrasados, faltas, justificados, totalDias, frequencia } = calcularTotaisAluno(aluno);
    return [
      aluno.nome,
      aluno.matricula,
      turmaId,
      ...(componente ? [componente] : []),
      ...dias.map((d) => STATUS_SIGLA[aluno.dias[d]?.status ?? 'pendente']),
      presentes,
      atrasados,
      faltas,
      justificados,
      totalDias,
      `${frequencia}%`,
    ];
  });

  const conteudo = [cabecalho, ...linhas]
    .map((linha) => linha.map((cel) => `"${String(cel).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const bom = '﻿';
  const blob = new Blob([bom + conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `frequencia_${turmaId}_${nomeMes}_${ano}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [modalAberto, setModalAberto] = useState(false);
  const [turmas, setTurmas] = useState<string[]>([]);
  const [componentes, setComponentes] = useState<ComponenteCurricular[]>([]);

  const [turma, setTurma] = useState('');
  const [componente, setComponente] = useState('');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());

  const [gerando, setGerando] = useState(false);
  const [alunos, setAlunos] = useState<PresencaMensalAluno[] | null>(null);
  const relRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listarTurmasDisponiveis().then(setTurmas).catch(() => setTurmas([]));
  }, []);

  useEffect(() => {
    if (!turma) { setComponentes([]); setComponente(''); return; }
    listarComponentes(turma).then(setComponentes).catch(() => setComponentes([]));
  }, [turma]);

  async function gerarRelatorio() {
    if (!turma) { toast.error('Selecione uma turma.'); return; }
    try {
      setGerando(true);
      const resultado = await listarDiarioMensal({ turmaId: turma, mes, ano, componente: componente || undefined });
      setAlunos(resultado.alunos);
    } catch (error) {
      toast.error('Erro ao gerar relatório.', { description: error instanceof Error ? error.message : '' });
    } finally {
      setGerando(false);
    }
  }

  function imprimir() {
    window.print();
  }

  function baixarCSV() {
    if (!alunos) return;
    exportarCSV(alunos, turma, componente, mes, ano);
  }

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: fixed; top: 0; left: 0; width: 100%; padding: 24px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="space-y-6 no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Relatórios</h1>
          <p className="text-gray-500">Gere relatórios acadêmicos e administrativos.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Relatórios Acadêmicos</CardTitle>
            <CardDescription>Frequência, desempenho e registros pedagógicos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <CardRelatorio titulo="Relatório de Notas por Turma" descricao="Notas consolidadas por bimestre e componente." />
            <CardRelatorio
              titulo="Relatório de Frequência"
              descricao="Presença mensal dos alunos por turma e componente. Exportação em CSV."
              ativo
              onGerar={() => { setAlunos(null); setModalAberto(true); }}
            />
            <CardRelatorio titulo="Relatório de Desempenho" descricao="Análise comparativa de rendimento." />
            <CardRelatorio titulo="Controle de Reunião" descricao="Atas e registros de reuniões." />
            <CardRelatorio titulo="Ata Final" descricao="Ata final de resultados do ano letivo." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relatórios Administrativos</CardTitle>
            <CardDescription>Matrículas, lotação e informações gerais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <CardRelatorio titulo="Relatório de Matrículas" descricao="Situação das matrículas por turma." />
            <CardRelatorio titulo="Relatório de Lotação" descricao="Capacidade e ocupação das turmas." />
            <CardRelatorio titulo="Relatório do PSE" descricao="Programa Saúde na Escola." />
            <CardRelatorio titulo="Relatório de Contato" descricao="Contatos de responsáveis e alunos." />
          </CardContent>
        </Card>
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 no-print">
          <div className="relative my-8 w-full max-w-5xl rounded-xl bg-white shadow-xl">
            {/* Header do modal */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Relatório de Frequência</h2>
                <p className="text-sm text-gray-500">Dados extraídos do Diário Digital.</p>
              </div>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filtros */}
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Turma</label>
                  <select className={SELECT_CLASS} value={turma} onChange={(e) => { setTurma(e.target.value); setAlunos(null); }}>
                    <option value="">Selecione</option>
                    {turmas.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Componente</label>
                  <select className={SELECT_CLASS} value={componente} onChange={(e) => { setComponente(e.target.value); setAlunos(null); }} disabled={!turma}>
                    <option value="">Todos</option>
                    {componentes.map((c) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Mês</label>
                  <select className={SELECT_CLASS} value={mes} onChange={(e) => { setMes(Number(e.target.value)); setAlunos(null); }}>
                    {MESES.map((n, i) => <option key={i} value={i + 1}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Ano</label>
                  <input
                    type="number"
                    className={SELECT_CLASS}
                    value={ano}
                    min={2020}
                    max={2099}
                    onChange={(e) => { setAno(Number(e.target.value)); setAlunos(null); }}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Button
                  onClick={gerarRelatorio}
                  disabled={gerando || !turma}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {gerando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {gerando ? 'Gerando...' : 'Gerar Relatório'}
                </Button>

                {alunos && (
                  <>
                    <Button variante="contorno" tamanho="pequeno" onClick={imprimir}>
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir
                    </Button>
                    <Button variante="contorno" tamanho="pequeno" onClick={baixarCSV}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar CSV
                    </Button>
                    <span className="ml-2 text-sm text-gray-500">{alunos.length} aluno(s)</span>
                  </>
                )}
              </div>
            </div>

            {/* Conteúdo do relatório */}
            <div className="px-6 py-4">
              {!alunos && !gerando && (
                <div className="py-12 text-center text-sm text-gray-400">
                  Selecione os filtros e clique em Gerar Relatório.
                </div>
              )}

              {gerando && (
                <div className="flex items-center justify-center py-12 text-gray-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Carregando dados do diário...
                </div>
              )}

              {alunos && !gerando && (
                <div ref={relRef}>
                  <RelatorioFrequencia
                    alunos={alunos}
                    turmaId={turma}
                    componente={componente}
                    mes={mes}
                    ano={ano}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
