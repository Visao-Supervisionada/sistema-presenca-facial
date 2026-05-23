import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardList, GraduationCap, NotebookPen, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { listarComponentes, type ComponenteCurricular } from '@/services/componentesService';
import { listarTurmasDisponiveis, listarProfessoresDisponiveis, type Professor } from '@/services/turmasService';

const SELECT_CLASS =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400';

const MODULOS = [
  {
    id: 'frequencia',
    titulo: 'Frequência',
    descricao: 'Registro diário de presença dos alunos',
    icon: Users,
    cor: 'text-green-600',
    bg: 'bg-green-50',
    rota: '/diario/frequencia',
  },
  {
    id: 'objetos-conhecimento',
    titulo: 'Objetos de Conhecimento',
    descricao: 'Planejamento e registro de aulas',
    icon: BookOpen,
    cor: 'text-blue-600',
    bg: 'bg-blue-50',
    rota: '/diario/objetos-conhecimento',
  },
  {
    id: 'avaliacoes',
    titulo: 'Avaliações',
    descricao: 'Gestão de provas e trabalhos',
    icon: ClipboardList,
    cor: 'text-purple-600',
    bg: 'bg-purple-50',
    rota: '/diario/avaliacoes',
  },
  {
    id: 'notas-parciais',
    titulo: 'Notas Parciais',
    descricao: 'Lançamento de notas por bimestre',
    icon: GraduationCap,
    cor: 'text-orange-500',
    bg: 'bg-orange-50',
    rota: '/diario/notas-parciais',
  },
] as const;

export default function DiarioDigital() {
  const navigate = useNavigate();

  const [professores, setProfessores] = useState<Professor[]>([]);
  const [turmas, setTurmas] = useState<string[]>([]);
  const [componentes, setComponentes] = useState<ComponenteCurricular[]>([]);

  const [professor, setProfessor] = useState('');
  const [turma, setTurma] = useState('');
  const [componente, setComponente] = useState('');

  useEffect(() => {
    listarTurmasDisponiveis().then(setTurmas).catch(() => setTurmas([]));
    listarProfessoresDisponiveis().then(setProfessores).catch(() => setProfessores([]));
  }, []);

  useEffect(() => {
    if (!turma) {
      setComponentes([]);
      setComponente('');
      return;
    }
    listarComponentes(turma).then(setComponentes).catch(() => setComponentes([]));
  }, [turma]);

  function navegar(rota: string) {
    if (!turma) return;
    const params = new URLSearchParams({
      turmaId: turma,
      nomeTurma: turma,
      ...(componente ? { componente } : {}),
      ...(professor ? { professor } : {}),
    });
    navigate(`${rota}?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Diário Digital</h1>
        <p className="text-gray-500">Gerencie suas turmas, chamadas e registros de aula.</p>
      </div>

      {/* Filtros encadeados */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <NotebookPen className="h-4 w-4 text-green-600" />
          <span className="text-sm font-semibold text-gray-700">Filtros de Acesso</span>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
            EM ATENDIMENTO
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Professor */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Professor</label>
            <select
              className={SELECT_CLASS}
              value={professor}
              onChange={(e) => setProfessor(e.target.value)}
            >
              <option value="">Selecione um professor</option>
              {professores.length === 0 && (
                <option value="__todos__">Todos os professores</option>
              )}
              {professores.map((p) => (
                <option key={p.id} value={p.nome}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Turma */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Turma</label>
            <select
              className={SELECT_CLASS}
              value={turma}
              onChange={(e) => { setTurma(e.target.value); setComponente(''); }}
            >
              <option value="">Selecione uma turma</option>
              {turmas.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Componente */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Componente Curricular</label>
            <select
              className={SELECT_CLASS}
              value={componente}
              onChange={(e) => setComponente(e.target.value)}
              disabled={!turma}
            >
              {!turma ? (
                <option value="">Selecione uma turma primeiro</option>
              ) : (
                <>
                  <option value="">Todos os componentes</option>
                  {componentes.map((c) => (
                    <option key={c.id} value={c.nome}>
                      {c.nome}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* 4 Cards */}
      {!turma && (
        <p className="text-center text-sm text-gray-400">Selecione uma turma para acessar os módulos.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULOS.map((modulo) => {
          const Icon = modulo.icon;
          return (
            <Card
              key={modulo.id}
              onClick={() => navegar(modulo.rota)}
              className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
                !turma ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <div className={`flex h-14 w-14 items-center justify-center rounded-full ${modulo.bg}`}>
                  <Icon className={`h-7 w-7 ${modulo.cor}`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{modulo.titulo}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{modulo.descricao}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
