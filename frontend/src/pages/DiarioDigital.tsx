import { useState } from 'react';
import { BookOpen, CheckCircle2, Clock, Loader2, LogOut, Search, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  confirmarEntrada,
  confirmarSaida,
  listarDiario,
  marcarFalta,
  type RegistroDiario,
  type StatusEntrada,
  type StatusSaida,
} from '@/services/diarioService';

function obterDataHoje() {
  return new Date().toISOString().slice(0, 10);
}

export default function DiarioDigital() {
  const [turma, setTurma] = useState('');
  const [data, setData] = useState(obterDataHoje());
  const [carregando, setCarregando] = useState(false);
  const [processandoMatricula, setProcessandoMatricula] = useState<string | null>(null);
  const [registros, setRegistros] = useState<RegistroDiario[]>([]);

  async function carregarDiario() {
    if (!turma.trim() || !data) {
      toast.error('Informe a turma e a data.');
      return;
    }

    try {
      setCarregando(true);

      const resultado = await listarDiario({
        turma,
        data,
      });

      setRegistros(resultado.registros);
    } catch (error) {
      toast.error('Erro ao carregar diário.', {
        description: error instanceof Error ? error.message : 'Erro inesperado.',
      });
    } finally {
      setCarregando(false);
    }
  }

  async function executarAcao(
    matricula: string,
    acao: 'entrada' | 'saida' | 'falta',
  ) {
    try {
      setProcessandoMatricula(matricula);

      if (acao === 'entrada') {
        await confirmarEntrada({
          matricula,
          data,
          origem: 'manual',
        });

        toast.success('Entrada confirmada.');
      }

      if (acao === 'saida') {
        await confirmarSaida({
          matricula,
          data,
          origem: 'manual',
        });

        toast.success('Saída confirmada.');
      }

      if (acao === 'falta') {
        await marcarFalta({
          matricula,
          data,
        });

        toast.success('Falta registrada.');
      }

      await carregarDiario();
    } catch (error) {
      toast.error('Erro ao executar ação.', {
        description: error instanceof Error ? error.message : 'Erro inesperado.',
      });
    } finally {
      setProcessandoMatricula(null);
    }
  }

  function obterBadgeEntrada(status: StatusEntrada) {
    if (status === 'presente') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Presente</Badge>;
    }

    if (status === 'atrasado') {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Atrasado</Badge>;
    }

    if (status === 'ausente') {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Ausente</Badge>;
    }

    return <Badge variante="secundario">Pendente</Badge>;
  }

  function obterBadgeSaida(status: StatusSaida) {
    if (status === 'saida_registrada') {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Saída registrada</Badge>;
    }

    return <Badge variante="secundario">Pendente</Badge>;
  }

  const totalPresentes = registros.filter(
    (registro) => registro.statusEntrada === 'presente',
  ).length;

  const totalAtrasados = registros.filter(
    (registro) => registro.statusEntrada === 'atrasado',
  ).length;

  const totalAusentes = registros.filter(
    (registro) => registro.statusEntrada === 'ausente',
  ).length;

  const totalPendentes = registros.filter(
    (registro) => registro.statusEntrada === 'pendente',
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Diário Digital</h1>
        <p className="text-gray-500">
          Confirme entrada, saída e faltas com base no horário cadastrado.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-700" />
            Consulta do diário
          </CardTitle>
          <CardDescription>Escolha a turma e a data para carregar a lista.</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="turma" className="text-sm font-medium text-gray-700">
                Turma
              </label>
              <Input
                id="turma"
                placeholder="Ex: 3º Ano A"
                value={turma}
                onChange={(evento) => setTurma(evento.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="data" className="text-sm font-medium text-gray-700">
                Data
              </label>
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(evento) => setData(evento.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button type="button" className="w-full" onClick={carregarDiario} disabled={carregando}>
                {carregando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Carregar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Presentes</div>
            <div className="text-2xl font-bold text-green-600">{totalPresentes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Atrasados</div>
            <div className="text-2xl font-bold text-orange-600">{totalAtrasados}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Ausentes</div>
            <div className="text-2xl font-bold text-red-600">{totalAusentes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Pendentes</div>
            <div className="text-2xl font-bold text-gray-700">{totalPendentes}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista do diário</CardTitle>
          <CardDescription>
            Alunos carregados da turma selecionada para a data informada.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {carregando ? (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Carregando diário...
            </div>
          ) : registros.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
              Nenhum registro encontrado. Informe a turma e clique em carregar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Aluno</th>
                    <th className="px-4 py-3">Entrada prevista</th>
                    <th className="px-4 py-3">Entrada real</th>
                    <th className="px-4 py-3">Saída prevista</th>
                    <th className="px-4 py-3">Saída real</th>
                    <th className="px-4 py-3">Entrada</th>
                    <th className="px-4 py-3">Saída</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {registros.map((registro) => {
                    const processando = processandoMatricula === registro.matricula;

                    return (
                      <tr key={registro.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{registro.nome}</div>
                          <div className="text-xs text-gray-500">
                            {registro.matricula} • {registro.turma}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {registro.horaEntradaPrevista || '-'}
                          </div>
                          <div className="text-xs text-gray-400">
                            limite: {registro.horaLimiteEntrada || '-'}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-gray-600">
                          {registro.horaEntradaReal || '-'}
                        </td>

                        <td className="px-4 py-3 text-gray-600">
                          {registro.horaSaidaPrevista || '-'}
                        </td>

                        <td className="px-4 py-3 text-gray-600">
                          {registro.horaSaidaReal || '-'}
                        </td>

                        <td className="px-4 py-3">
                          {obterBadgeEntrada(registro.statusEntrada)}
                        </td>

                        <td className="px-4 py-3">{obterBadgeSaida(registro.statusSaida)}</td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              tamanho="pequeno"
                              variante="contorno"
                              disabled={processando}
                              onClick={() => executarAcao(registro.matricula, 'entrada')}
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Entrada
                            </Button>

                            <Button
                              type="button"
                              tamanho="pequeno"
                              variante="contorno"
                              disabled={processando}
                              onClick={() => executarAcao(registro.matricula, 'saida')}
                            >
                              <LogOut className="mr-1 h-4 w-4" />
                              Saída
                            </Button>

                            <Button
                              type="button"
                              tamanho="pequeno"
                              variante="destrutivo"
                              disabled={processando}
                              onClick={() => executarAcao(registro.matricula, 'falta')}
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Falta
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}