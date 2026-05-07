# Frontend — Presença Facial

Frontend em React + TypeScript + Vite para o sistema de presença facial.

## 1. Pré-requisitos

Antes de executar, deixe instalado:

- Docker
- Docker Compose
- Git

Também é necessário que o backend esteja rodando em:

```text
http://localhost:3000
```

## 2. Criar o arquivo `.env`

Dentro da pasta `frontend`, crie um arquivo chamado `.env`:

```env
VITE_BACKEND_URL=http://localhost:3000
```

## 3. Executar com Docker

Entre na pasta do frontend:

```powershell
cd frontend
```

Suba o container:

```powershell
docker compose up --build
```

Para parar:

```powershell
docker compose down
```

## 4. Acessar o sistema

Abra no navegador:

```text
http://localhost:5173
```

## 5. Login de teste

Use:

```text
Usuário: admin
Senha: admin
```

## 6. Fluxo básico de teste

### 1. Cadastrar aluno

Acesse a tela **Cadastro**.

Preencha:

- nome;
- matrícula;
- turma;
- perfil;
- imagem facial pela câmera.

Depois clique em **Salvar Cadastro**.

### 2. Verificar se cadastrou

Confira no navegador:

```text
http://localhost:3000/api/alunos
```

E confira também na API facial:

```text
http://localhost:8000/people
```

A matrícula do aluno precisa ser igual nos dois lugares.

### 3. Testar reconhecimento

Acesse a tela **Reconhecimento**.

Permita o uso da câmera.

O sistema deve mostrar:

- caixa no rosto;
- nome do aluno;
- confiança;
- log de reconhecimento.

### 4. Cadastrar horário

Acesse a tela **Horário**.

Cadastre:

- matrícula;
- nome;
- turma;
- dia da semana;
- horário de entrada;
- limite de atraso;
- horário de saída.

### 5. Usar Diário Digital

Acesse a tela **Diário Digital**.

Informe:

- turma;
- data.

Depois clique em **Carregar**.

Use os botões para:

- confirmar entrada;
- confirmar saída;
- marcar falta.

## 7. Ordem correta para executar o projeto completo

Execute nesta ordem:

```text
1. API de reconhecimento facial
2. Backend
3. Frontend
```

## 8. Problemas comuns

### `.env` não encontrado

Crie o arquivo `.env` dentro da pasta `frontend`:

```env
VITE_BACKEND_URL=http://localhost:3000
```

### Login não entra

Confira se está usando:

```text
admin
admin
```

### Frontend não conecta no backend

Confirme se o backend está rodando:

```text
http://localhost:3000/health
```

### Câmera não aparece

Verifique se o navegador permitiu acesso à câmera.

### Aluno reconhecido aparece como não encontrado

Confira se a matrícula é igual em:

```text
http://localhost:3000/api/alunos
http://localhost:8000/people
```

Exemplo correto:

```text
matricula: 0001
registration: 0001
```
