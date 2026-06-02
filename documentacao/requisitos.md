# SISTEMA DE RECONHECIMENTO FACIAL
## PARA ALUNOS DA REDE PÚBLICA DE ENSINO

**Requisitos Funcionais, Requisitos Não Funcionais e Regras de Negócio**

Documento de Especificação de Requisitos — Versão 2.0.0
Itacoatiara — Amazonas — Brasil | Junho de 2026

---

## 1. Introdução

O presente documento formaliza os Requisitos Funcionais (RF), os Requisitos Não Funcionais (RNF) e as Regras de Negócio (RN) do Sistema de Reconhecimento Facial para Alunos da Rede Pública de Ensino (SRGFA). A especificação foi elaborada com base na análise dos artefatos técnicos do projeto — arquivos de configuração Docker, código-fonte dos três serviços, histórico de branches e fluxos operacionais implementados — seguindo as boas práticas de Engenharia de Software descritas na norma IEEE 830 (Software Requirements Specification).

O SRGFA é composto por três serviços interdependentes: (i) a API de Reconhecimento Facial, em Python/FastAPI/InsightFace buffalo_l; (ii) o Backend de Negócios, em Node.js/Express/TypeScript/Firebase Firestore; e (iii) o Frontend de Apresentação, em React/TypeScript/Vite.

```
Convenção de identificadores adotada neste documento

RF-XXX  → Requisito Funcional (numerado sequencialmente por módulo)
RNF-XXX → Requisito Não Funcional (agrupado por categoria de qualidade)
RN-XXX  → Regra de Negócio (restrição ou política do domínio escolar)

Prioridade:
  ALTA  = essencial para funcionamento mínimo do sistema
  MÉDIA = importante, mas o sistema opera sem ela em modo degradado
  BAIXA = desejável; pode ser implementada em versão futura

Status de implementação (indicado na coluna Serviço quando relevante):
  [Implementado]       = funcionalidade presente na versão atual
  [Escopo futuro]      = planejado para versão subsequente
  [Organizacional]     = medida jurídica/processual fora do escopo do código-fonte
```

---

## 2. Requisitos Funcionais

### 2.1 Módulo de Autenticação e Controle de Acesso

> **Nota de implementação:** a versão atual utiliza autenticação com contexto React no frontend e sessão gerenciada em memória (sem JWT). Os requisitos RF-001 a RF-005 estão implementados com essa abordagem simplificada. A migração para JWT (tokens stateless com expiração e renovação) está planejada como escopo futuro (ver RF-005a).

| ID      | Descrição do Requisito                                                                                                                   | Serviço              | Prioridade |
|---------|------------------------------------------------------------------------------------------------------------------------------------------|----------------------|------------|
| RF-001  | O sistema deve exigir autenticação do operador (usuário e senha) antes de permitir acesso a qualquer funcionalidade protegida da interface. | Frontend / Backend [Implementado] | ALTA |
| RF-002  | O sistema deve validar as credenciais informadas, retornando mensagem de erro clara em caso de credenciais inválidas. A versão atual utiliza credenciais fixas verificadas no frontend (usuário: admin, senha: admin). Validação via Backend com persistência de usuários no Firestore é escopo futuro. | Frontend [Implementado — credenciais fixas] | ALTA |
| RF-003  | Após autenticação bem-sucedida, o sistema deve manter a sessão do operador ativa durante o uso, sem necessidade de novo login enquanto a aba do navegador estiver aberta. | Frontend [Implementado — localStorage] | ALTA |
| RF-004  | O sistema deve redirecionar automaticamente o operador não autenticado para a tela de login ao tentar acessar qualquer rota protegida da aplicação. | Frontend [Implementado] | ALTA |
| RF-005  | O sistema deve disponibilizar função de logout que encerre a sessão corrente e redirecione o operador para a tela de login. | Frontend / Backend [Implementado] | MÉDIA |
| RF-005a | O sistema deve implementar autenticação baseada em tokens JWT (JSON Web Tokens) com expiração configurável, renovação automática e invalidação no logout, substituindo o gerenciamento de sessão em memória. | Backend / Frontend [Escopo futuro] | ALTA |

### 2.2 Módulo de Cadastro de Alunos

| ID     | Descrição do Requisito                                                                                                                   | Serviço              | Prioridade |
|--------|------------------------------------------------------------------------------------------------------------------------------------------|----------------------|------------|
| RF-006 | O sistema deve permitir o cadastro de novos alunos com os seguintes dados obrigatórios: nome completo, matrícula, turma e perfil.         | Frontend / Backend   | ALTA       |
| RF-007 | O sistema deve capturar a imagem facial do aluno em tempo real por meio da câmera do dispositivo, coletando 5 fotos em ângulos distintos (frente, esquerda, direita, cima e baixo) para aumentar a robustez biométrica. | Frontend | ALTA |
| RF-008 | O sistema deve oferecer a opção de upload de imagens do dispositivo como alternativa à captura pela webcam, permitindo o cadastro remoto ou quando a câmera não estiver disponível. | Frontend | ALTA |
| RF-009 | O sistema deve enviar as imagens faciais capturadas à API de Reconhecimento Facial para extração e armazenamento dos embeddings biométricos no Firebase Firestore, associando-os à matrícula do aluno. | Backend / API Facial | ALTA |
| RF-010 | O sistema deve persistir os dados cadastrais do aluno (nome, matrícula, turma, perfil) no Firebase Firestore por meio do Backend de Negócios. | Backend | ALTA |
| RF-011 | O sistema deve garantir que a matrícula cadastrada no Backend (Firestore) seja idêntica ao campo `registration` cadastrado na API de Reconhecimento Facial, assegurando a consistência entre os dois serviços. | Backend / API Facial | ALTA |
| RF-012 | O sistema deve impedir o cadastro de duas pessoas com a mesma matrícula, exibindo mensagem de erro informativa ao operador. | Backend | ALTA |
| RF-013 | O sistema deve permitir a consulta da lista de alunos cadastrados, com exibição de nome, matrícula e turma. | Backend / Frontend | MÉDIA |
| RF-014 | O sistema deve permitir a exclusão do cadastro de um aluno, removendo tanto o registro no Firestore quanto os embeddings na API Facial. | Backend / API Facial | MÉDIA |

### 2.3 Módulo de Reconhecimento Facial

| ID     | Descrição do Requisito                                                                                                                   | Serviço              | Prioridade |
|--------|------------------------------------------------------------------------------------------------------------------------------------------|----------------------|------------|
| RF-015 | O sistema deve exibir o feed de vídeo ao vivo da câmera do dispositivo na tela de reconhecimento, com latência imperceptível ao operador. | Frontend             | ALTA       |
| RF-016 | O sistema deve capturar frames do feed de vídeo em intervalos regulares e enviá-los ao Backend para processamento de reconhecimento facial. | Frontend            | ALTA       |
| RF-017 | O sistema deve detectar e identificar simultaneamente múltiplos rostos presentes em um único frame, retornando um resultado individual para cada rosto detectado. | API Facial | ALTA |
| RF-018 | Para cada rosto reconhecido, o sistema deve exibir na interface uma caixa delimitadora (bounding box) sobreposta ao feed de vídeo, acompanhada do nome do aluno identificado e do escore de confiança. | Frontend | ALTA |
| RF-019 | O sistema deve classificar como `desconhecido` qualquer rosto cujo escore de correspondência esteja abaixo do limiar de confiança definido, sem registrar evento de presença neste caso. | API Facial | ALTA |
| RF-020 | O sistema deve verificar o horário do evento de reconhecimento em relação à grade horária cadastrada do aluno, registrando presença somente quando o reconhecimento ocorrer dentro da janela temporal permitida. | Backend | ALTA |
| RF-021 | O sistema deve registrar automaticamente um evento de entrada no Firestore e no Diário Digital quando um aluno cadastrado for reconhecido dentro da janela de entrada, com confiança acima do limiar configurado. | Backend | ALTA |
| RF-022 | O sistema deve registrar automaticamente o evento de saída quando o aluno já tiver entrada registrada no dia e o reconhecimento ocorrer dentro da janela de saída. | Backend | ALTA |
| RF-023 | O sistema deve retornar a ação `fora_da_janela` sem registrar presença quando o reconhecimento ocorrer fora das janelas de entrada e saída do aluno. | Backend | ALTA |
| RF-024 | O sistema deve retornar a ação `sem_horario` sem registrar presença quando o aluno reconhecido não possuir grade horária cadastrada para o dia da semana corrente. | Backend | ALTA |
| RF-025 | O sistema deve exibir um log de reconhecimento na tela, listando cronologicamente os eventos identificados na sessão corrente com horário, nome, ação e confiança. | Frontend | MÉDIA |

### 2.4 Módulo de Gestão de Horários

| ID     | Descrição do Requisito                                                                                                                   | Serviço              | Prioridade |
|--------|------------------------------------------------------------------------------------------------------------------------------------------|----------------------|------------|
| RF-026 | O sistema deve permitir o cadastro de horários escolares por aluno, informando: matrícula, nome, dia(s) da semana, horário de entrada, horário-limite de tolerância e horário de saída. | Frontend / Backend | ALTA |
| RF-027 | O sistema deve suportar os turnos matutino, vespertino e noturno (EJA), com identificação visual distinta por cores na interface: amarelo (matutino), azul (vespertino), índigo (noturno). | Frontend / Backend | ALTA |
| RF-028 | O sistema deve permitir a seleção de múltiplos dias da semana para um mesmo horário, evitando o cadastro repetitivo para alunos com grade uniforme. | Frontend / Backend | ALTA |
| RF-029 | O sistema deve preencher automaticamente os campos de nome a partir da matrícula selecionada no dropdown de alunos cadastrados. | Frontend | MÉDIA |
| RF-030 | O sistema deve persistir os horários cadastrados no Firebase Firestore e disponibilizá-los para consulta pelo Backend no momento do registro de presença. | Backend | ALTA |
| RF-031 | O sistema deve permitir a edição e exclusão de registros de horário previamente cadastrados. | Frontend / Backend | MÉDIA |
| RF-032 | O sistema deve listar os horários cadastrados com indicação de turno, dias da semana e horários, permitindo filtro por turno ou dia. | Frontend / Backend | MÉDIA |

### 2.5 Módulo de Diário Digital

| ID     | Descrição do Requisito                                                                                                                   | Serviço              | Prioridade |
|--------|------------------------------------------------------------------------------------------------------------------------------------------|----------------------|------------|
| RF-033 | O sistema deve disponibilizar uma tela de Diário Digital que apresente, de forma consolidada, o registro de presença de todos os alunos de uma turma em uma data selecionada. | Frontend / Backend | ALTA |
| RF-034 | O operador deve poder filtrar o diário por turma e data, carregando os registros correspondentes do Firestore via Backend. | Frontend / Backend | ALTA |
| RF-035 | O sistema deve permitir que o operador confirme manualmente a entrada de um aluno diretamente pelo Diário Digital. | Frontend / Backend | ALTA |
| RF-036 | O sistema deve permitir que o operador confirme manualmente a saída de um aluno diretamente pelo Diário Digital. | Frontend / Backend | ALTA |
| RF-037 | O sistema deve permitir que o operador registre manualmente a falta de um aluno no Diário Digital, com opção de justificativa. | Frontend / Backend | ALTA |
| RF-038 | O sistema deve exibir, para cada aluno no diário, o status consolidado de presença: Presente, Ausente, Atraso ou Saída Confirmada. | Frontend | ALTA |
| RF-039 | O sistema deve disponibilizar botões de fechamento de turno (matutino, vespertino e noturno) que consolidam o diário do dia, marcando como ausentes os alunos sem presença registrada. | Frontend / Backend | ALTA |
| RF-040 | O sistema deve executar automaticamente o fechamento de cada turno nos horários definidos (matutino: 11h15, vespertino: 17h15, noturno: 22h15), considerando o fuso horário America/Manaus. | Backend | ALTA |
| RF-041 | O sistema deve permitir a navegação entre datas no Diário Digital para consulta do histórico de presenças de uma turma. | Frontend | MÉDIA |
| RF-042 | O Diário Digital deve incluir os módulos de Objetos de Conhecimento, Avaliações com formulário e geração via IA, e Notas Parciais por bimestre. | Frontend / Backend | MÉDIA |

### 2.6 Módulo de Dashboard

| ID     | Descrição do Requisito                                                                                                                   | Serviço              | Prioridade |
|--------|------------------------------------------------------------------------------------------------------------------------------------------|----------------------|------------|
| RF-043 | O sistema deve disponibilizar um painel de controle (dashboard) com dados reais de presença do dia, exibindo: total de alunos cadastrados, número de presentes, ausentes e atrasos, e percentual de frequência. | Frontend / Backend | ALTA |
| RF-044 | O dashboard deve exibir um gráfico de barras com a frequência diária dos últimos 5 dias úteis, calculada a partir dos registros reais do Firestore. | Frontend / Backend | ALTA |
| RF-045 | O dashboard deve exibir um gráfico de distribuição (rosca) com a proporção de presentes, ausentes e atrasos no dia corrente. | Frontend | ALTA |
| RF-046 | O dashboard deve exibir uma tabela com os últimos reconhecimentos do dia, contendo nome, turma, horário de entrada, horário de saída, confiança e status. | Frontend / Backend | ALTA |
| RF-047 | O dashboard deve atualizar seus dados automaticamente a cada 30 segundos, sem necessidade de recarregamento manual da página. | Frontend | MÉDIA |
| RF-048 | O cálculo de ausentes no dashboard deve considerar apenas alunos cujo horário-limite de entrada já passou e que não possuem presença registrada no dia, evitando contagem incorreta de ausentes antes do início do turno. | Backend | ALTA |

### 2.7 Módulo de Relatórios

| ID     | Descrição do Requisito                                                                                                                   | Serviço              | Prioridade |
|--------|------------------------------------------------------------------------------------------------------------------------------------------|----------------------|------------|
| RF-049 | O sistema deve disponibilizar uma página de relatórios com o relatório de frequência por turma, exibindo o percentual de presença de cada aluno no período consultado. | Frontend / Backend | ALTA |
| RF-050 | O relatório de frequência deve incluir um resumo consolidado por turma com total de presenças, faltas e percentual geral. | Frontend / Backend | ALTA |
| RF-051 | O sistema deve permitir a exportação do relatório de frequência em formato CSV, possibilitando análise externa em planilhas. | Frontend [Escopo futuro] | MÉDIA |

### 2.8 Módulo de Integração entre Serviços

| ID     | Descrição do Requisito                                                                                                                   | Serviço              | Prioridade |
|--------|------------------------------------------------------------------------------------------------------------------------------------------|----------------------|------------|
| RF-052 | O Backend deve expor o endpoint `GET /health` retornando status, nome do serviço, URL da API facial e rotas disponíveis. | Backend | ALTA |
| RF-053 | O Backend deve se comunicar com a API Facial utilizando a variável de ambiente `FACE_API_URL`, resolvida via `host.docker.internal` dentro do contexto Docker. | Backend | ALTA |
| RF-054 | A API Facial deve expor o endpoint `GET /health` retornando modelo carregado, tipo de armazenamento, thresholds, total de pessoas indexadas e status do classificador auxiliar. | API Facial | ALTA |
| RF-056 | O sistema deve disponibilizar a documentação interativa da API Facial no endpoint `GET /docs` (Swagger UI). | API Facial | MÉDIA |

---

## 3. Requisitos Não Funcionais

### 3.1 Desempenho

| ID      | Descrição                                                                                                                   | Critério de Aceitação                                                    | Categoria    | Prio.  |
|---------|-----------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|--------------|--------|
| RNF-001 | O pipeline de reconhecimento facial deve completar-se em tempo inferior ao limiar definido para garantir experiência fluida. | Tempo de resposta ≤ 2 segundos por frame em hardware com CPU x86-64 AVX e 8 GB RAM. | Desempenho | ALTA |
| RNF-002 | O frontend deve renderizar o feed de vídeo com bounding boxes sem travamentos ou quedas de framerate perceptíveis. | Taxa de renderização ≥ 15 FPS com overlay ativo em Chrome/Edge em hardware convencional. | Desempenho | ALTA |
| RNF-003 | O Backend deve responder às requisições REST dentro de um tempo adequado para uso interativo. | Tempo de resposta ≤ 500 ms para consultas ao Firestore em condições normais de rede. | Desempenho | ALTA |
| RNF-004 | O dashboard deve carregar e exibir os dados do dia em tempo aceitável. | Carregamento inicial do dashboard ≤ 3 segundos em conexão local. | Desempenho | MÉDIA |

### 3.2 Disponibilidade e Confiabilidade

| ID      | Descrição                                                                                                                   | Critério de Aceitação                                                    | Categoria      | Prio.  |
|---------|-----------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|----------------|--------|
| RNF-005 | O sistema deve estar disponível durante todo o período de funcionamento da instituição escolar, tolerando falhas pontuais sem perda de dados registrados. | Disponibilidade ≥ 99% durante o horário escolar (7h–22h em dias letivos). | Confiabilidade | ALTA |
| RNF-006 | Os embeddings biométricos armazenados no Firebase Firestore devem ser preservados integralmente em caso de reinicialização, atualização ou recriação do contêiner da API Facial. | Após recriação do contêiner, 100% dos embeddings cadastrados devem estar disponíveis sem recadastro. | Confiabilidade | ALTA |
| RNF-007 | O sistema deve continuar operando com funcionalidades reduzidas (Diário Digital manual) caso a API de Reconhecimento Facial esteja temporariamente indisponível. | O Frontend deve exibir mensagem de indisponibilidade sem crashar, permitindo ações manuais no Diário. | Confiabilidade | MÉDIA |
| RNF-008 | O fechamento automático de turno via cron deve ser executado com precisão de fuso horário, utilizando o horário de Manaus (America/Manaus, UTC-4). | O fechamento deve ocorrer nos horários definidos (11h15, 17h15, 22h15) no horário local de Manaus, sem desvios causados por UTC. | Confiabilidade | ALTA |

### 3.3 Segurança

| ID      | Descrição                                                                                                                   | Critério de Aceitação                                                    | Categoria | Prio.  | Status |
|---------|-----------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|-----------|--------|--------|
| RNF-009 | As credenciais do Firebase Admin SDK nunca devem ser incorporadas à imagem Docker, ao repositório Git ou a qualquer log do sistema. | Inspeção do Dockerfile, .dockerignore e .gitignore confirma exclusão explícita de secrets/. | Segurança | ALTA | Implementado |
| RNF-010 | O Backend deve implementar controle de CORS, permitindo requisições apenas da origem definida na variável `FRONTEND_URL`. | Requisição cross-origin de origem não autorizada deve retornar HTTP 403. | Segurança | ALTA | Implementado |
| RNF-011 | As senhas de acesso dos operadores devem ser armazenadas com hash criptográfico seguro (bcrypt fator ≥ 10 ou Argon2), nunca em texto plano. | Inspeção dos registros no Firestore confirma ausência de senhas em texto claro. | Segurança | ALTA | **Escopo futuro** |
| RNF-012 | O arquivo de credenciais Firebase deve ser montado no contêiner como volume somente-leitura. | Configuração `:ro` no volume `./secrets:/app/secrets:ro` verificada no docker-compose.yml. | Segurança | ALTA | Implementado |
| RNF-013 | A comunicação entre os serviços deve ocorrer exclusivamente na rede interna da instituição, sem exposição direta à internet pública. | As portas 3000, 5173 e 8000 não devem ser acessíveis fora da VLAN interna. | Segurança | ALTA | Planejado (infra) |

### 3.4 Usabilidade

| ID      | Descrição                                                                                                                   | Critério de Aceitação                                                    | Categoria    | Prio.  |
|---------|-----------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|--------------|--------|
| RNF-014 | A interface deve ser responsiva e utilizável em dispositivos com telas a partir de 768px de largura. | Layout correto verificado em resoluções 768px, 1024px e 1920px usando Tailwind CSS. | Usabilidade | ALTA |
| RNF-015 | O sistema deve fornecer feedback visual imediato (notificações toast) ao operador após cada ação executada. | Notificações via Sonner em ≤ 500 ms após conclusão de cada operação, com texto claro em português. | Usabilidade | ALTA |
| RNF-016 | O sistema deve exibir indicadores visuais de carregamento durante operações assíncronas. | Operações de cadastro, reconhecimento e carregamento do diário devem exibir indicador de progresso. | Usabilidade | MÉDIA |
| RNF-017 | As mensagens de erro devem ser escritas em linguagem clara e não técnica. | Mensagens de erro não devem conter stack traces ou termos técnicos sem explicação. | Usabilidade | MÉDIA |
| RNF-018 | A tela de login deve ser acessível sem autenticação prévia, e todas as demais telas devem redirecionar para login com sessão ausente ou expirada. | Acesso direto a rotas protegidas sem sessão deve redirecionar para /login. | Usabilidade | ALTA |

### 3.5 Manutenibilidade e Portabilidade

| ID      | Descrição                                                                                                                   | Critério de Aceitação                                                    | Categoria          | Prio.  |
|---------|-----------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|--------------------|--------|
| RNF-019 | O sistema deve ser integralmente containerizado com Docker. | Execução bem-sucedida de `docker compose up --build` em host Linux (Ubuntu 22.04) e Windows (WSL2) sem modificações. | Portabilidade | ALTA |
| RNF-020 | A base de código do Backend e do Frontend deve ser escrita em TypeScript com strict mode ativado, sem erros de compilação. | Execução de `tsc --noEmit` não deve retornar erros de tipo. | Manutenibilidade | ALTA |
| RNF-021 | O Hot Module Replacement deve estar ativo no ambiente de desenvolvimento do frontend. | Alteração em qualquer arquivo .tsx deve ser refletida no navegador em ≤ 500 ms. | Manutenibilidade | MÉDIA |
| RNF-022 | O classificador de reconhecimento facial deve poder ser substituído ou retreinado de forma independente da API Facial. | Substituição do arquivo .pkl e reinicialização do contêiner devem ser suficientes para ativar o novo modelo. | Manutenibilidade | MÉDIA |
| RNF-023 | As variáveis de configuração de todos os serviços devem ser externalizadas em arquivos .env, sem valores fixos (hardcoded) no código-fonte. | Inspeção do código não deve revelar URLs, portas ou credenciais literais. | Manutenibilidade | ALTA |
| RNF-024 | O modelo InsightFace e o contexto de execução (CPU/GPU) devem ser configuráveis via variáveis de ambiente sem alteração de código. | As variáveis `FACE_MODEL_NAME`, `FACE_CTX_ID` e `FACE_DET_SIZE` devem controlar o modelo e hardware de inferência. | Manutenibilidade | ALTA |

### 3.6 Compatibilidade e Interoperabilidade

| ID      | Descrição                                                                                                                   | Critério de Aceitação                                                    | Categoria             | Prio.  |
|---------|-----------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|-----------------------|--------|
| RNF-025 | A API Facial e o Backend devem se comunicar por contratos REST/JSON estáveis e documentados. | Alteração interna na implementação da API Facial não deve exigir alteração no Backend enquanto o contrato REST for mantido. | Interoperabilidade | ALTA |
| RNF-026 | O frontend deve funcionar corretamente nos navegadores Google Chrome 110+, Microsoft Edge 110+ e Mozilla Firefox 110+. | Testes nas três versões mínimas não devem revelar falhas funcionais ou de renderização. | Compatibilidade | ALTA |
| RNF-027 | O acesso à câmera deve funcionar em contextos seguros (HTTPS ou localhost), conforme a especificação W3C da API MediaDevices/getUserMedia. | Em ambiente de produção com HTTPS, a captura de frames deve funcionar em todos os navegadores suportados. | Compatibilidade | ALTA |

---

## 4. Regras de Negócio

### 4.1 Identidade e Cadastro

| ID     | Descrição da Regra de Negócio                                                                                                | Módulo Afetado           | Prio.  |
|--------|------------------------------------------------------------------------------------------------------------------------------|--------------------------|--------|
| RN-001 | A matrícula do aluno é o único identificador de negócio no sistema. Ela deve ser idêntica no Backend (Firestore) e na API de Reconhecimento Facial (campo `registration`). | Cadastro / API Facial / Backend | ALTA |
| RN-002 | Não é permitido cadastrar dois alunos com a mesma matrícula. A matrícula é imutável após o cadastro; para corrigi-la, é necessário excluir o registro e recadastrar o aluno. | Cadastro | ALTA |
| RN-003 | O cadastro biométrico de um aluno só é considerado completo quando tanto os dados cadastrais (Firestore) quanto os embeddings faciais (API Facial/Firestore) foram armazenados com sucesso. Um cadastro parcial representa inconsistência de dados e deve ser tratado como erro. | Cadastro | ALTA |
| RN-004 | As imagens faciais utilizadas no cadastro devem conter exatamente um rosto detectável pelo InsightFace. Imagens sem rosto detectado ou com múltiplos rostos devem ser rejeitadas com mensagem informativa ao operador. | Cadastro / API Facial | ALTA |
| RN-005 | O acesso às funcionalidades de cadastro, reconhecimento e gestão de horários é restrito a operadores autenticados. Nenhuma operação que modifique dados pode ser realizada por usuários não autenticados. | Autenticação | ALTA |

### 4.2 Reconhecimento e Registro de Presença

| ID     | Descrição da Regra de Negócio                                                                                                | Módulo Afetado           | Prio.  |
|--------|------------------------------------------------------------------------------------------------------------------------------|--------------------------|--------|
| RN-006 | Somente alunos cujo escore de correspondência esteja acima do limiar de confiança configurado devem ter presença registrada automaticamente. Rostos classificados como `desconhecido` não geram registro de presença. | Reconhecimento | ALTA |
| RN-007 | O sistema não deve registrar duas presenças do tipo `entrada` para o mesmo aluno no mesmo dia. Caso o aluno seja reconhecido novamente após já ter entrada registrada, o evento deve ser ignorado ou tratado como tentativa de saída. | Reconhecimento / Backend | ALTA |
| RN-008 | O sistema só deve registrar presença quando o reconhecimento ocorrer dentro da janela temporal do horário do aluno. A janela de entrada vai de 30 minutos antes do horário de entrada até o horário de saída. A janela de saída vai do horário de saída até 30 minutos após. | Reconhecimento / Horários | ALTA |
| RN-009 | Reconhecimentos de alunos cadastrados que ocorram fora das janelas definidas devem retornar a ação `fora_da_janela` sem gerar registro de presença ou falta. | Reconhecimento | ALTA |
| RN-010 | Na ausência de grade horária cadastrada para o dia da semana corrente, o reconhecimento retorna a ação `sem_horario` sem registrar presença, evitando erros por falta de configuração. | Reconhecimento / Horários | MÉDIA |
| RN-011 | O status de presença de um aluno em um determinado dia segue a hierarquia: Ausente (estado inicial) → Atraso ou Presente (após entrada) → Saída Confirmada (após saída). Uma vez que a saída é confirmada, o registro do dia é encerrado. | Diário Digital | ALTA |
| RN-012 | Um aluno é classificado como `Presente no prazo` se o reconhecimento de entrada ocorrer até o horário-limite de tolerância definido em sua grade horária. Se ocorrer após este limite, é classificado como `Atraso`. | Reconhecimento / Horários | ALTA |
| RN-013 | O registro manual de presença pelo operador no Diário Digital tem precedência sobre o reconhecimento automático. | Diário Digital | ALTA |
| RN-014 | O sistema deve registrar, para cada evento de presença, no mínimo: matrícula do aluno, tipo do evento (entrada/saída/falta), timestamp completo (data e hora em horário local de Manaus) e a origem do registro (reconhecimento facial ou manual). | Backend / Firestore | ALTA |

### 4.3 Horários, Turnos e Grade Escolar

| ID     | Descrição da Regra de Negócio                                                                                                | Módulo Afetado           | Prio.  |
|--------|------------------------------------------------------------------------------------------------------------------------------|--------------------------|--------|
| RN-015 | Os horários cadastrados devem ser associados a um dia da semana específico (segunda a sexta-feira). O sistema não deve registrar presenças automáticas nos finais de semana. | Horários | MÉDIA |
| RN-016 | O horário de saída cadastrado deve ser posterior ao horário de entrada. O sistema deve rejeitar cadastros em que a saída seja igual ou anterior à entrada. | Horários | ALTA |
| RN-017 | O sistema deve suportar os turnos matutino (padrão: 07h30/07h45/11h00), vespertino (padrão: 13h30/13h45/17h00) e noturno EJA (padrão: 19h00/19h15/22h15). | Horários | ALTA |
| RN-018 | O fechamento automático de turno deve ser executado nos horários definidos (matutino: 11h15, vespertino: 17h15, noturno: 22h15) com base no fuso horário America/Manaus, não em UTC. | Horários / Cron | ALTA |
| RN-019 | Um aluno pode ter horários diferentes cadastrados para dias da semana distintos. O sistema deve consultar o horário do dia corrente no momento do reconhecimento. | Horários / Reconhecimento | MÉDIA |

### 4.4 Diário Digital e Relatórios

| ID     | Descrição da Regra de Negócio                                                                                                | Módulo Afetado           | Prio.  |
|--------|------------------------------------------------------------------------------------------------------------------------------|--------------------------|--------|
| RN-020 | O Diário Digital de uma turma em uma data específica deve refletir o estado consolidado de todos os alunos matriculados naquela turma, independentemente de terem sido reconhecidos ou não. | Diário Digital | ALTA |
| RN-021 | O cálculo de ausentes no dashboard deve considerar apenas alunos cujo horário-limite de entrada já passou e que não possuem presença registrada no dia, para evitar contagem incorreta de ausentes antes do início do turno. | Dashboard / Backend | ALTA |
| RN-022 | Os percentuais de frequência exibidos nos relatórios e gráficos devem ser calculados com base nos dias letivos com registro no sistema, não sobre o total de dias corridos do calendário. | Relatórios / Dashboard | MÉDIA |
| RN-023 | A exportação CSV do relatório de frequência deve conter, para cada aluno: nome, matrícula, turma, componente curricular (quando aplicável), colunas de status por dia letivo do mês (formato DD/MM), total de presenças, total de atrasos, total de faltas, total de justificadas, total de dias letivos e percentual de frequência. O arquivo é gerado com BOM UTF-8 para compatibilidade com planilhas. | Relatórios [Escopo futuro] | MÉDIA |

### 4.5 Proteção de Dados e Conformidade Legal

| ID     | Descrição da Regra de Negócio                                                                                                | Módulo Afetado           | Prio.  |
|--------|------------------------------------------------------------------------------------------------------------------------------|--------------------------|--------|
| RN-024 | O cadastro biométrico de alunos menores de 18 anos só pode ser realizado mediante comprovação de consentimento prévio, livre e informado do responsável legal, conforme o artigo 14 da LGPD (Lei nº 13.709/2018). | Cadastro / Legal | ALTA |
| RN-025 | Os embeddings biométricos armazenados no sistema são dados pessoais sensíveis e devem ser tratados com o mesmo nível de proteção exigido para dados de saúde. | API Facial / Segurança | ALTA |
| RN-026 | Ao término do vínculo escolar de um aluno, todos os seus dados biométricos (embeddings no Firestore) e dados cadastrais devem ser excluídos dentro do prazo definido na Política de Privacidade da instituição. | Cadastro / API Facial | ALTA |
| RN-027 | O sistema não deve utilizar os dados biométricos coletados para qualquer finalidade além do controle de presença escolar, conforme o princípio da finalidade da LGPD. | Todos | ALTA |
| RN-028 | As credenciais de acesso ao Firebase (Service Account Key) são de responsabilidade exclusiva da instituição gestora. Sua exposição pública deve ser tratada como incidente de segurança e o arquivo comprometido deve ser imediatamente revogado no console do Firebase. | Infraestrutura / Segurança | ALTA |

---

## 5. Resumo Quantitativo dos Requisitos

| Categoria                        | ALTA | MÉDIA | BAIXA | Total |
|----------------------------------|------|-------|-------|-------|
| Requisitos Funcionais (RF)       | 38   | 18    | 0     | 56    |
| Requisitos Não Funcionais (RNF)  | 19   | 8     | 0     | 27    |
| Regras de Negócio (RN)           | 22   | 6     | 0     | 28    |
| **TOTAL GERAL**                  | **79** | **32** | **0** | **111** |

**Escopo Mínimo Viável (MVP) — Requisitos de prioridade ALTA**

Para o MVP funcional do SRGFA, recomenda-se implementar prioritariamente todos os requisitos classificados como ALTA prioridade nas três categorias:

- 38 Requisitos Funcionais de prioridade ALTA
- 19 Requisitos Não Funcionais de prioridade ALTA
- 22 Regras de Negócio de prioridade ALTA

Total de artefatos de especificação no escopo do MVP: **79 itens**.

Os 32 itens de prioridade MÉDIA compõem o backlog de versões futuras.

---

*Documento elaborado com base nos artefatos técnicos do projeto: Dockerfiles, arquivos docker-compose.yml, código-fonte dos três serviços, histórico de branches e pull requests do repositório.*

*Versão 2.0.0 — Junho de 2026 — Sistema de Reconhecimento Facial para Alunos da Rede Pública de Ensino — SRGFA*
