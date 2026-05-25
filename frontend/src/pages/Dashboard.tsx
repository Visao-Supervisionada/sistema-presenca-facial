import { AlertTriangle, Clock, UserCheck, Users, UserX } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Aluno } from '../services/alunosService';
import { useState, useEffect, use } from 'react';
import { listarAlunos } from '@/services/alunosService';


export default function Dashboard() {

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [presente, setPresente] = useState(0);
  const [ausente, setAusente] = useState(0);
  const [atraso, setAtraso] = useState(0);

  useEffect(() => {
    async function carregarAlunos() {
      try {
        const response = await listarAlunos();
        setAlunos(response.alunos);
      } catch (error) {
        console.error('Erro ao buscar alunos:', error);
      }
    }

    carregarAlunos();
  }, []);

  useEffect(() => {
    const hoje = new Date();
    const presentesHoje = alunos.filter(aluno => aluno.ativo === true && new Date(aluno.data).toLocaleDateString() === hoje.toLocaleDateString()).length; 
    const ausentesHoje = alunos.filter(aluno => aluno.ativo === false && new Date(aluno.data).toDateString() === hoje.toDateString()).length;
    const atrasosHoje = alunos.filter(aluno => aluno.ativo === true && new Date(aluno.data).toDateString() === hoje.toDateString() && new Date(aluno.data).getHours() > 8).length;

    setPresente(presentesHoje);
    setAusente(ausentesHoje);
    setAtraso(atrasosHoje);
  }, [alunos]);




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
            <div className="text-2xl font-bold">{alunos.length}</div>
            <p className="mt-1 text-xs text-gray-500">{alunos.length} alunos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Presentes</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{presente}</div>
            <p className="mt-1 text-xs text-gray-500">presentes hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Ausentes</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{ausente}</div>
            <p className="mt-1 text-xs text-gray-500">ausentes hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Atrasos</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{atraso}</div>
            <p className="mt-1 text-xs text-gray-500">atrasos hoje</p>
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
                  <th className="px-4 py-3">Turno</th>
                  <th className="px-4 py-3">Horário</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {alunos.map((registro) => (
                  <tr key={registro.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{registro.nome}</td>
                    <td className="px-4 py-3 text-gray-500">{registro.perfil}</td>
                    <td className="px-4 py-3 text-gray-500">{registro.turma}</td>
                    <td className="px-4 py-3 text-gray-500">{registro.turno}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(registro.data).toLocaleTimeString()}</td>
                    <td className="px-4 py-3">
                      {registro.ativo === true ? (
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