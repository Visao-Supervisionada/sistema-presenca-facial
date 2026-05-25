import { useEffect, useState } from "react";
import { CalendarClock, Loader2, Plus, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  criarHorario,
  excluirHorario,
  listarHorarios,
  type DiaSemana,
  type Horario as HorarioTipo,
} from "@/services/horariosService";
import { listarAlunos, type Aluno } from "@/services/alunosService";

const diasSemana: { label: string; value: DiaSemana }[] = [
  { label: "Segunda-feira", value: "segunda" },
  { label: "Terça-feira", value: "terca" },
  { label: "Quarta-feira", value: "quarta" },
  { label: "Quinta-feira", value: "quinta" },
  { label: "Sexta-feira", value: "sexta" },
  { label: "Sábado", value: "sabado" },
  { label: "Domingo", value: "domingo" },
];

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

export default function Horario() {
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [horarios, setHorarios] = useState<HorarioTipo[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);

  const [formulario, setFormulario] = useState({
    diaSemana: "segunda" as DiaSemana,
    horaEntrada: "07:00",
    horaLimiteEntrada: "07:15",
    horaSaida: "11:15",
  });

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setCarregando(true);
      const [resHorarios, resAlunos] = await Promise.all([
        listarHorarios(),
        listarAlunos(),
      ]);
      setHorarios(resHorarios.horarios);
      setAlunos(resAlunos.alunos);
    } catch (error) {
      toast.error("Erro ao carregar dados.", {
        description: error instanceof Error ? error.message : "Erro inesperado.",
      });
    } finally {
      setCarregando(false);
    }
  }

  function selecionarAluno(matricula: string) {
    const aluno = alunos.find((a) => a.matricula === matricula) ?? null;
    setAlunoSelecionado(aluno);
  }

  function turnoDoHorario(horaEntrada: string): "matutino" | "vespertino" {
    return horaEntrada < "12:00" ? "matutino" : "vespertino";
  }

  async function salvarHorario(evento: React.FormEvent) {
    evento.preventDefault();

    if (!alunoSelecionado) {
      toast.error("Selecione um aluno.");
      return;
    }

    try {
      setSalvando(true);

      await criarHorario({
        matricula: alunoSelecionado.matricula,
        nome: alunoSelecionado.nome,
        turma: alunoSelecionado.turma,
        diaSemana: formulario.diaSemana,
        horaEntrada: formulario.horaEntrada,
        horaLimiteEntrada: formulario.horaLimiteEntrada,
        horaSaida: formulario.horaSaida,
      });

      toast.success("Horário cadastrado com sucesso.");

      setAlunoSelecionado(null);
      setFormulario({
        diaSemana: "segunda",
        horaEntrada: "07:00",
        horaLimiteEntrada: "07:15",
        horaSaida: "11:15",
      });

      await carregarDados();
    } catch (error) {
      toast.error("Erro ao cadastrar horário.", {
        description: error instanceof Error ? error.message : "Erro inesperado.",
      });
    } finally {
      setSalvando(false);
    }
  }

  async function removerHorario(id: string) {
    try {
      await excluirHorario(id);
      toast.success("Horário removido com sucesso.");
      await carregarDados();
    } catch (error) {
      toast.error("Erro ao remover horário.", {
        description: error instanceof Error ? error.message : "Erro inesperado.",
      });
    }
  }

  function formatarDiaSemana(dia: DiaSemana) {
    return diasSemana.find((item) => item.value === dia)?.label || dia;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Horário
        </h1>
        <p className="text-gray-500">
          Defina os horários de entrada, limite de atraso e saída dos alunos.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-green-700" />
              Novo Horário
            </CardTitle>
            <CardDescription>
              Selecione um aluno e defina o horário.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={salvarHorario} className="space-y-4">

              {/* Seleção de aluno */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Aluno
                </label>
                <select
                  className={SELECT_CLASS}
                  value={alunoSelecionado?.matricula ?? ""}
                  onChange={(e) => selecionarAluno(e.target.value)}
                  required
                >
                  <option value="">Selecione um aluno</option>
                  {alunos.map((aluno) => (
                    <option key={aluno.id} value={aluno.matricula}>
                      {aluno.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Info do aluno selecionado */}
              {alunoSelecionado && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                  <UserCheck className="h-4 w-4 shrink-0 text-green-600" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-green-800">
                      {alunoSelecionado.nome}
                    </p>
                    <p className="text-xs text-green-600">
                      Mat: {alunoSelecionado.matricula} · Turma: {alunoSelecionado.turma}
                    </p>
                  </div>
                </div>
              )}

              {/* Dia da semana */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Dia da semana
                </label>
                <select
                  className={SELECT_CLASS}
                  value={formulario.diaSemana}
                  onChange={(e) =>
                    setFormulario({ ...formulario, diaSemana: e.target.value as DiaSemana })
                  }
                >
                  {diasSemana.map((dia) => (
                    <option key={dia.value} value={dia.value}>
                      {dia.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Horários */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Entrada
                  </label>
                  <Input
                    type="time"
                    value={formulario.horaEntrada}
                    onChange={(e) =>
                      setFormulario({ ...formulario, horaEntrada: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Limite
                  </label>
                  <Input
                    type="time"
                    value={formulario.horaLimiteEntrada}
                    onChange={(e) =>
                      setFormulario({ ...formulario, horaLimiteEntrada: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Saída
                  </label>
                  <Input
                    type="time"
                    value={formulario.horaSaida}
                    onChange={(e) =>
                      setFormulario({ ...formulario, horaSaida: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={salvando || !alunoSelecionado}>
                {salvando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Horário
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Horários cadastrados</CardTitle>
            <CardDescription>
              Lista de regras de entrada e saída por aluno.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {carregando ? (
              <div className="flex items-center justify-center py-10 text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Carregando horários...
              </div>
            ) : horarios.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
                Nenhum horário cadastrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Aluno</th>
                      <th className="px-4 py-3">Turma</th>
                      <th className="px-4 py-3">Dia</th>
                      <th className="px-4 py-3">Turno</th>
                      <th className="px-4 py-3">Entrada</th>
                      <th className="px-4 py-3">Limite</th>
                      <th className="px-4 py-3">Saída</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {horarios.map((horario) => (
                      <tr
                        key={horario.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {horario.nome}
                          </div>
                          <div className="text-xs text-gray-500">
                            {horario.matricula}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {horario.turma}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variante="secundario">
                            {formatarDiaSemana(horario.diaSemana)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              turnoDoHorario(horario.horaEntrada) === "matutino"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {turnoDoHorario(horario.horaEntrada) === "matutino"
                              ? "Matutino"
                              : "Vespertino"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {horario.horaEntrada}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {horario.horaLimiteEntrada}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {horario.horaSaida}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variante="contorno"
                            tamanho="pequeno"
                            onClick={() => removerHorario(horario.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
