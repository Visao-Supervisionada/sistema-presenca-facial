import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  aberto: boolean;
  nomeAluno: string;
  data: string;
  onFechar: () => void;
  onSalvar: (justificativa: string) => Promise<void>;
}

export default function ModalJustificarFalta({ aberto, nomeAluno, data, onFechar, onSalvar }: Props) {
  const [justificativa, setJustificativa] = useState('');
  const [salvando, setSalvando] = useState(false);

  if (!aberto) return null;

  async function handleSalvar() {
    if (!justificativa.trim()) return;
    setSalvando(true);
    try {
      await onSalvar(justificativa.trim());
      setJustificativa('');
    } finally {
      setSalvando(false);
    }
  }

  function handleFechar() {
    setJustificativa('');
    onFechar();
  }

  const dataFormatada = data
    ? new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-gray-900">Justificar Falta</h2>
        <p className="mt-1 text-sm text-gray-500">
          Adicione uma justificativa para a falta do estudante.
        </p>

        <div className="mt-4 space-y-1">
          <div className="text-sm font-medium text-gray-700">{nomeAluno}</div>
          <div className="text-xs text-gray-400">{dataFormatada}</div>
        </div>

        <div className="mt-4">
          <textarea
            className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={4}
            placeholder="Digite a justificativa da falta..."
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            disabled={salvando}
          />
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <Button type="button" variante="contorno" onClick={handleFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleSalvar}
            disabled={salvando || !justificativa.trim()}
          >
            {salvando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Justificativa'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
