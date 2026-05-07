# Backend — Presença Facial

Backend em Node.js + Express + TypeScript usado para conectar o frontend, Firebase e API de reconhecimento facial.

## 1. Pré-requisitos

Antes de executar, deixe instalado:

- Docker
- Docker Compose
- Git

Também é necessário que a API de reconhecimento facial esteja rodando em:

```text
http://localhost:8000
```

## 2. Configurar o Firebase

Crie uma pasta chamada `secrets` dentro do backend:

```text
backend/secrets/
```

Coloque dentro dela o arquivo `.json` gerado pelo Firebase Admin SDK.

Exemplo:

```text
backend/secrets/reconhecimentofacial-firebase-adminsdk.json
```

> Não envie a pasta `secrets/` para o GitHub.

## 3. Criar o arquivo `.env`

Dentro da pasta `backend`, crie um arquivo chamado `.env`:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
FACE_API_URL=http://host.docker.internal:8000
GOOGLE_APPLICATION_CREDENTIALS=/app/secrets/reconhecimentofacial-firebase-adminsdk.json
```

Ajuste o nome do arquivo `.json` conforme o arquivo que você colocou em `backend/secrets`.

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

## 5. Testar se funcionou

Abra no navegador:

```text
http://localhost:3000/health
```

Se estiver tudo certo, deve aparecer uma resposta com:

```json
{
  "status": "ok",
  "service": "backend-presenca-facial"
}
```

## 6. Rotas úteis para teste

Listar alunos:

```text
http://localhost:3000/api/alunos
```

Listar presenças:

```text
http://localhost:3000/api/presencas
```

Listar horários:

```text
http://localhost:3000/api/horarios
```

Verificar diário:

```text
http://localhost:3000/api/diario?turma=3%C2%BA%20A&data=2026-05-06
```


## 7. Ordem correta para executar o projeto completo

Execute nesta ordem:

```text
1. API de reconhecimento facial
2. Backend
3. Frontend
```

## 9. Problemas comuns

### `.env` não encontrado

Crie o arquivo `.env` dentro da pasta `backend`.

### Erro de Firebase

Verifique:

- se o arquivo `.json` está em `backend/secrets`;
- se o caminho em `GOOGLE_APPLICATION_CREDENTIALS` está correto;
- se o Firestore está ativado no Firebase.

### Backend não conecta na API facial

Confirme se a API facial está rodando em:

```text
http://localhost:8000
```

E confira se o backend está usando:

```env
FACE_API_URL=http://host.docker.internal:8000
```
