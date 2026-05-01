import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, School, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const navegar = useNavigate();

  function fazerLogin(evento: React.FormEvent) {
    evento.preventDefault();

    setCarregando(true);
    setMensagemErro('');

    setTimeout(() => {
      if (usuario === 'admin' && senha === 'admin') {
        localStorage.setItem('usuarioAutenticado', 'true');
        navegar('/dashboard');
      } else {
        setMensagemErro('Usuário ou senha inválidos. Use admin/admin.');
      }

      setCarregando(false);
    }, 600);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border-b-4 border-yellow-400 bg-green-100 text-green-700 shadow-sm">
          <School className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Sistema de Presença Facial</h1>
        <p className="text-sm text-gray-500">Reconhecimento facial escolar</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Acesso ao Sistema</CardTitle>
          <CardDescription className="text-center">
            Entre para acessar o painel administrativo.
          </CardDescription>
        </CardHeader>

        <form onSubmit={fazerLogin}>
          <CardContent className="space-y-4">
            {mensagemErro && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {mensagemErro}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="usuario" className="text-sm font-medium text-gray-700">
                Usuário
              </label>

              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="usuario"
                  className="pl-10"
                  placeholder="Digite seu usuário"
                  value={usuario}
                  onChange={(evento) => setUsuario(evento.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="senha" className="text-sm font-medium text-gray-700">
                Senha
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="senha"
                  type="password"
                  className="pl-10"
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(evento) => setSenha(evento.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={carregando}>
              {carregando ? 'Autenticando...' : 'Entrar'}
            </Button>

            <p className="text-center text-xs text-gray-500">
              Para testar: <strong>admin</strong> / <strong>admin</strong>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}