import { useEffect, useState } from "react";
import { CalendarClock, Loader2, Plus, Trash2 } from "lucide-react";
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

const diasSemana: { label: string; value: DiaSemana }[] = [
  { label: "Domingo", value: "domingo" },
  { label: "Segunda-feira", value: "segunda" },
  { label: "Terça-feira", value: "terca" },
  { label: "Quarta-feira", value: "quarta" },
  { label: "Quinta-feira", value: "quinta" },
  { label: "Sexta-feira", value: "sexta" },
  { label: "Sábado", value: "sabado" },
];

export default function Horario() {
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [horarios, setHorarios] = useState<HorarioTipo[]>([]);

  const [formulario, setFormulario] = useState({
    matricula: "",
    nome: "",
    turma: "",
    diaSemana: "segunda" as DiaSemana,
    horaEntrada: "07:00",
    horaLimiteEntrada: "07:10",
    horaSaida: "11:30",
  });

  async function carregarHorarios() {
    try {
      setCarregando(true);

      const resultado = await listarHorarios();

      setHorarios(resultado.horarios);
    } catch (error) {
      toast.error("Erro ao carregar horários.", {
        description:
          error instanceof Error ? error.message : "Erro inesperado.",
      });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarHorarios();
  }, []);

  async function salvarHorario(evento: React.FormEvent) {
    evento.preventDefault();

    try {
      setSalvando(true);

      await criarHorario({
        matricula: formulario.matricula,
        nome: formulario.nome,
        turma: formulario.turma,
        diaSemana: formulario.diaSemana,
        horaEntrada: formulario.horaEntrada,
        horaLimiteEntrada: formulario.horaLimiteEntrada,
        horaSaida: formulario.horaSaida,
      });

      toast.success("Horário cadastrado com sucesso.");

      setFormulario({
        matricula: "",
        nome: "",
        turma: "",
        diaSemana: "segunda",
        horaEntrada: "07:00",
        horaLimiteEntrada: "07:10",
        horaSaida: "11:30",
      });

      await carregarHorarios();
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

      toast.success("Horário removido com sucesso.");

      await carregarHorarios();
    } catch (error) {
      toast.error("Erro ao remover horário.", {
        description:
          error instanceof Error ? error.message : "Erro inesperado.",
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
              Cadastre a regra de horário de um aluno.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={salvarHorario} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="nome"
                  className="text-sm font-medium text-gray-700"
                >
                  Nome do aluno
                </label>
                <Input
                  id="nome"
                  placeholder="Ex: Felipe Barbosa"
                  value={formulario.nome}
                  onChange={(evento) =>
                    setFormulario({ ...formulario, nome: evento.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="matricula"
                  className="text-sm font-medium text-gray-700"
                >
                  Matrícula
                </label>
                <Input
                  id="matricula"
                  placeholder="Ex: 21211312"
                  value={formulario.matricula}
                  onChange={(evento) =>
                    setFormulario({
                      ...formulario,
                      matricula: evento.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="turma"
                  className="text-sm font-medium text-gray-700"
                >
                  Turma
                </label>
                <Input
                  id="turma"
                  placeholder="Ex: 3º Ano A"
                  value={formulario.turma}
                  onChange={(evento) =>
                    setFormulario({ ...formulario, turma: evento.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="diaSemana"
                  className="text-sm font-medium text-gray-700"
                >
                  Dia da semana
                </label>
                <select
                  id="diaSemana"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={formulario.diaSemana}
                  onChange={(evento) =>
                    setFormulario({
                      ...formulario,
                      diaSemana: evento.target.value as DiaSemana,
                    })
                  }
                >
                  {diasSemana.map((dia) => (
                    <option key={dia.value} value={dia.value}>
                      {dia.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label
                    htmlFor="horaEntrada"
                    className="text-sm font-medium text-gray-700"
                  >
                    Entrada
                  </label>
                  <Input
                    id="horaEntrada"
                    type="time"
                    value={formulario.horaEntrada}
                    onChange={(evento) =>
                      setFormulario({
                        ...formulario,
                        horaEntrada: evento.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="horaLimiteEntrada"
                    className="text-sm font-medium text-gray-700"
                  >
                    Limite
                  </label>
                  <Input
                    id="horaLimiteEntrada"
                    type="time"
                    value={formulario.horaLimiteEntrada}
                    onChange={(evento) =>
                      setFormulario({
                        ...formulario,
                        horaLimiteEntrada: evento.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="horaSaida"
                    className="text-sm font-medium text-gray-700"
                  >
                    Saída
                  </label>
                  <Input
                    id="horaSaida"
                    type="time"
                    value={formulario.horaSaida}
                    onChange={(evento) =>
                      setFormulario({
                        ...formulario,
                        horaSaida: evento.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={salvando}>
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
