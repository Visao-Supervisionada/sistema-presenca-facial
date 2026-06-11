# Frontend - Presença Facial

Frontend em React, TypeScript e Vite utilizado como interface web do sistema de reconhecimento facial.

## 1. Pré-requisitos

Antes de executar o frontend, é necessário ter instalado:

* Docker
* Docker Compose
* Git

Também é necessário que o backend esteja rodando em:

```text
http://localhost:3000
```

## 2. Criar o arquivo `.env`

Dentro da pasta `frontend`, crie um arquivo chamado `.env`:

```env
VITE_BACKEND_URL=http://localhost:3000
```

Essa variável define o endereço do backend usado pelo frontend.

> O frontend não precisa acessar diretamente a API de reconhecimento facial. A comunicação com a API facial é feita pelo backend.

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

## 4. Executar sem Docker

Também é possível executar localmente com Node.js:

```powershell
cd frontend
npm install
npm run dev
```

O sistema ficará disponível em:

```text
http://localhost:5173
```

Para gerar a build de produção:

```powershell
npm run build
```

Para verificar erros de TypeScript:

```powershell
npm run lint
```

## 5. Acessar o sistema

Abra no navegador:

```text
http://localhost:5173
```

## 6. Login de teste

Use as credenciais abaixo:

```text
Usuário: admin
Senha: admin
```

## 7. Fluxo básico de uso

### 1. Cadastrar aluno

Acesse a tela **Cadastro**.

Preencha os dados do aluno:

* nome;
* matrícula;
* turma;
* perfil;
* imagem facial pela câmera.

Depois clique em **Salvar Cadastro**.

### 2. Verificar cadastro

Confira se o aluno foi salvo no backend:

```text
http://localhost:3000/api/alunos
```

Também é possível conferir se a face foi cadastrada na API facial:

```text
http://localhost:8000/people
```

A matrícula do aluno no backend precisa ser igual ao campo `registration` na API facial.

Exemplo:

```text
matricula: 2026001
registration: 2026001
```

### 3. Cadastrar horários

Acesse a tela **Horário**.

É possível cadastrar horários para:

* um aluno específico;
* vários alunos selecionados;
* uma turma inteira;
* todos os alunos.

Informe:

* dia da semana;
* horário de entrada;
* limite de entrada;
* horário de saída.

### 4. Testar reconhecimento facial

Acesse a tela **Reconhecimento**.

Permita o uso da câmera no navegador.

O sistema deve exibir:

* caixa no rosto detectado;
* nome do aluno reconhecido;
* matrícula;
* confiança;
* evento de presença registrado.

O reconhecimento respeita os horários cadastrados. Caso o aluno esteja fora da janela de horário ou sem horário cadastrado, o sistema exibe o aviso correspondente.

### 5. Acompanhar o Diário Digital

Acesse a tela **Diário Digital**.

Informe:

* turma;
* data.

Depois clique em **Carregar**.

Nessa tela é possível acompanhar os registros do dia e usar ações como:

* confirmar entrada;
* confirmar saída;
* marcar falta;
* fechar turno ou turma.

### 6. Consultar frequência

Acesse a tela **Frequência**.

A frequência mensal mostra os status dos alunos:

```text
Verde   → presente
Laranja → atrasado
Vermelho → falta
Amarelo → justificado
Cinza   → pendente/sem registro
```

A falta só aparece quando existe registro real no diário, normalmente após o fechamento manual de turma ou turno.

### 7. Consultar relatórios

Acesse a tela **Relatórios** para visualizar os dados consolidados de frequência dos alunos.

## 8. Ordem correta para executar o projeto completo

Execute os serviços nesta ordem:

```text
1. API de reconhecimento facial
2. Backend
3. Frontend
```

## 9. Problemas comuns

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

Também confira se o `.env` do frontend está apontando para:

```env
VITE_BACKEND_URL=http://localhost:3000
```

### Câmera não aparece

Verifique se o navegador permitiu o acesso à câmera.

Também confira se está acessando o sistema por:

```text
http://localhost:5173
```

### Aluno reconhecido aparece como não encontrado

Confira se a matrícula é igual no backend e na API facial:

```text
http://localhost:3000/api/alunos
http://localhost:8000/people
```

Exemplo correto:

```text
matricula: 2026001
registration: 2026001
```

### Reconhecimento funciona, mas não registra presença

Verifique:

* se o aluno possui horário cadastrado para o dia atual;
* se o horário de entrada, limite e saída estão corretos;
* se o backend está rodando;
* se a API facial está rodando;
* se a matrícula reconhecida é igual à matrícula cadastrada no Firebase.

### Frequência aparece como pendente

Isso significa que não existe registro salvo no diário para aquele aluno e data. Para gerar falta, use o botão de fechamento manual de turma ou turno.
