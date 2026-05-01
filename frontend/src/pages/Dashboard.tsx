import { AlertTriangle, Clock, UserCheck, Users, UserX } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const reconhecimentosRecentes = [
  {
    id: 1,
    nome: 'Felipe Barbosa',
    perfil: 'Aluno',
    turma: '3º Ano A',
    horario: '07:55',
    status: 'sucesso',
  },
  {
    id: 2,
    nome: 'Desconhecido',
    perfil: '-',
    turma: '-',
    horario: '07:52',
    status: 'erro',
  },
  {
    id: 3,
    nome: 'Ana Silva',
    perfil: 'Aluno',
    turma: '2º Ano A',
    horario: '07:48',
    status: 'sucesso',
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Visão geral da frequência escolar.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-green-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="mt-1 text-xs text-gray-500">Aguardando integração com backend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Presentes</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0</div>
            <p className="mt-1 text-xs text-gray-500">Hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Ausentes</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">0</div>
            <p className="mt-1 text-xs text-gray-500">Hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Atrasos</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">0</div>
            <p className="mt-1 text-xs text-gray-500">Hoje</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos Reconhecimentos</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Perfil</th>
                  <th className="px-4 py-3">Turma</th>
                  <th className="px-4 py-3">Horário</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {reconhecimentosRecentes.map((registro) => (
                  <tr key={registro.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{registro.nome}</td>
                    <td className="px-4 py-3 text-gray-500">{registro.perfil}</td>
                    <td className="px-4 py-3 text-gray-500">{registro.turma}</td>
                    <td className="px-4 py-3 text-gray-500">{registro.horario}</td>
                    <td className="px-4 py-3">
                      {registro.status === 'sucesso' ? (
                        <Badge className="bg-green-100 text-green-800">Reconhecido</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Falha
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}