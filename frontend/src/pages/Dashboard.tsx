import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Loader2, RefreshCw, UserCheck, Users, UserX } from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  buscarDadosSemana,
  buscarResumoDia,
  type DadosSemana,
  type PresencaDia,
  type ResumoDia,
} from '@/services/dashboardService';

const CORES_PIZZA = ['#16a34a', '#dc2626', '#ca8a04'];
const INTERVALO_REFRESH = 30_000;

function hojeFormatado(): string {
  return new Date().toISOString().slice(0, 10);
}

function horaAtual(): string {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function dataExibicao(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function Dashboard() {
  const [resumo, setResumo] = useState<ResumoDia | null>(null);
  const [semana, setSemana] = useState<DadosSemana[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [horaDisplay, setHoraDisplay] = useState(horaAtual());

  async function carregar() {
    try {
      setCarregando(true);
      const [res, sem] = await Promise.all([
        buscarResumoDia(hojeFormatado()),
        buscarDadosSemana(),
      ]);
      setResumo(res);
      setSemana(sem);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    const intervalo = setInterval(carregar, INTERVALO_REFRESH);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setHoraDisplay(horaAtual()), 1000);
    return () => clearInterval(tick);
  }, []);

  const dadosPizza = resumo
    ? [
        { name: 'Presentes', value: resumo.presentes },
        { name: 'Ausentes', value: resumo.ausentes },
        { name: 'Atrasos', value: resumo.atrasos },
      ]
    : [];

  const recentes: PresencaDia[] = resumo
    ? [...resumo.presencas]
        .sort((a, b) => (b.horaEntrada ?? '').localeCompare(a.horaEntrada ?? ''))
        .slice(0, 10)
    : [];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="capitalize text-gray-500">{dataExibicao()}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium tabular-nums text-gray-700">
            {horaDisplay}
          </span>
          <button
            onClick={carregar}
            disabled={carregando}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${carregando ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Cards */}
      {carregando && !resumo ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando dados...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total de Alunos</CardTitle>
                <Users className="h-4 w-4 text-green-700" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resumo?.total ?? 0}</div>
                <p className="mt-1 text-xs text-gray-500">Cadastrados no sistema</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Presentes</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{resumo?.presentes ?? 0}</div>
                <p className="mt-1 text-xs text-gray-500">
                  {resumo?.percentualPresenca ?? 0}% de frequência hoje
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Ausentes</CardTitle>
                <UserX className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{resumo?.ausentes ?? 0}</div>
                <p className="mt-1 text-xs text-gray-500">Sem registro hoje</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Atrasos</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{resumo?.atrasos ?? 0}</div>
                <p className="mt-1 text-xs text-gray-500">Entrada fora do horário</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Barras — frequência da semana */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Frequência da Semana</CardTitle>
              </CardHeader>
              <CardContent>
                {semana.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                    Sem dados nesta semana.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={semana} barSize={36}>
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number) => [`${value} presente(s)`, 'Presentes']}
                      />
                      <Bar dataKey="presentes" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Pizza — distribuição do dia */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuição Hoje</CardTitle>
              </CardHeader>
              <CardContent>
                {!resumo || resumo.total === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                    Nenhum aluno cadastrado.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={dadosPizza}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => (value > 0 ? `${name}: ${value}` : '')}
                        labelLine={false}
                      >
                        {dadosPizza.map((_, index) => (
                          <Cell key={index} fill={CORES_PIZZA[index]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value, '']} />
                      <Legend
                        formatter={(value) => (
                          <span style={{ fontSize: 12, color: '#374151' }}>{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabela de reconhecimentos */}
          <Card>
            <CardHeader>
              <CardTitle>Últimos Reconhecimentos</CardTitle>
            </CardHeader>
            <CardContent>
              {recentes.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  Nenhum reconhecimento registrado hoje.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Nome</th>
                        <th className="px-4 py-3">Turma</th>
                        <th className="px-4 py-3">Entrada</th>
                        <th className="px-4 py-3">Saída</th>
                        <th className="px-4 py-3">Confiança</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentes.map((p) => (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{p.nome}</td>
                          <td className="px-4 py-3 text-gray-500">{p.turma || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{p.horaEntrada ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{p.horaSaida ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-500">
                            {p.confidence != null
                              ? `${(p.confidence * 100).toFixed(1)}%`
                              : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {p.status === 'atrasado' ? (
                              <Badge className="bg-yellow-100 text-yellow-800">Atrasado</Badge>
                            ) : p.horaSaida ? (
                              <Badge className="bg-blue-100 text-blue-800">Saída registrada</Badge>
                            ) : p.horaEntrada ? (
                              <Badge className="bg-green-100 text-green-800">Presente</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Falha
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
