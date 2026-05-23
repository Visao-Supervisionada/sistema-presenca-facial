import { useState } from 'react';
import { Check, Clock, ClipboardList, X } from 'lucide-react';
import { type PresencaMensalAluno, type StatusPresencaMensal } from '@/services/diarioService';
import ModalJustificarFalta from './ModalJustificarFalta';

interface Props {
  alunos: PresencaMensalAluno[];
  mes: number;
  ano: number;
  onJustificar: (params: {
    alunoId: string;
    turma: string;
    data: string;
    justificativa: string;
  }) => Promise<void>;
}

const ABREV_DIA = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

function obterDiasLetivos(mes: number, ano: number): string[] {
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const dias: string[] = [];
  for (let dia = 1; dia <= ultimoDia; dia++) {
    const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const diaSemana = new Date(`${dataStr}T00:00:00`).getDay();
    if (diaSemana !== 0 && diaSemana !== 6) dias.push(dataStr);
  }
  return dias;
}

function IconeStatus({ status, onJustificar }: { status: StatusPresencaMensal; onJustificar?: () => void }) {
  if (status === 'presente') {
    return (
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
        <Check className="h-4 w-4 text-green-600" strokeWidth={2.5} />
      </div>
    );
  }
  if (status === 'atrasado') {
    return (
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
        <Clock className="h-4 w-4 text-orange-500" />
      </div>
    );
  }
  if (status === 'justificado') {
    return (
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
        <ClipboardList className="h-4 w-4 text-yellow-600" />
      </div>
    );
  }
  if (status === 'falta') {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
          <X className="h-4 w-4 text-red-600" strokeWidth={2.5} />
        </div>
        {onJustificar && (
          <button
            type="button"
            onClick={onJustificar}
            className="text-[10px] font-medium leading-none text-red-600 hover:text-red-800 hover:underline"
          >
            Justificar
          </button>
        )}
      </div>
    );
  }
  return <div className="mx-auto h-8 w-8 rounded-full bg-gray-200" />;
}

export default function TabelaFrequenciaMensal({ alunos, mes, ano, onJustificar }: Props) {
  const [modalAberto, setModalAberto] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<{
    alunoId: string;
    nome: string;
    turma: string;
    data: string;
  } | null>(null);

  const diasLetivos = obterDiasLetivos(mes, ano);
  const hoje = new Date().toISOString().slice(0, 10);

  function abrirModal(alunoId: string, nome: string, turma: string, data: string) {
    setAlunoSelecionado({ alunoId, nome, turma, data });
    setModalAberto(true);
  }

  async function handleSalvarJustificativa(justificativa: string) {
    if (!alunoSelecionado) return;
    await onJustificar({ ...alunoSelecionado, justificativa });
    setModalAberto(false);
    setAlunoSelecionado(null);
  }

  return (
    <>
      {/* Legenda acima da tabela */}
      <div className="mb-3 flex flex-wrap items-center gap-5 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
            <Check className="h-3 w-3 text-green-600" strokeWidth={2.5} />
          </span>
          Presente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100">
            <Clock className="h-3 w-3 text-orange-500" />
          </span>
          Atrasado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100">
            <X className="h-3 w-3 text-red-600" strokeWidth={2.5} />
          </span>
          Faltou
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100">
            <ClipboardList className="h-3 w-3 text-yellow-600" />
          </span>
          Justificado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-5 w-5 rounded-full bg-blue-100 ring-2 ring-blue-300" />
          Hoje
        </span>
      </div>

      {alunos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          Nenhum aluno encontrado. Informe a turma e clique em Carregar.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {/* Coluna fixa de aluno */}
                <th className="sticky left-0 z-10 min-w-[180px] bg-gray-50 px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Aluno
                </th>
                {diasLetivos.map((data) => {
                  const diaSemana = new Date(`${data}T00:00:00`).getDay();
                  const numDia = data.slice(8, 10);
                  const isHoje = data === hoje;
                  return (
                    <th
                      key={data}
                      className={`min-w-14 px-1 py-1 text-center font-semibold ${
                        isHoje ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-wide">
                        {ABREV_DIA[diaSemana]}
                      </div>
                      <div className="text-sm font-bold">{numDia}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {alunos.map((aluno, idx) => (
                <tr
                  key={aluno.alunoId}
                  className={`border-b border-gray-100 last:border-0 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  {/* Coluna fixa com nome */}
                  <td className="sticky left-0 z-10 min-w-[180px] bg-inherit px-4 py-3">
                    <div
                      className="max-w-[165px] truncate font-medium text-gray-900"
                      title={aluno.nome}
                    >
                      {aluno.nome}
                    </div>
                    <div className="text-gray-400">{aluno.matricula}</div>
                  </td>

                  {diasLetivos.map((data) => {
                    const presenca = aluno.dias[data];
                    const status: StatusPresencaMensal = presenca?.status ?? 'pendente';
                    const isHoje = data === hoje;

                    return (
                      <td
                        key={data}
                        className={`px-1 py-2 text-center align-middle ${isHoje ? 'bg-blue-50' : ''}`}
                      >
                        <IconeStatus
                          status={status}
                          onJustificar={
                            status === 'falta'
                              ? () => abrirModal(aluno.alunoId, aluno.nome, aluno.turma, data)
                              : undefined
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {alunoSelecionado && (
        <ModalJustificarFalta
          aberto={modalAberto}
          nomeAluno={alunoSelecionado.nome}
          data={alunoSelecionado.data}
          onFechar={() => {
            setModalAberto(false);
            setAlunoSelecionado(null);
          }}
          onSalvar={handleSalvarJustificativa}
        />
      )}
    </>
  );
}
