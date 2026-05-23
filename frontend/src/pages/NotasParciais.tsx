import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { listarAlunos, type Aluno } from '@/services/alunosService';
import { listarNotas, salvarNota, type Nota } from '@/services/notaService';

const BIMESTRES = [
  { num: 1 as const, label: '1º Bimestre', bg: 'bg-blue-50',   borda: 'border-blue-200',   header: 'bg-blue-100 text-blue-800' },
  { num: 2 as const, label: '2º Bimestre', bg: 'bg-purple-50', borda: 'border-purple-200', header: 'bg-purple-100 text-purple-800' },
  { num: 3 as const, label: '3º Bimestre', bg: 'bg-green-50',  borda: 'border-green-200',  header: 'bg-green-100 text-green-800' },
  { num: 4 as const, label: '4º Bimestre', bg: 'bg-orange-50', borda: 'border-orange-200', header: 'bg-orange-100 text-orange-800' },
];

type ColunaAv = 'av1' | 'av2' | 'av3' | 'av4';

function formatarNota(n: number | null): string {
  if (n == null) return '';
  return String(n);
}

function calcMedia(n: Nota | undefined): string {
  if (!n) return '—';
  if (n.media == null) return '—';
  return n.media.toFixed(1);
}

interface CelulaEditavelProps {
  valor: number | null;
  alunoId: string;
  turmaId: string;
  componente: string;
  bimestre: 1 | 2 | 3 | 4;
  coluna: ColunaAv;
  nota: Nota | undefined;
  onSalvo: (nota: Nota) => void;
}

function CelulaEditavel({ valor, alunoId, turmaId, componente, bimestre, coluna, nota, onSalvo }: CelulaEditavelProps) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(formatarNota(valor));
  const [salvando, setSalvando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editando) inputRef.current?.focus();
  }, [editando]);

  async function confirmar() {
    const num = texto.trim() === '' ? null : Number(texto.trim().replace(',', '.'));
    if (texto.trim() !== '' && (isNaN(num!) || num! < 0 || num! > 10)) {
      toast.error('Nota deve ser entre 0 e 10.');
      return;
    }
    try {
      setSalvando(true);
      const payload = {
        alunoId, turmaId, componente, bimestre,
        av1: nota?.av1 ?? null,
        av2: nota?.av2 ?? null,
        av3: nota?.av3 ?? null,
        av4: nota?.av4 ?? null,
        [coluna]: num,
      };
      const notaSalva = await salvarNota(payload);
      onSalvo(notaSalva);
      setEditando(false);
    } catch (error) {
      toast.error('Erro ao salvar nota.', { description: error instanceof Error ? error.message : '' });
    } finally {
      setSalvando(false);
    }
  }

  if (salvando) return <td className="px-2 py-2 text-center"><Loader2 className="mx-auto h-3 w-3 animate-spin text-gray-400" /></td>;

  if (editando) {
    return (
      <td className="px-1 py-1 text-center">
        <input
          ref={inputRef}
          className="w-14 rounded border border-green-400 px-1 py-0.5 text-center text-xs focus:outline-none"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={confirmar}
          onKeyDown={(e) => { if (e.key === 'Enter') confirmar(); if (e.key === 'Escape') setEditando(false); }}
        />
      </td>
    );
  }

  return (
    <td
      className="cursor-pointer px-2 py-2 text-center text-sm text-gray-700 hover:bg-white/60"
      onClick={() => { setTexto(formatarNota(valor)); setEditando(true); }}
    >
      {valor != null ? valor : <span className="text-gray-300">—</span>}
    </td>
  );
}

export default function NotasParciais() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const turmaId = searchParams.get('turmaId') ?? '';
  const nomeTurma = searchParams.get('nomeTurma') ?? turmaId;
  const componenteUrl = searchParams.get('componente') ?? '';

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    if (!turmaId) return;
    setCarregando(true);
    Promise.all([
      listarAlunos().then((r) => r.alunos.filter((a) => a.turma === turmaId)),
      listarNotas({ turmaId, componente: componenteUrl || undefined }),
    ])
      .then(([als, nts]) => { setAlunos(als); setNotas(nts); })
      .catch(() => toast.error('Erro ao carregar notas.'))
      .finally(() => setCarregando(false));
  }, [turmaId, componenteUrl]);

  function notaDo(alunoId: string, bimestre: 1 | 2 | 3 | 4): Nota | undefined {
    return notas.find((n) => n.alunoId === alunoId && n.bimestre === bimestre);
  }

  function handleNotaSalva(nota: Nota) {
    setNotas((prev) => {
      const idx = prev.findIndex((n) => n.id === nota.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = nota; return next; }
      return [...prev, nota];
    });
  }

  const alunosFiltrados = alunos.filter((a) =>
    a.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  function mediaGeral(bimestre: 1 | 2 | 3 | 4): string {
    const ms = alunosFiltrados
      .map((a) => notaDo(a.id, bimestre)?.media)
      .filter((m): m is number => m != null);
    if (ms.length === 0) return '—';
    return (ms.reduce((a, b) => a + b, 0) / ms.length).toFixed(1);
  }

  function comNotas(bimestre: 1 | 2 | 3 | 4): number {
    return alunosFiltrados.filter((a) => {
      const n = notaDo(a.id, bimestre);
      return n && (n.av1 != null || n.av2 != null || n.av3 != null || n.av4 != null);
    }).length;
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando notas...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notas Parciais</h1>
          <p className="text-sm text-gray-500">
            {nomeTurma}{componenteUrl ? ` · ${componenteUrl}` : ''} — clique em uma célula para editar
          </p>
        </div>
        <Button variante="contorno" tamanho="pequeno" onClick={() => navigate('/diario')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
        </Button>
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Buscar aluno..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 4 bimestres */}
      <div className="grid gap-4 lg:grid-cols-2">
        {BIMESTRES.map((bim) => (
          <div key={bim.num} className={`rounded-xl border ${bim.borda} ${bim.bg} overflow-hidden`}>
            <div className={`px-4 py-2 ${bim.header}`}>
              <span className="font-semibold">{bim.label}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-white/60">
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Estudante</th>
                    <th className="px-2 py-2 text-center font-semibold text-gray-700">AV1</th>
                    <th className="px-2 py-2 text-center font-semibold text-gray-700">AV2</th>
                    <th className="px-2 py-2 text-center font-semibold text-gray-700">AV3</th>
                    <th className="px-2 py-2 text-center font-semibold text-gray-700">AV4</th>
                    <th className="px-2 py-2 text-center font-semibold text-gray-700">Média</th>
                  </tr>
                </thead>
                <tbody>
                  {alunosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-400">
                        Nenhum aluno encontrado.
                      </td>
                    </tr>
                  ) : (
                    alunosFiltrados.map((aluno, idx) => {
                      const nota = notaDo(aluno.id, bim.num);
                      return (
                        <tr
                          key={aluno.id}
                          className={`border-b border-gray-100 last:border-0 ${idx % 2 === 0 ? '' : 'bg-white/40'}`}
                        >
                          <td className="max-w-[140px] truncate px-3 py-2 font-medium text-gray-800" title={aluno.nome}>
                            {aluno.nome}
                          </td>
                          {(['av1','av2','av3','av4'] as ColunaAv[]).map((col) => (
                            <CelulaEditavel
                              key={col}
                              valor={nota?.[col] ?? null}
                              alunoId={aluno.id}
                              turmaId={turmaId}
                              componente={componenteUrl || 'Geral'}
                              bimestre={bim.num}
                              coluna={col}
                              nota={nota}
                              onSalvo={handleNotaSalva}
                            />
                          ))}
                          <td className="px-2 py-2 text-center font-semibold text-gray-800">
                            {calcMedia(nota)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 bg-white/60">
                    <td className="px-3 py-1.5 text-gray-500">
                      {comNotas(bim.num)} de {alunosFiltrados.length} com notas
                    </td>
                    <td colSpan={4} />
                    <td className="px-2 py-1.5 text-center font-semibold text-gray-700">
                      {mediaGeral(bim.num)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
