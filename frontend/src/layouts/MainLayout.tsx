import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CalendarClock,
  Camera,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  School,
  Users,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import NotificationCenter from '@/components/NotificationCenter';

export default function MainLayout() {
  const [menuAberto, setMenuAberto] = useState(false);

  const localizacao = useLocation();
  const navegar = useNavigate();

  const itensNavegacao = [
    { nome: 'Dashboard', caminho: '/dashboard', icone: LayoutDashboard },
    { nome: 'Diário Digital', caminho: '/diario', icone: BookOpen },
    { nome: 'Horário', caminho: '/horario', icone: CalendarClock },
    { nome: 'Reconhecimento', caminho: '/recognition', icone: Camera },
    { nome: 'Cadastro', caminho: '/registration', icone: Users },
    { nome: 'Relatórios', caminho: '/reports', icone: FileText },
  ];

  function sairDoSistema() {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('usuarioAutenticado');
    navegar('/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {menuAberto && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setMenuAberto(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform border-r border-gray-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          menuAberto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
            <div className="flex items-center gap-2 text-green-700">
              <div className="rounded-md bg-yellow-400 p-1">
                <School className="h-6 w-6 text-green-900" />
              </div>
              <span className="text-lg font-bold">Presença Facial</span>
            </div>

            <button
              type="button"
              className="text-gray-500 hover:text-gray-700 lg:hidden"
              onClick={() => setMenuAberto(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
            {itensNavegacao.map((item) => {
              const paginaAtiva = localizacao.pathname === item.caminho;

              return (
                <Link
                  key={item.nome}
                  to={item.caminho}
                  onClick={() => setMenuAberto(false)}
                  className={`flex items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 text-sm font-medium transition-colors ${
                    paginaAtiva
                      ? 'border-yellow-400 bg-green-50 text-green-800'
                      : 'border-transparent text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icone
                    className={`h-5 w-5 ${paginaAtiva ? 'text-green-700' : 'text-gray-400'}`}
                  />
                  {item.nome}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-gray-200 p-4">
            <div className="mb-4 flex items-center gap-3 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-yellow-400 bg-green-100 font-bold text-green-700">
                A
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">Admin</span>
                <span className="text-xs text-gray-500">admin@escola.edu.br</span>
              </div>
            </div>

            <Button
              variante="contorno"
              className="w-full justify-start text-red-600 hover:bg-red-50"
              onClick={sairDoSistema}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
          <span className="font-bold text-green-700">Presença Facial</span>

          <div className="flex items-center gap-2">
            <NotificationCenter />
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setMenuAberto(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </header>

        <header className="hidden h-16 items-center justify-end gap-4 border-b border-gray-200 bg-white px-8 lg:flex">
          <NotificationCenter />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}