# Backend - Presença Facial

Backend em Node.js, Express e TypeScript responsável por conectar o frontend, o Firebase e a API de reconhecimento facial.

## 1. Pré-requisitos

Antes de executar o backend, é necessário ter instalado:

* Docker
* Docker Compose
* Git

Também é necessário que a API de reconhecimento facial esteja rodando em:

```text
http://localhost:8000
```

## 2. Configurar o Firebase

Crie uma pasta chamada `secrets` dentro da pasta `backend`:

```text
backend/secrets/
```

Dentro dessa pasta, coloque o arquivo `.json` gerado pelo Firebase Admin SDK.

Exemplo:

```text
backend/secrets/reconhecimentofacial-firebase-adminsdk.json
```

> A pasta `secrets/` não deve ser enviada para o GitHub.

## 3. Criar o arquivo `.env`

Dentro da pasta `backend`, crie um arquivo chamado `.env`:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
FACE_API_URL=http://host.docker.internal:8000
GOOGLE_APPLICATION_CREDENTIALS=/app/secrets/reconhecimentofacial-firebase-adminsdk.json
ENABLE_CRON=false
```

Ajuste o nome do arquivo `.json` conforme o arquivo colocado em `backend/secrets`.

A variável `ENABLE_CRON=false` mantém o fechamento automático de frequência desativado. Assim, faltas só serão registradas quando o usuário clicar manualmente nos botões de fechamento de turno ou turma.

Caso queira ativar o fechamento automático por horário, altere para:

```env
ENABLE_CRON=true
```

Opcionalmente, pode ser adicionada a variável abaixo para definir uma tolerância padrão quando um horário não tiver limite de entrada configurado:

```env
TOLERANCIA_ATRASO_MINUTOS=15
```

## 4. Executar com Docker

Entre na pasta do backend:

```powershell
cd backend
```

Suba o container:

```powershell
docker compose up --build
```

Para parar:

```powershell
docker compose down
```

Caso precise reconstruir tudo do zero:

```powershell
docker compose build --no-cache
docker compose up
```

## 5. Testar se funcionou

Abra no navegador:

```text
http://localhost:3000/health
```

Se estiver tudo certo, deve aparecer uma resposta semelhante a:

```json
{
  "status": "ok",
  "service": "backend-presenca-facial"
}
```

## 6. Rotas úteis para teste

Listar alunos:

```text
GET http://localhost:3000/api/alunos
```

Listar presenças:

```text
GET http://localhost:3000/api/presencas
```

Listar horários:

```text
GET http://localhost:3000/api/horarios
```

Verificar diário por turma e data:

```text
GET http://localhost:3000/api/diario?turma=3%C2%BA%20A&data=2026-06-10
```

Resetar frequência de um aluno em uma data:

```text
DELETE http://localhost:3000/api/presencas/resetar?matricula=2026001&data=2026-06-10
```

Essa rota remove os registros relacionados à frequência do aluno na data informada, incluindo presença, diário e justificativas, quando existirem.

## 7. Ordem correta para executar o projeto completo

Execute os serviços nesta ordem:

```text
1. API de reconhecimento facial
2. Backend
3. Frontend
```

## 8. Observação sobre a API facial

Como o backend roda dentro de um container Docker, a variável `FACE_API_URL` usa:

```env
FACE_API_URL=http://host.docker.internal:8000
```

Esse endereço permite que o container do backend acesse a API de reconhecimento facial executada na máquina local.

## 9. Problemas comuns

### `.env` não encontrado

Crie o arquivo `.env` dentro da pasta `backend`.

### Erro de Firebase

Verifique:

* se o arquivo `.json` está em `backend/secrets`;
* se o caminho em `GOOGLE_APPLICATION_CREDENTIALS` está correto;
* se o Firestore está ativado no Firebase;
* se a pasta `secrets` está sendo montada corretamente no container.

### Backend não conecta na API facial

Confirme se a API facial está rodando em:

```text
http://localhost:8000
```

E confira se o backend está usando:

```env
FACE_API_URL=http://host.docker.internal:8000
```

### Faltas sendo geradas automaticamente

Verifique se no `.env` está configurado:

```env
ENABLE_CRON=false
```

Com essa configuração, o sistema não fecha turnos automaticamente. As faltas só serão registradas pelos botões de fechamento manual.
