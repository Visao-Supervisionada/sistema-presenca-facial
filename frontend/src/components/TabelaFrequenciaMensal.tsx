import { useState } from 'react';
import { CheckCircle2, Clock, ClipboardList, XCircle } from 'lucide-react';
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

function obterDiasLetivos(mes: number, ano: number): string[] {
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const dias: string[] = [];

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const diaSemana = new Date(`${dataStr}T00:00:00`).getDay();
    if (diaSemana !== 0 && diaSemana !== 6) {
      dias.push(dataStr);
    }
  }

  return dias;
}

function CelulaStatus({
  status,
  onJustificar,
  isHoje,
}: {
  status: StatusPresencaMensal;
  onJustificar?: () => void;
  isHoje: boolean;
}) {
  const base = `flex flex-col items-center justify-center gap-0.5 rounded p-1 min-h-[3rem] ${isHoje ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`;

  if (status === 'presente') {
    return (
      <div className={base}>
        <CheckCircle2 className="h-5 w-5 text-green-600" />
      </div>
    );
  }

  if (status === 'atrasado') {
    return (
      <div className={base}>
        <Clock className="h-5 w-5 text-orange-500" />
      </div>
    );
  }

  if (status === 'justificado') {
    return (
      <div className={base}>
        <ClipboardList className="h-5 w-5 text-yellow-500" />
      </div>
    );
  }

  if (status === 'falta') {
    return (
      <div className={base}>
        <XCircle className="h-5 w-5 text-red-600" />
        {onJustificar && (
          <button
            type="button"
            onClick={onJustificar}
            className="text-[10px] leading-tight text-blue-600 underline hover:text-blue-800"
          >
            Justificar
          </button>
        )}
      </div>
    );
  }

  return <div className={`${base} text-gray-300 text-xs`}>—</div>;
}

export default function TabelaFrequenciaMensal({ alunos, mes, ano, onJustificar }: Props) {
  const [modalAberto, setModalAberto] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<{ alunoId: string; nome: string; turma: string; data: string } | null>(null);

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

  if (alunos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
        Nenhum aluno encontrado para exibir a frequência mensal.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left text-xs">
          <thead className="border-b bg-gray-50 text-gray-500 uppercase">
            <tr>
              <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 font-semibold min-w-[160px]">
                Aluno
              </th>
              {diasLetivos.map((data) => {
                const dia = Number(data.slice(8, 10));
                const isHoje = data === hoje;
                return (
                  <th
                    key={data}
                    className={`px-2 py-3 text-center font-semibold min-w-[3rem] ${isHoje ? 'bg-blue-100 text-blue-700' : ''}`}
                  >
                    {dia}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {alunos.map((aluno, idx) => (
              <tr
                key={aluno.alunoId}
                className={`border-b last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                <td className="sticky left-0 z-10 px-4 py-2 bg-inherit">
                  <div className="font-medium text-gray-900 text-sm truncate max-w-[150px]" title={aluno.nome}>
                    {aluno.nome}
                  </div>
                  <div className="text-gray-400">{aluno.matricula}</div>
                </td>

                {diasLetivos.map((data) => {
                  const presenca = aluno.dias[data];
                  const status: StatusPresencaMensal = presenca?.status ?? 'pendente';
                  const isHoje = data === hoje;

                  return (
                    <td key={data} className={`px-1 py-1 text-center ${isHoje ? 'bg-blue-50' : ''}`}>
                      <CelulaStatus
                        status={status}
                        isHoje={isHoje}
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

      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-600" /> Presente</span>
        <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-orange-500" /> Atrasado</span>
        <span className="flex items-center gap-1"><XCircle className="h-4 w-4 text-red-600" /> Falta</span>
        <span className="flex items-center gap-1"><ClipboardList className="h-4 w-4 text-yellow-500" /> Justificado</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-4 w-4 rounded ring-2 ring-blue-400 bg-blue-50" /> Hoje
        </span>
      </div>

      {alunoSelecionado && (
        <ModalJustificarFalta
          aberto={modalAberto}
          nomeAluno={alunoSelecionado.nome}
          data={alunoSelecionado.data}
          onFechar={() => { setModalAberto(false); setAlunoSelecionado(null); }}
          onSalvar={handleSalvarJustificativa}
        />
      )}
    </>
  );
}
