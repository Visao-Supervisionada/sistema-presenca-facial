import { useState } from 'react';
import { AlertTriangle, Bell, Check, Info, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'sucesso' | 'aviso' | 'erro';
  horario: string;
  lida: boolean;
}

export default function NotificationCenter() {
  const [aberto, setAberto] = useState(false);

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([
    {
      id: '1',
      titulo: 'Sistema ativo',
      mensagem: 'O sistema de reconhecimento facial está operando normalmente.',
      tipo: 'sucesso',
      horario: 'Há 5 min',
      lida: false,
    },
    {
      id: '2',
      titulo: 'Aviso de atraso',
      mensagem: 'Um aluno chegou após o horário limite.',
      tipo: 'aviso',
      horario: 'Há 15 min',
      lida: false,
    },
  ]);

  const totalNaoLidas = notificacoes.filter((notificacao) => !notificacao.lida).length;

  function marcarTodasComoLidas() {
    setNotificacoes((notificacoesAtuais) =>
      notificacoesAtuais.map((notificacao) => ({
        ...notificacao,
        lida: true,
      })),
    );
  }

  function marcarComoLida(id: string) {
    setNotificacoes((notificacoesAtuais) =>
      notificacoesAtuais.map((notificacao) =>
        notificacao.id === id
          ? {
              ...notificacao,
              lida: true,
            }
          : notificacao,
      ),
    );
  }

  function removerNotificacao(id: string) {
    setNotificacoes((notificacoesAtuais) =>
      notificacoesAtuais.filter((notificacao) => notificacao.id !== id),
    );
  }

  function obterClassesDoIcone(tipo: Notificacao['tipo']) {
    if (tipo === 'sucesso') {
      return 'bg-green-100 text-green-600';
    }

    if (tipo === 'aviso') {
      return 'bg-yellow-100 text-yellow-600';
    }

    if (tipo === 'erro') {
      return 'bg-red-100 text-red-600';
    }

    return 'bg-blue-100 text-blue-600';
  }

  function renderizarIcone(tipo: Notificacao['tipo']) {
    if (tipo === 'sucesso') {
      return <Check className="h-3.5 w-3.5" />;
    }

    if (tipo === 'aviso') {
      return <AlertTriangle className="h-3.5 w-3.5" />;
    }

    if (tipo === 'erro') {
      return <X className="h-3.5 w-3.5" />;
    }

    return <Info className="h-3.5 w-3.5" />;
  }

  return (
    <div className="relative">
      <Button
        variante="fantasma"
        tamanho="icone"
        className="relative rounded-full"
        onClick={() => setAberto(!aberto)}
      >
        <Bell className="h-5 w-5 text-gray-600" />

        {totalNaoLidas > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {totalNaoLidas}
          </span>
        )}
      </Button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} />

          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-4">
              <h3 className="font-bold text-gray-900">Notificações</h3>

              {totalNaoLidas > 0 && (
                <button
                  type="button"
                  onClick={marcarTodasComoLidas}
                  className="text-xs font-medium text-green-700 hover:text-green-800"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            <div className="max-h-100 overflow-y-auto">
              {notificacoes.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="mx-auto mb-2 h-8 w-8 opacity-20" />
                  <p className="text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notificacoes.map((notificacao) => (
                    <div
                      key={notificacao.id}
                      className={cn(
                        'group relative flex cursor-pointer gap-3 p-4 transition-colors hover:bg-gray-50',
                        !notificacao.lida && 'bg-green-50/30',
                      )}
                      onClick={() => marcarComoLida(notificacao.id)}
                    >
                      <div
                        className={cn(
                          'mt-1 h-fit rounded-full p-1.5',
                          obterClassesDoIcone(notificacao.tipo),
                        )}
                      >
                        {renderizarIcone(notificacao.tipo)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex items-center justify-between">
                          <p
                            className={cn(
                              'truncate text-sm font-semibold text-gray-900',
                              !notificacao.lida && 'text-green-900',
                            )}
                          >
                            {notificacao.titulo}
                          </p>

                          {!notificacao.lida && (
                            <span className="h-2 w-2 rounded-full bg-green-600" />
                          )}
                        </div>

                        <p className="mb-1 line-clamp-2 text-xs text-gray-600">
                          {notificacao.mensagem}
                        </p>

                        <span className="text-[10px] font-medium text-gray-400">
                          {notificacao.horario}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(evento) => {
                          evento.stopPropagation();
                          removerNotificacao(notificacao.id);
                        }}
                        className="absolute right-2 top-2 p-1 text-gray-300 opacity-0 transition-opacity hover:text-gray-500 group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 bg-gray-50/50 p-3 text-center">
              <button
                type="button"
                className="text-xs font-bold text-gray-500 hover:text-gray-700"
              >
                Ver todo o histórico
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}