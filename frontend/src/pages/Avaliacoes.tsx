import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  criarAvaliacao,
  excluirAvaliacao,
  listarAvaliacoes,
  type Avaliacao,
  type TipoAvaliacao,
} from '@/services/avaliacaoService';
import { listarObjetos, type ObjetoConhecimento } from '@/services/objetoService';

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
const TIPOS: TipoAvaliacao[] = ['Prova','Trabalho','Seminário','Atividade','Projeto'];

function gerarCalendario(ano: number, mes: number) {
  const primeiroDia = new Date(ano, mes - 1, 1).getDay();
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const celulas: (number | null)[] = Array(primeiroDia).fill(null);
  for (let d = 1; d <= ultimoDia; d++) celulas.push(d);
  while (celulas.length % 7 !== 0) celulas.push(null);
  return celulas;
}

export default function Avaliacoes() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const turmaId = searchParams.get('turmaId') ?? '';
  const nomeTurma = searchParams.get('nomeTurma') ?? turmaId;
  const componenteUrl = searchParams.get('componente') ?? '';

  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  const [mes, setMes] = useState(mesAtual);
  const [ano] = useState(anoAtual);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [objetos, setObjetos] = useState<ObjetoConhecimento[]>([]);
  const [carregando, setCarregando] = useState(false);

  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<TipoAvaliacao>('Prova');
  const [valor, setValor] = useState(10);
  const [objetosSelecionados, setObjetosSelecionados] = useState<string[]>([]);
  const [criterios, setCriterios] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [gerandoIA, setGerandoIA] = useState(false);

  useEffect(() => {
    if (!turmaId) return;
    setCarregando(true);
    Promise.all([
      listarAvaliacoes({ turmaId, componente: componenteUrl || undefined, mes, ano }),
      listarObjetos({ turmaId, componente: componenteUrl || undefined }),
    ])
      .then(([avs, obs]) => { setAvaliacoes(avs); setObjetos(obs); })
      .catch(() => toast.error('Erro ao carregar avaliações.'))
      .finally(() => setCarregando(false));
  }, [turmaId, mes, ano, componenteUrl]);

  function dataStr(dia: number) {
    return `${ano}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
  }

  function avaliacoesDoDia(dia: number) {
    return avaliacoes.filter((a) => a.data === dataStr(dia));
  }

  function toggleObjeto(id: string) {
    setObjetosSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleGerarIA() {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
    if (!apiKey) {
      toast.error('Configure VITE_ANTHROPIC_API_KEY no arquivo frontend/.env');
      return;
    }
    if (!titulo.trim()) {
      toast.error('Informe o título da avaliação antes de usar a IA.');
      return;
    }
    try {
      setGerandoIA(true);
      const objetosSel = objetos.filter((o) => objetosSelecionados.includes(o.id));
      const conteudos = objetosSel.map((o) => o.conteudo).join(', ') || 'conteúdo geral';

      const resposta = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 512,
          messages: [
            {
              role: 'user',
              content: `Gere critérios de avaliação claros e objetivos para uma ${tipo} chamada "${titulo}" que avalia os seguintes conteúdos: ${conteudos}. Responda em português, de forma direta, em tópicos curtos.`,
            },
          ],
        }),
      });

      if (!resposta.ok) throw new Error('Erro na API da Anthropic.');
      const dados = await resposta.json() as { content: Array<{ text: string }> };
      setCriterios(dados.content[0]?.text ?? '');
      toast.success('Critérios gerados com IA.');
    } catch (error) {
      toast.error('Erro ao gerar com IA.', { description: error instanceof Error ? error.message : '' });
    } finally {
      setGerandoIA(false);
    }
  }

  async function handleSalvar() {
    if (!diaSelecionado || !titulo.trim()) return;
    try {
      setSalvando(true);
      await criarAvaliacao({
        turmaId,
        componente: componenteUrl || 'Geral',
        data: dataStr(diaSelecionado),
        titulo: titulo.trim(),
        tipo,
        valor,
        objetosIds: objetosSelecionados,
        criterios: criterios.trim(),
      });
      toast.success('Avaliação criada.');
      setDiaSelecionado(null);
      setTitulo(''); setCriterios(''); setObjetosSelecionados([]); setValor(10);
      const avs = await listarAvaliacoes({ turmaId, componente: componenteUrl || undefined, mes, ano });
      setAvaliacoes(avs);
    } catch (error) {
      toast.error('Erro ao salvar.', { description: error instanceof Error ? error.message : '' });
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(id: string) {
    try {
      await excluirAvaliacao(id);
      toast.success('Avaliação removida.');
      setAvaliacoes((prev) => prev.filter((a) => a.id !== id));
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
          <h1 className="text-xl font-bold text-gray-900">Avaliações</h1>
          <p className="text-sm text-gray-500">
            {nomeTurma}{componenteUrl ? ` · ${componenteUrl}` : ''} — {MESES[mes - 1]} {ano}
          </p>
        </div>
        <Button variante="contorno" tamanho="pequeno" onClick={() => navigate('/diario')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
        </Button>
      </div>

      {/* Legenda + seletor */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3">
        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-green-400" />Dia Letivo</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-purple-500" />Avaliação</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-gray-300" />Evento</span>
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
                if (dia === null) return <div key={`e-${i}`} />;
                const ds = dataStr(dia);
                const diaSemana = new Date(`${ds}T00:00:00`).getDay();
                const fimSemana = diaSemana === 0 || diaSemana === 6;
                const temAv = avaliacoesDoDia(dia).length > 0;
                const isHoje = ds === hoje;
                return (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => { if (!fimSemana) { setDiaSelecionado(dia); setTitulo(''); setCriterios(''); setObjetosSelecionados([]); } }}
                    className={`rounded-lg p-2 text-center text-sm transition-all ${
                      fimSemana ? 'cursor-default text-gray-300'
                      : temAv ? 'bg-purple-100 text-purple-700 font-semibold hover:bg-purple-200'
                      : 'hover:bg-gray-100 text-gray-700'
                    } ${isHoje ? 'ring-2 ring-green-400' : ''} ${diaSelecionado === dia ? 'ring-2 ring-blue-400' : ''}`}
                  >
                    <div className="font-semibold">{dia}</div>
                    {temAv && <div className="text-[10px]">{avaliacoesDoDia(dia).length} av.</div>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Avaliações do dia / Formulário */}
      {diaSelecionado && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {String(diaSelecionado).padStart(2,'0')}/{String(mes).padStart(2,'0')}/{ano}
            </h3>
            <button type="button" onClick={() => setDiaSelecionado(null)}>
              <X className="h-4 w-4 text-gray-400 hover:text-gray-700" />
            </button>
          </div>

          {/* Avaliações existentes */}
          {avaliacoesDoDia(diaSelecionado).map((av) => (
            <div key={av.id} className="mb-2 flex items-center justify-between rounded-md bg-purple-50 px-3 py-2 text-sm">
              <div>
                <span className="font-medium text-purple-700">{av.tipo}</span>
                <span className="mx-2 text-gray-400">·</span>
                <span className="text-gray-800">{av.titulo}</span>
                <span className="ml-2 text-gray-400">({av.valor} pts)</span>
              </div>
              <button type="button" onClick={() => handleExcluir(av.id)}>
                <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          ))}

          {/* Formulário nova avaliação */}
          <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Nova Avaliação</p>

            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Título da Avaliação"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoAvaliacao)}
              >
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                type="number"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Valor (pts)"
                value={valor}
                min={0}
                max={100}
                onChange={(e) => setValor(Number(e.target.value))}
              />
            </div>

            {/* Objetos selecionáveis */}
            {objetos.length > 0 && (
              <div>
                <p className="mb-1 text-xs text-gray-500">Objetos de Conhecimento Avaliados</p>
                <div className="flex flex-wrap gap-1">
                  {objetos.slice(0, 10).map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => toggleObjeto(o.id)}
                      className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                        objetosSelecionados.includes(o.id)
                          ? 'border-green-500 bg-green-100 text-green-700'
                          : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {o.conteudo.length > 30 ? `${o.conteudo.slice(0, 30)}…` : o.conteudo}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative">
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                rows={4}
                placeholder="Critérios de avaliação / Observações..."
                value={criterios}
                onChange={(e) => setCriterios(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button variante="contorno" tamanho="pequeno" onClick={() => setDiaSelecionado(null)}>
                Cancelar
              </Button>
              <Button
                tamanho="pequeno"
                className="bg-purple-600 text-white hover:bg-purple-700"
                onClick={handleGerarIA}
                disabled={gerandoIA}
              >
                {gerandoIA ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Criar com IA
              </Button>
              <Button tamanho="pequeno" onClick={handleSalvar} disabled={salvando || !titulo.trim()}>
                {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Avaliação
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
