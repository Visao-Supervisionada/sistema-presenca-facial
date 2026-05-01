import { useState } from 'react';
import { FileSpreadsheet, FileText, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const relatoriosMockados = [
  {
    id: '1',
    data: '2026-04-27',
    nome: 'Felipe Barbosa',
    perfil: 'Aluno',
    turma: '3º Ano A',
    horario: '07:15',
    status: 'Presente',
  },
  {
    id: '2',
    data: '2026-04-27',
    nome: 'Desconhecido',
    perfil: '-',
    turma: '-',
    horario: '07:22',
    status: 'Falha',
  },
  {
    id: '3',
    data: '2026-04-27',
    nome: 'Ana Silva',
    perfil: 'Aluno',
    turma: '2º Ano A',
    horario: '07:30',
    status: 'Presente',
  },
];

export default function Reports() {
  const [termoBusca, setTermoBusca] = useState('');

  const relatoriosFiltrados = relatoriosMockados.filter((relatorio) =>
    relatorio.nome.toLowerCase().includes(termoBusca.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Relatórios</h1>
          <p className="text-gray-500">Consulte registros de frequência e reconhecimento.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>

          <Button variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
            Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busque por nome ou registro.</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por nome"
              className="pl-9"
              value={termoBusca}
              onChange={(evento) => setTermoBusca(evento.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {relatoriosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                relatoriosFiltrados.map((relatorio) => (
                  <TableRow key={relatorio.id}>
                    <TableCell>{new Date(relatorio.data).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="font-medium">{relatorio.nome}</TableCell>
                    <TableCell>{relatorio.perfil}</TableCell>
                    <TableCell>{relatorio.turma}</TableCell>
                    <TableCell>{relatorio.horario}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          relatorio.status === 'Presente'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {relatorio.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}