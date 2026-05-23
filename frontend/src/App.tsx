import { Toaster } from 'sonner';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import MainLayout from '@/layouts/MainLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Registration from '@/pages/Registration';
import Recognition from '@/pages/Recognition';
import Reports from '@/pages/Reports';
import Horario from '@/pages/Horario';
import DiarioDigital from '@/pages/DiarioDigital';
import FrequenciaDigital from '@/pages/FrequenciaDigital';
import ObjetosConhecimento from '@/pages/ObjetosConhecimento';
import Avaliacoes from '@/pages/Avaliacoes';
import NotasParciais from '@/pages/NotasParciais';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const estaAutenticado =
    localStorage.getItem('isAuthenticated') === 'true' ||
    localStorage.getItem('usuarioAutenticado') === 'true';

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />

      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="diario">
            <Route index element={<DiarioDigital />} />
            <Route path="frequencia" element={<FrequenciaDigital />} />
            <Route path="objetos-conhecimento" element={<ObjetosConhecimento />} />
            <Route path="avaliacoes" element={<Avaliacoes />} />
            <Route path="notas-parciais" element={<NotasParciais />} />
          </Route>

          <Route path="horario" element={<Horario />} />
          <Route path="registration" element={<Registration />} />
          <Route path="recognition" element={<Recognition />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
