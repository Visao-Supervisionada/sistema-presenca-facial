import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import TabelaFrequenciaMensal from '@/components/TabelaFrequenciaMensal';
import {
  fecharDia,
  fecharTurno,
  justificarFalta,
  listarDiarioMensal,
  type PresencaMensalAluno,
} from '@/services/diarioService';
import { listarComponentes, type ComponenteCurricular } from '@/services/componentesService';
import { useEffect } from 'react';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const SELECT_CLASS =
  'rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500';

export default function FrequenciaDigital() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const turmaId = params.get('turmaId') ?? '';
  const nomeTurma = params.get('nomeTurma') ?? turmaId;
  const componenteUrl = params.get('componente') ?? '';

  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  const [componente, setComponente] = useState(componenteUrl);
  const [componentes, setComponentes] = useState<ComponenteCurricular[]>([]);
  const [mes, setMes] = useState(mesAtual);
  const [ano] = useState(anoAtual);
  const [alunos, setAlunos] = useState<PresencaMensalAluno[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [fechandoDia, setFechandoDia] = useState(false);
  const [fechandoTurno, setFechandoTurno] = useState<'matutino' | 'vespertino' | null>(null);

  useEffect(() => {
    if (!turmaId) return;
    listarComponentes(turmaId).then(setComponentes).catch(() => setComponentes([]));
  }, [turmaId]);

  useEffect(() => {
    if (turmaId) carregar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaId, mes, componente]);

  async function carregar() {
    if (!turmaId) return;
    try {
      setCarregando(true);
      const resultado = await listarDiarioMensal({
        turmaId,
        mes,
        ano,
        componente: componente || undefined,
      });
      setAlunos(resultado.alunos);
    } catch (error) {
      toast.error('Erro ao carregar frequência.', {
        description: error instanceof Error ? error.message : 'Erro inesperado.',
      });
    } finally {
      setCarregando(false);
    }
  }

  async function handleFecharDia() {
    if (!turmaId) return;
    try {
      setFechandoDia(true);
      const hoje = new Date().toISOString().slice(0, 10);
      const resultado = await fecharDia({ turmaId, data: hoje });
      toast.success(`Dia fechado: ${resultado.faltas} falta(s) registrada(s).`);
      await carregar();
    } catch (error) {
      toast.error('Erro ao fechar dia.', {
        description: error instanceof Error ? error.message : 'Erro inesperado.',
      });
    } finally {
      setFechandoDia(false);
    }
  }

  async function handleFecharTurno(turno: 'matutino' | 'vespertino') {
    try {
      setFechandoTurno(turno);
      const hoje = new Date().toISOString().slice(0, 10);
      const resultado = await fecharTurno({ turno, data: hoje });
      toast.success(`Turno ${turno} fechado: ${resultado.faltas} falta(s) em ${resultado.processados} aluno(s).`);
      await carregar();
    } catch (error) {
      toast.error(`Erro ao fechar turno ${turno}.`, {
        description: error instanceof Error ? error.message : 'Erro inesperado.',
      });
    } finally {
      setFechandoTurno(null);
    }
  }

  async function handleJustificar(p: {
    alunoId: string;
    turma: string;
    data: string;
    justificativa: string;
  }) {
    try {
      await justificarFalta({ ...p, componente: componente || undefined });
      toast.success('Justificativa salva.');
      setAlunos((prev) =>
        prev.map((a) => {
          if (a.alunoId !== p.alunoId) return a;
          return {
            ...a,
            dias: {
              ...a.dias,
              [p.data]: {
                ...a.dias[p.data],
                status: 'justificado' as const,
                justificativa: p.justificativa,
              },
            },
          };
        }),
      );
    } catch (error) {
      toast.error('Erro ao salvar justificativa.', {
        description: error instanceof Error ? error.message : '',
      });
      throw error;
    }
  }

  const nomeMes = MESES[mes - 1];

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Frequência - {nomeTurma}</h1>
          <p className="text-sm text-gray-500">Controle de frequência dos Estudantes - Ano {ano}</p>
        </div>
        <Button
          type="button"
          variante="contorno"
          tamanho="pequeno"
          onClick={() => navigate('/diario')}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Voltar
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Componente</label>
          <select
            className={SELECT_CLASS}
            value={componente}
            onChange={(e) => setComponente(e.target.value)}
          >
            <option value="">Todos</option>
            {componentes.map((c) => (
              <option key={c.id} value={c.nome}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Mês</label>
          <select
            className={SELECT_CLASS}
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
          >
            {MESES.map((nome, i) => (
              <option key={i + 1} value={i + 1}>
                {nome}
              </option>
            ))}
          </select>
        </div>

        <span className="ml-auto flex items-center gap-1.5 rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600">
          <CalendarDays className="h-4 w-4" />
          Ano Letivo: {ano}
        </span>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-gray-800">
            <CalendarDays className="h-5 w-5 text-green-600" />
            Frequência - {nomeMes} de {ano}
            {componente && (
              <span className="text-green-700">({componente})</span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variante="contorno"
              tamanho="pequeno"
              onClick={() => handleFecharTurno('matutino')}
              disabled={fechandoTurno !== null}
              title="Fecha o dia para todos os alunos do turno matutino (07h–11h15)"
            >
              {fechandoTurno === 'matutino' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fechar Matutino
            </Button>
            <Button
              type="button"
              variante="contorno"
              tamanho="pequeno"
              onClick={() => handleFecharTurno('vespertino')}
              disabled={fechandoTurno !== null}
              title="Fecha o dia para todos os alunos do turno vespertino (13h–17h15)"
            >
              {fechandoTurno === 'vespertino' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fechar Vespertino
            </Button>
            <Button
              type="button"
              variante="contorno"
              tamanho="pequeno"
              onClick={handleFecharDia}
              disabled={fechandoDia}
              title="Fecha o dia apenas para esta turma"
            >
              {fechandoDia && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fechar Turma
            </Button>
          </div>
        </div>

        {carregando ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando frequência...
          </div>
        ) : (
          <TabelaFrequenciaMensal
            alunos={alunos}
            mes={mes}
            ano={ano}
            onJustificar={handleJustificar}
          />
        )}
      </div>
    </div>
  );
}
