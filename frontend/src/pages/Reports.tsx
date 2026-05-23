import { useEffect, useRef, useState } from 'react';
import { Loader2, Printer, X } from 'lucide-react';
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

const STATUS_SIGLA: Record<string, string> = {
  presente: 'P', atrasado: 'A', falta: 'F', justificado: 'J', pendente: '-',
};
const STATUS_COR: Record<string, string> = {
  presente: 'text-green-700', atrasado: 'text-orange-500', falta: 'text-red-600', justificado: 'text-yellow-600', pendente: 'text-gray-300',
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
  return (
    <div className="print-area">
      <div className="mb-4">
        <h2 className="text-lg font-bold">Relatório de Frequência</h2>
        <p className="text-sm text-gray-600">Turma: {turmaId}{componente ? ` · ${componente}` : ''} — {MESES[mes - 1]} de {ano}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-1 text-left">Aluno</th>
              {dias.map((d) => (
                <th key={d} className="border border-gray-300 px-1 py-1 text-center">
                  {d.slice(8, 10)}
                </th>
              ))}
              <th className="border border-gray-300 px-2 py-1 text-center">P</th>
              <th className="border border-gray-300 px-2 py-1 text-center">F</th>
              <th className="border border-gray-300 px-2 py-1 text-center">%</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((aluno) => {
              const presentes = Object.values(aluno.dias).filter((d) => d.status === 'presente' || d.status === 'atrasado').length;
              const faltas = Object.values(aluno.dias).filter((d) => d.status === 'falta' || d.status === 'justificado').length;
              const total = presentes + faltas;
              const pct = total > 0 ? Math.round((presentes / total) * 100) : 0;
              return (
                <tr key={aluno.alunoId} className="even:bg-gray-50">
                  <td className="border border-gray-200 px-2 py-1 font-medium">{aluno.nome}</td>
                  {dias.map((d) => {
                    const status = aluno.dias[d]?.status ?? 'pendente';
                    return (
                      <td key={d} className={`border border-gray-200 px-1 py-1 text-center font-semibold ${STATUS_COR[status]}`}>
                        {STATUS_SIGLA[status]}
                      </td>
                    );
                  })}
                  <td className="border border-gray-200 px-2 py-1 text-center text-green-700 font-bold">{presentes}</td>
                  <td className="border border-gray-200 px-2 py-1 text-center text-red-600 font-bold">{faltas}</td>
                  <td className="border border-gray-200 px-2 py-1 text-center font-bold">{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-400">P = Presente/Atrasado · F = Falta/Justificado · - = Pendente</p>
    </div>
  );
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

  return (
    <>
      <style>{`@media print { body > *:not(.print-root) { display: none; } .print-root { display: block !important; } .no-print { display: none !important; } }`}</style>

      <div className="space-y-6 no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Relatórios</h1>
          <p className="text-gray-500">Gere relatórios acadêmicos e administrativos.</p>
        </div>

        {/* Acadêmicos */}
        <Card>
          <CardHeader>
            <CardTitle>Relatórios Acadêmicos</CardTitle>
            <CardDescription>Frequência, desempenho e registros pedagógicos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <CardRelatorio titulo="Relatório de Notas por Turma" descricao="Notas consolidadas por bimestre e componente." />
            <CardRelatorio
              titulo="Relatório de Frequência"
              descricao="Presença mensal dos alunos por turma e componente."
              ativo
              onGerar={() => { setAlunos(null); setModalAberto(true); }}
            />
            <CardRelatorio titulo="Relatório de Desempenho" descricao="Análise comparativa de rendimento." />
            <CardRelatorio titulo="Controle de Reunião" descricao="Atas e registros de reuniões." />
            <CardRelatorio titulo="Ata Final" descricao="Ata final de resultados do ano letivo." />
          </CardContent>
        </Card>

        {/* Administrativos */}
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

      {/* Modal de filtros */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 no-print">
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="absolute right-4 top-4 rounded-md p-1 text-gray-400 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900">Relatório de Frequência</h2>
            <p className="mt-1 text-sm text-gray-500">Selecione os filtros para gerar o relatório.</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Turma</label>
                <select className={SELECT_CLASS} value={turma} onChange={(e) => setTurma(e.target.value)}>
                  <option value="">Selecione uma turma</option>
                  {turmas.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Componente Curricular</label>
                <select className={SELECT_CLASS} value={componente} onChange={(e) => setComponente(e.target.value)} disabled={!turma}>
                  <option value="">Todos os componentes</option>
                  {componentes.map((c) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Mês</label>
                  <select className={SELECT_CLASS} value={mes} onChange={(e) => setMes(Number(e.target.value))}>
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
                    onChange={(e) => setAno(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <Button variante="contorno" onClick={() => setModalAberto(false)}>Cancelar</Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={gerarRelatorio}
                disabled={gerando || !turma}
              >
                {gerando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gerar Relatório
              </Button>
            </div>

            {/* Resultado inline */}
            {alunos && (
              <div className="mt-5 border-t border-gray-100 pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{alunos.length} aluno(s)</span>
                  <Button tamanho="pequeno" variante="contorno" onClick={imprimir}>
                    <Printer className="mr-2 h-4 w-4" /> Imprimir
                  </Button>
                </div>
                <div ref={relRef} className="print-root">
                  <RelatorioFrequencia alunos={alunos} turmaId={turma} componente={componente} mes={mes} ano={ano} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
