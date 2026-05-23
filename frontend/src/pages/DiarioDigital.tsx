import { useEffect, useState } from 'react';
import { BookOpen, CalendarDays, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import TabelaFrequenciaMensal from '@/components/TabelaFrequenciaMensal';
import {
  fecharDia,
  justificarFalta,
  listarDiarioMensal,
  type PresencaMensalAluno,
} from '@/services/diarioService';
import { listarComponentes, type ComponenteCurricular } from '@/services/componentesService';

function obterDataHoje() {
  return new Date().toISOString().slice(0, 10);
}

function obterMesAtual() {
  return new Date().getMonth() + 1;
}

function obterAnoAtual() {
  return new Date().getFullYear();
}

function contarStatus(alunos: PresencaMensalAluno[], status: string): number {
  let total = 0;
  for (const aluno of alunos) {
    for (const dia of Object.values(aluno.dias)) {
      if (dia.status === status) total++;
    }
  }
  return total;
}

export default function DiarioDigital() {
  const [turma, setTurma] = useState('');
  const [componente, setComponente] = useState('');
  const [componentes, setComponentes] = useState<ComponenteCurricular[]>([]);
  const [mes, setMes] = useState(obterMesAtual());
  const [ano, setAno] = useState(obterAnoAtual());
  const [carregandoMensal, setCarregandoMensal] = useState(false);
  const [fechandoDia, setFechandoDia] = useState(false);
  const [alunosMensais, setAlunosMensais] = useState<PresencaMensalAluno[]>([]);

  useEffect(() => {
    if (!turma.trim()) {
      setComponentes([]);
      setComponente('');
      return;
    }
    listarComponentes(turma.trim())
      .then(setComponentes)
      .catch(() => setComponentes([]));
  }, [turma]);

  async function carregarMensal() {
    if (!turma.trim()) {
      toast.error('Informe a turma.');
      return;
    }
    try {
      setCarregandoMensal(true);
      const resultado = await listarDiarioMensal({
        turmaId: turma.trim(),
        mes,
        ano,
        componente: componente || undefined,
      });
      setAlunosMensais(resultado.alunos);
    } catch (error) {
      toast.error('Erro ao carregar frequência mensal.', {
        description: error instanceof Error ? error.message : 'Erro inesperado.',
      });
    } finally {
      setCarregandoMensal(false);
    }
  }

  async function handleFecharDia() {
    if (!turma.trim()) {
      toast.error('Informe a turma.');
      return;
    }
    try {
      setFechandoDia(true);
      const hoje = obterDataHoje();
      const resultado = await fecharDia({ turmaId: turma.trim(), data: hoje });
      toast.success(`Dia ${hoje} fechado: ${resultado.faltas} falta(s) registrada(s).`);
      if (alunosMensais.length > 0) await carregarMensal();
    } catch (error) {
      toast.error('Erro ao fechar dia.', {
        description: error instanceof Error ? error.message : 'Erro inesperado.',
      });
    } finally {
      setFechandoDia(false);
    }
  }

  async function handleJustificar(params: {
    alunoId: string;
    turma: string;
    data: string;
    justificativa: string;
  }) {
    await justificarFalta({ ...params, componente: componente || undefined });
    toast.success('Justificativa salva.');

    setAlunosMensais((prev: PresencaMensalAluno[]) =>
      prev.map((aluno: PresencaMensalAluno) => {
        if (aluno.alunoId !== params.alunoId) return aluno;
        return {
          ...aluno,
          dias: {
            ...aluno.dias,
            [params.data]: {
              ...aluno.dias[params.data],
              status: 'justificado' as const,
              justificativa: params.justificativa,
            },
          },
        };
      }),
    );
  }

  const totalPresentes = contarStatus(alunosMensais, 'presente');
  const totalAtrasados = contarStatus(alunosMensais, 'atrasado');
  const totalFaltas = contarStatus(alunosMensais, 'falta');
  const totalPendentes = contarStatus(alunosMensais, 'pendente');

  const nomeMes = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Diário Digital</h1>
        <p className="text-gray-500">
          Acompanhe a frequência mensal da turma por componente curricular.
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-700" />
            Consulta de frequência
          </CardTitle>
          <CardDescription>
            Escolha a turma, componente, mês e ano para carregar a frequência.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {/* Turma */}
            <div className="space-y-1 md:col-span-2">
              <label htmlFor="turma" className="text-sm font-medium text-gray-700">
                Turma
              </label>
              <Input
                id="turma"
                placeholder="Ex: 3º Ano A"
                value={turma}
                onChange={(e) => setTurma(e.target.value)}
              />
            </div>

            {/* Componente Curricular — sempre select */}
            <div className="space-y-1">
              <label htmlFor="componente" className="text-sm font-medium text-gray-700">
                Componente Curricular
              </label>
              <select
                id="componente"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                value={componente}
                onChange={(e) => setComponente(e.target.value)}
                disabled={!turma.trim()}
              >
                {!turma.trim() ? (
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

            {/* Mês */}
            <div className="space-y-1">
              <label htmlFor="mes" className="text-sm font-medium text-gray-700">
                Mês
              </label>
              <select
                id="mes"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(ano, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            {/* Ano + botão Carregar */}
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <label htmlFor="ano" className="text-sm font-medium text-gray-700">
                  Ano
                </label>
                <Input
                  id="ano"
                  type="number"
                  value={ano}
                  min={2020}
                  max={2099}
                  onChange={(e) => setAno(Number(e.target.value))}
                />
              </div>
              <Button
                type="button"
                className="mb-px"
                onClick={carregarMensal}
                disabled={carregandoMensal}
              >
                {carregandoMensal ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Carregar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de resumo — totais do mês */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Presenças</div>
            <div className="text-2xl font-bold text-green-600">{totalPresentes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Atrasos</div>
            <div className="text-2xl font-bold text-orange-600">{totalAtrasados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Faltas</div>
            <div className="text-2xl font-bold text-red-600">{totalFaltas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Pendentes</div>
            <div className="text-2xl font-bold text-gray-700">{totalPendentes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela mensal */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-green-700" />
              Frequência Mensal
            </CardTitle>
            <CardDescription>
              {turma
                ? `${turma}${componente ? ` · ${componente}` : ''} — ${nomeMes} de ${ano}`
                : `Selecione uma turma para exibir — ${nomeMes} de ${ano}`}
            </CardDescription>
          </div>

          <Button
            type="button"
            variante="contorno"
            tamanho="pequeno"
            onClick={handleFecharDia}
            disabled={fechandoDia || !turma.trim()}
            className="shrink-0"
          >
            {fechandoDia ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Fechar dia (marcar faltas)
          </Button>
        </CardHeader>

        <CardContent>
          {carregandoMensal ? (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Carregando frequência mensal...
            </div>
          ) : (
            <TabelaFrequenciaMensal
              alunos={alunosMensais}
              mes={mes}
              ano={ano}
              onJustificar={handleJustificar}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
