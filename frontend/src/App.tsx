import { Toaster } from 'sonner';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import MainLayout from '@/layouts/MainLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Registration from '@/pages/Registration';
import Recognition from '@/pages/Recognition';
import Reports from '@/pages/Reports';

function RotaPrivada({ children }: { children: React.ReactNode }) {
  const usuarioAutenticado = localStorage.getItem('usuarioAutenticado') === 'true';

  if (!usuarioAutenticado) {
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
            <RotaPrivada>
              <MainLayout />
            </RotaPrivada>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="registration" element={<Registration />} />
          <Route path="recognition" element={<Recognition />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}