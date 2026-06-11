import { useEffect, useState, type FormEvent } from "react";
import {
  CalendarClock,
  Loader2,
  Plus,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
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

const DIAS_SEMANA: { label: string; value: DiaSemana }[] = [
  { label: "Seg", value: "segunda" },
  { label: "Ter", value: "terca" },
  { label: "Qua", value: "quarta" },
  { label: "Qui", value: "quinta" },
  { label: "Sex", value: "sexta" },
  { label: "Sáb", value: "sabado" },
];

const DIAS_LABEL: Record<DiaSemana, string> = {
  domingo: "Domingo",
  segunda: "Segunda-feira",
  terca: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sábado",
};

const HORARIOS_TURNO = {
  matutino: {
    horaEntrada: "07:00",
    horaLimiteEntrada: "07:15",
    horaSaida: "11:15",
  },
  vespertino: {
    horaEntrada: "13:00",
    horaLimiteEntrada: "13:15",
    horaSaida: "17:15",
  },
  noturno: {
    horaEntrada: "19:00",
    horaLimiteEntrada: "19:15",
    horaSaida: "22:15",
  },
};

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

type Turno = "matutino" | "vespertino" | "noturno";
type ModoAplicacao = "alunos" | "turma" | "todos";

export default function Horario() {
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [horarios, setHorarios] = useState<HorarioTipo[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);

  const [modoAplicacao, setModoAplicacao] =
    useState<ModoAplicacao>("alunos");

  const [matriculasSelecionadas, setMatriculasSelecionadas] = useState<
    string[]
  >([]);

  const [turmaSelecionada, setTurmaSelecionada] = useState("");

  const [turno, setTurno] = useState<Turno>("matutino");

  const [diasSelecionados, setDiasSelecionados] = useState<DiaSemana[]>([
    "segunda",
    "terca",
    "quarta",
    "quinta",
    "sexta",
  ]);

  const [horarioForm, setHorarioForm] = useState(HORARIOS_TURNO.matutino);

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
        description:
          error instanceof Error ? error.message : "Erro inesperado.",
      });
    } finally {
      setCarregando(false);
    }
  }

  function obterTurmas() {
    return Array.from(
      new Set(alunos.map((aluno) => aluno.turma).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
  }

  function obterAlunosDestino() {
    if (modoAplicacao === "todos") {
      return alunos;
    }

    if (modoAplicacao === "turma") {
      return alunos.filter((aluno) => aluno.turma === turmaSelecionada);
    }

    return alunos.filter((aluno) =>
      matriculasSelecionadas.includes(aluno.matricula),
    );
  }

  function alterarModoAplicacao(novoModo: ModoAplicacao) {
    setModoAplicacao(novoModo);
    setMatriculasSelecionadas([]);
    setTurmaSelecionada("");
  }

  function toggleAluno(matricula: string) {
    setMatriculasSelecionadas((matriculasAtuais) =>
      matriculasAtuais.includes(matricula)
        ? matriculasAtuais.filter((item) => item !== matricula)
        : [...matriculasAtuais, matricula],
    );
  }

  function selecionarTodosAlunos() {
    setMatriculasSelecionadas(alunos.map((aluno) => aluno.matricula));
  }

  function limparAlunosSelecionados() {
    setMatriculasSelecionadas([]);
  }

  function selecionarTurno(novoTurno: Turno) {
    setTurno(novoTurno);
    setHorarioForm(HORARIOS_TURNO[novoTurno]);
  }

  function toggleDia(dia: DiaSemana) {
    setDiasSelecionados((diasAtuais) =>
      diasAtuais.includes(dia)
        ? diasAtuais.filter((item) => item !== dia)
        : [...diasAtuais, dia],
    );
  }

  function turnoDoHorario(horaEntrada: string): Turno {
    if (horaEntrada < "12:00") return "matutino";
    if (horaEntrada >= "18:00") return "noturno";
    return "vespertino";
  }

  async function salvarHorario(evento: FormEvent) {
    evento.preventDefault();

    const alunosDestino = obterAlunosDestino();

    if (alunosDestino.length === 0) {
      toast.error("Selecione pelo menos um aluno.");
      return;
    }

    if (diasSelecionados.length === 0) {
      toast.error("Selecione pelo menos um dia da semana.");
      return;
    }

    try {
      setSalvando(true);

      await Promise.all(
        alunosDestino.flatMap((aluno) =>
          diasSelecionados.map((dia) =>
            criarHorario({
              matricula: aluno.matricula,
              nome: aluno.nome,
              turma: aluno.turma,
              diaSemana: dia,
              horaEntrada: horarioForm.horaEntrada,
              horaLimiteEntrada: horarioForm.horaLimiteEntrada,
              horaSaida: horarioForm.horaSaida,
            }),
          ),
        ),
      );

      const totalHorarios = alunosDestino.length * diasSelecionados.length;

      toast.success(`${totalHorarios} horário(s) cadastrado(s).`, {
        description:
          alunosDestino.length === 1
            ? `Aluno: ${alunosDestino[0].nome}`
            : `${alunosDestino.length} aluno(s) incluído(s).`,
      });

      setModoAplicacao("alunos");
      setMatriculasSelecionadas([]);
      setTurmaSelecionada("");
      setTurno("matutino");
      setHorarioForm(HORARIOS_TURNO.matutino);
      setDiasSelecionados(["segunda", "terca", "quarta", "quinta", "sexta"]);

      await carregarDados();
    } catch (error) {
      toast.error("Erro ao cadastrar horário.", {
        description:
          error instanceof Error ? error.message : "Erro inesperado.",
      });
    } finally {
      setSalvando(false);
    }
  }

  async function removerHorario(id: string) {
    try {
      await excluirHorario(id);

      toast.success("Horário removido.", {
        description: "A frequência do dia também será limpa quando aplicável.",
      });

      await carregarDados();
    } catch (error) {
      toast.error("Erro ao remover horário.", {
        description:
          error instanceof Error ? error.message : "Erro inesperado.",
      });
    }
  }

  const turmas = obterTurmas();
  const alunosDestino = obterAlunosDestino();
  const totalHorarios = alunosDestino.length * diasSelecionados.length;

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
              Aplique uma regra para alunos específicos, turma ou todos.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={salvarHorario} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Aplicar horário para
                </label>

                <select
                  className={SELECT_CLASS}
                  value={modoAplicacao}
                  onChange={(evento) =>
                    alterarModoAplicacao(
                      evento.target.value as ModoAplicacao,
                    )
                  }
                >
                  <option value="alunos">Aluno(s) específico(s)</option>
                  <option value="turma">Turma inteira</option>
                  <option value="todos">Todos os alunos</option>
                </select>
              </div>

              {modoAplicacao === "alunos" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Alunos
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selecionarTodosAlunos}
                        className="text-xs font-medium text-green-700 hover:underline"
                      >
                        Selecionar todos
                      </button>

                      <button
                        type="button"
                        onClick={limparAlunosSelecionados}
                        className="text-xs font-medium text-gray-500 hover:underline"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>

                  <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2">
                    {alunos.length === 0 ? (
                      <p className="px-2 py-4 text-center text-sm text-gray-500">
                        Nenhum aluno cadastrado.
                      </p>
                    ) : (
                      alunos.map((aluno) => {
                        const selecionado = matriculasSelecionadas.includes(
                          aluno.matricula,
                        );

                        return (
                          <label
                            key={aluno.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition-colors ${
                              selecionado
                                ? "border-green-300 bg-green-50"
                                : "border-gray-100 bg-white hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selecionado}
                              onChange={() => toggleAluno(aluno.matricula)}
                              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {aluno.nome}
                              </p>

                              <p className="text-xs text-gray-500">
                                Mat: {aluno.matricula} · Turma: {aluno.turma}
                              </p>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {modoAplicacao === "turma" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Turma
                  </label>

                  <select
                    className={SELECT_CLASS}
                    value={turmaSelecionada}
                    onChange={(evento) =>
                      setTurmaSelecionada(evento.target.value)
                    }
                    required
                  >
                    <option value="">Selecione uma turma</option>

                    {turmas.map((turma) => (
                      <option key={turma} value={turma}>
                        {turma}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {modoAplicacao === "todos" && (
                <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-3">
                  <Users className="h-5 w-5 shrink-0 text-blue-700" />

                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Todos os alunos ativos
                    </p>

                    <p className="text-xs text-blue-700">
                      {alunos.length} aluno(s) serão incluído(s).
                    </p>
                  </div>
                </div>
              )}

              {alunosDestino.length > 0 && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-3">
                  <div className="mb-2 flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-700" />

                    <p className="text-sm font-medium text-green-900">
                      {alunosDestino.length} aluno(s) selecionado(s)
                    </p>
                  </div>

                  <div className="max-h-24 space-y-1 overflow-y-auto">
                    {alunosDestino.slice(0, 8).map((aluno) => (
                      <p key={aluno.id} className="text-xs text-green-700">
                        {aluno.nome} · Mat: {aluno.matricula} · Turma:{" "}
                        {aluno.turma}
                      </p>
                    ))}

                    {alunosDestino.length > 8 && (
                      <p className="text-xs font-medium text-green-800">
                        +{alunosDestino.length - 8} aluno(s)
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Turno
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => selecionarTurno("matutino")}
                    className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                      turno === "matutino"
                        ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    ☀️ Matutino
                    <p className="mt-0.5 text-xs font-normal opacity-70">
                      07:00 – 11:15
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => selecionarTurno("vespertino")}
                    className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                      turno === "vespertino"
                        ? "border-blue-400 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    🌤️ Vespertino
                    <p className="mt-0.5 text-xs font-normal opacity-70">
                      13:00 – 17:15
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => selecionarTurno("noturno")}
                    className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                      turno === "noturno"
                        ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    ☾ Noturno
                    <p className="mt-0.5 text-xs font-normal opacity-70">
                      19:00 – 22:15
                    </p>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Dias da semana
                </label>

                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map((dia) => {
                    const selecionado = diasSelecionados.includes(dia.value);

                    return (
                      <button
                        key={dia.value}
                        type="button"
                        onClick={() => toggleDia(dia.value)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          selecionado
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-gray-300 bg-white text-gray-600 hover:border-green-400"
                        }`}
                      >
                        {dia.label}
                      </button>
                    );
                  })}
                </div>

                {diasSelecionados.length > 0 && (
                  <p className="text-xs text-gray-500">
                    {diasSelecionados.length} dia(s) selecionado(s)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Horários
                  <span className="ml-1 text-xs font-normal text-gray-400">
                    (ajuste se necessário)
                  </span>
                </label>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Entrada</p>

                    <Input
                      type="time"
                      value={horarioForm.horaEntrada}
                      onChange={(evento) =>
                        setHorarioForm({
                          ...horarioForm,
                          horaEntrada: evento.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Limite</p>

                    <Input
                      type="time"
                      value={horarioForm.horaLimiteEntrada}
                      onChange={(evento) =>
                        setHorarioForm({
                          ...horarioForm,
                          horaLimiteEntrada: evento.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Saída</p>

                    <Input
                      type="time"
                      value={horarioForm.horaSaida}
                      onChange={(evento) =>
                        setHorarioForm({
                          ...horarioForm,
                          horaSaida: evento.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  salvando ||
                  alunosDestino.length === 0 ||
                  diasSelecionados.length === 0
                }
              >
                {salvando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar {totalHorarios} horário(s)
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
                            {DIAS_LABEL[horario.diaSemana]}
                          </Badge>
                        </td>

                        <td className="px-4 py-3">
                          {(() => {
                            const turnoTabela = turnoDoHorario(
                              horario.horaEntrada,
                            );

                            const styles = {
                              matutino: "bg-yellow-100 text-yellow-700",
                              vespertino: "bg-blue-100 text-blue-700",
                              noturno: "bg-indigo-100 text-indigo-700",
                            };

                            const labels = {
                              matutino: "Matutino",
                              vespertino: "Vespertino",
                              noturno: "Noturno",
                            };

                            return (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[turnoTabela]}`}
                              >
                                {labels[turnoTabela]}
                              </span>
                            );
                          })()}
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