import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  criarObjeto,
  excluirObjeto,
  listarObjetos,
  type ObjetoConhecimento,
  type StatusObjeto,
} from '@/services/objetoService';

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

const STATUS_CONFIG: Record<StatusObjeto, { label: string; bg: string; text: string; dot: string }> = {
  letivo:        { label: 'Dia Letivo',      bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
  ministrado:    { label: 'Ministrado',      bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  nao_ministrado:{ label: 'Não Ministrado',  bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500' },
  evento:        { label: 'Evento',          bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400' },
};

function gerarCalendario(ano: number, mes: number) {
  const primeiroDia = new Date(ano, mes - 1, 1).getDay();
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const celulas: (number | null)[] = Array(primeiroDia).fill(null);
  for (let d = 1; d <= ultimoDia; d++) celulas.push(d);
  while (celulas.length % 7 !== 0) celulas.push(null);
  return celulas;
}

export default function ObjetosConhecimento() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const turmaId = params.get('turmaId') ?? '';
  const nomeTurma = params.get('nomeTurma') ?? turmaId;
  const componenteUrl = params.get('componente') ?? '';

  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  const [mes, setMes] = useState(mesAtual);
  const [ano] = useState(anoAtual);
  const [objetos, setObjetos] = useState<ObjetoConhecimento[]>([]);
  const [carregando, setCarregando] = useState(false);

  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);
  const [formConteudo, setFormConteudo] = useState('');
  const [formStatus, setFormStatus] = useState<StatusObjeto>('ministrado');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!turmaId) return;
    carregar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaId, mes, ano]);

  async function carregar() {
    try {
      setCarregando(true);
      const data = await listarObjetos({ turmaId, componente: componenteUrl || undefined, mes, ano });
      setObjetos(data);
    } catch {
      toast.error('Erro ao carregar objetos de conhecimento.');
    } finally {
      setCarregando(false);
    }
  }

  function dataStr(dia: number) {
    return `${ano}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
  }

  function objetosDoDia(dia: number) {
    return objetos.filter((o) => o.data === dataStr(dia));
  }

  function statusDoDia(dia: number): StatusObjeto | null {
    const list = objetosDoDia(dia);
    if (list.length === 0) return null;
    return list[list.length - 1].status;
  }

  async function handleSalvar() {
    if (!diaSelecionado || !formConteudo.trim()) return;
    try {
      setSalvando(true);
      await criarObjeto({
        turmaId,
        componente: componenteUrl || 'Geral',
        data: dataStr(diaSelecionado),
        conteudo: formConteudo.trim(),
        status: formStatus,
      });
      toast.success('Objeto registrado.');
      setFormConteudo('');
      setDiaSelecionado(null);
      await carregar();
    } catch (error) {
      toast.error('Erro ao salvar.', { description: error instanceof Error ? error.message : '' });
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(id: string) {
    try {
      await excluirObjeto(id);
      toast.success('Removido.');
      await carregar();
    } catch {
      toast.error('Erro ao remover.');
    }
  }

  const celulas = gerarCalendario(ano, mes);
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Objetos de Conhecimento</h1>
          <p className="text-sm text-gray-500">
            Dias letivos e conteúdos para {nomeTurma}{componenteUrl ? ` · ${componenteUrl}` : ''}
          </p>
        </div>
        <Button variante="contorno" tamanho="pequeno" onClick={() => navigate('/diario')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
        </Button>
      </div>

      {/* Legenda + seletor de mês */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3">
        <div className="flex flex-wrap gap-3">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className={`h-3 w-3 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          ))}
        </div>
        <select
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
        >
          {MESES.map((n, i) => <option key={i} value={i + 1}>{n} {ano}</option>)}
        </select>
      </div>

      {/* Calendário */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        {carregando ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando...
          </div>
        ) : (
          <>
            <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold text-gray-500">
              {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {celulas.map((dia, i) => {
                if (dia === null) return <div key={`empty-${i}`} />;
                const ds = dataStr(dia);
                const diaSemana = new Date(`${ds}T00:00:00`).getDay();
                const fimSemana = diaSemana === 0 || diaSemana === 6;
                const status = statusDoDia(dia);
                const cfg = status ? STATUS_CONFIG[status] : null;
                const isHoje = ds === hoje;
                return (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => { if (!fimSemana) { setDiaSelecionado(dia); setFormConteudo(''); setFormStatus('ministrado'); } }}
                    className={`rounded-lg p-2 text-center text-sm transition-all ${
                      fimSemana
                        ? 'cursor-default text-gray-300'
                        : cfg
                        ? `${cfg.bg} ${cfg.text} font-medium hover:opacity-80`
                        : 'hover:bg-gray-100 text-gray-700'
                    } ${isHoje ? 'ring-2 ring-green-400' : ''} ${diaSelecionado === dia ? 'ring-2 ring-blue-400' : ''}`}
                  >
                    <div className="font-semibold">{dia}</div>
                    {cfg && <div className="text-[10px] leading-tight">{cfg.label}</div>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Painel lateral quando dia selecionado */}
      {diaSelecionado && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              Dia {String(diaSelecionado).padStart(2,'0')}/{String(mes).padStart(2,'0')}/{ano}
            </h3>
            <button type="button" onClick={() => setDiaSelecionado(null)}>
              <X className="h-4 w-4 text-gray-400 hover:text-gray-700" />
            </button>
          </div>

          {/* Objetos já registrados */}
          {objetosDoDia(diaSelecionado).map((o) => (
            <div key={o.id} className={`mb-2 flex items-start justify-between rounded-md px-3 py-2 text-sm ${STATUS_CONFIG[o.status].bg}`}>
              <div>
                <span className={`font-medium ${STATUS_CONFIG[o.status].text}`}>{STATUS_CONFIG[o.status].label}</span>
                <p className="text-gray-700">{o.conteudo}</p>
              </div>
              <button type="button" onClick={() => handleExcluir(o.id)}>
                <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          ))}

          {/* Formulário */}
          <div className="space-y-2 pt-2">
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as StatusObjeto)}
            >
              {Object.entries(STATUS_CONFIG).filter(([k]) => k !== 'letivo').map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              rows={3}
              placeholder="Descreva o conteúdo ministrado..."
              value={formConteudo}
              onChange={(e) => setFormConteudo(e.target.value)}
            />
            <Button
              type="button"
              onClick={handleSalvar}
              disabled={salvando || !formConteudo.trim()}
              tamanho="pequeno"
            >
              {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Registrar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
