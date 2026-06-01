# API de Reconhecimento Facial

Projeto de reconhecimento facial em tempo real para controle de presença, usando uma arquitetura baseada em embeddings faciais, Firebase e busca vetorial em memória.

## Visão geral

A solução atual utiliza:

- **InsightFace / buffalo_s** para detecção facial e extração de embeddings.
- **Firebase Firestore** como fonte oficial dos embeddings faciais cadastrados.
- **Índice vetorial em memória** com NumPy para busca rápida por similaridade.
- **Classificador auxiliar treinado sobre embeddings** para validação de casos duvidosos.
- **Rejeição de desconhecidos** por threshold de similaridade.
- **Reconhecimento de múltiplos rostos** em uma mesma imagem/frame.
- **Integração com backend Node.js** para registrar presença no Firebase.

## Arquitetura

```text
imagem/frame
↓
API Python
↓
InsightFace buffalo_s
↓
embedding facial
↓
Firebase face_embeddings
↓
índice vetorial em memória
↓
busca por similaridade
↓
classificador auxiliar em casos duvidosos
↓
retorno da matrícula
↓
backend Node.js
↓
registro de presença no Firebase
```

## Estrutura do projeto

```text
api-reconhecimento-facial/
├── app/
│   ├── face_index.py
│   ├── face_service.py
│   ├── local_store.py
│   ├── main.py
│   └── schemas.py
├── modelos/
│   └── classificador_match_embeddings_buffalo_s.pkl
├── notebooks/
│   └── modelos/
│       └── 01_treinamento_reconhecimento.ipynb
├── scripts/
│   └── teste_camera_tempo_real.py
├── secrets/
│   └── serviceAccountKey.json
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .dockerignore
└── .gitignore
```

## Principais arquivos

### `app/main.py`

Define as rotas da API:

```text
GET  /
GET  /health
GET  /people
POST /enroll
POST /recognize
POST /recognize-multiple
POST /compare
POST /reload-index
DELETE /people
DELETE /people/{registration}
```

### `app/face_service.py`

Responsável por:

- carregar o modelo `buffalo_s`;
- detectar rostos;
- extrair embeddings;
- comparar embeddings;
- aplicar thresholds;
- usar o classificador auxiliar;
- reconhecer uma ou várias pessoas.

### `app/face_index.py`

Responsável por:

- montar o índice vetorial em memória;
- normalizar embeddings;
- buscar a pessoa mais próxima por similaridade.

### `app/local_store.py`

Responsável por:

- conectar no Firebase;
- carregar embeddings ativos da coleção `face_embeddings`;
- cadastrar novos embeddings;
- listar pessoas cadastradas;
- remover pessoas da base facial.

### `modelos/classificador_match_embeddings_buffalo_s.pkl`

Modelo auxiliar treinado no notebook. Ele é usado para validar pares de embeddings em casos duvidosos.

## Pré-requisitos

Antes de rodar, instale:

- Docker Desktop;
- NVIDIA Driver atualizado;
- NVIDIA Container Toolkit;
- Docker Compose;
- chave de serviço do Firebase.

Para verificar se a GPU está disponível no Windows:

```powershell
nvidia-smi
```

Para verificar se o Docker consegue acessar a GPU:

```powershell
docker run --rm --gpus all nvidia/cuda:12.4.1-base-ubuntu22.04 nvidia-smi
```

Se o comando acima mostrar sua GPU, o Docker está pronto para rodar a API com GPU.

## Configuração do Firebase

Crie a pasta:

```text
api-reconhecimento-facial/secrets/
```

Coloque dentro dela o arquivo:

```text
serviceAccountKey.json
```

A estrutura deve ficar assim:

```text
api-reconhecimento-facial/
└── secrets/
    └── serviceAccountKey.json
```

> Importante: não envie `serviceAccountKey.json` para o GitHub.

## Variáveis de ambiente no Docker Compose

O `docker-compose.yml` deve conter:

```yml
services:
  face-api:
    container_name: api-presenca-facial
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      FACE_CTX_ID: "0"
      FACE_DET_SIZE: "320"
      FACE_MODEL_NAME: "buffalo_s"
      INSIGHTFACE_HOME: "/root/.insightface"

      GOOGLE_APPLICATION_CREDENTIALS: "/app/secrets/serviceAccountKey.json"
      FACE_EMBEDDINGS_COLLECTION: "face_embeddings"

      FACE_CLASSIFIER_PATH: "/app/modelos/classificador_match_embeddings_buffalo_s.pkl"
      FACE_UNKNOWN_THRESHOLD: "0.45"
      FACE_MATCH_THRESHOLD: "0.50"
      FACE_MIN_COSINE_THRESHOLD: "0.35"

    gpus: all
    volumes:
      - ./secrets:/app/secrets:ro
```

## Como rodar a API

Entre na pasta da API:

```powershell
cd "C:\Projeto\api-reconhecimento-facial"
```

Suba a API com Docker:

```powershell
docker compose up --build
```

Se quiser forçar rebuild completo:

```powershell
docker compose down
docker compose build --no-cache
docker compose up
```

## Verificar se a API está funcionando

Em outro terminal, rode:

```powershell
curl.exe http://localhost:8000/health
```

Resultado esperado:

```json
{
  "status": "ok",
  "service": "api-presenca-facial",
  "model": "buffalo_s",
  "storage": "firebase-firestore",
  "classifier_loaded": true,
  "total_people_cached": 1,
  "total_people_indexed": 5,
  "threshold": 0.5,
  "unknown_threshold": 0.45,
  "min_cosine_threshold": 0.35
}
```

### O que significa cada campo

```text
model:
modelo facial carregado. Deve aparecer buffalo_s.

storage:
fonte dos embeddings. Deve aparecer firebase-firestore.

classifier_loaded:
indica se o classificador auxiliar foi carregado.

total_people_cached:
quantidade de pessoas/matrículas carregadas do Firebase.

total_people_indexed:
quantidade de embeddings indexados em memória.

threshold:
limiar principal de aceitação.

unknown_threshold:
limiar para rejeitar desconhecidos.

min_cosine_threshold:
limiar mínimo de similaridade.
```

## Listar pessoas cadastradas

```powershell
curl.exe http://localhost:8000/people
```

Exemplo de resposta:

```json
{
  "total": 1,
  "people": [
    {
      "id": "c9561dc8-ae6f-4a3a-a665-a49a648484fd",
      "name": "Felipe B",
      "registration": "2026001"
    }
  ]
}
```


## Rodar teste com webcam

O script de webcam é útil para teste local, mas a demonstração principal do projeto deve ser pelo frontend e backend.

```powershell
python scripts/teste_camera_tempo_real.py
```

A API precisa estar rodando antes:

```powershell
docker compose up --build
```

## Integração com o sistema completo

Fluxo final do projeto:

```text
Frontend React
↓
Backend Node.js
↓
API Python /recognize-multiple
↓
buffalo_s
↓
Firebase face_embeddings
↓
índice vetorial em memória
↓
retorna matrícula
↓
Backend busca aluno
↓
Backend registra presença
↓
Firebase
```

## Notas sobre o modelo

A arquitetura usa:

```text
buffalo_s + embeddings + busca vetorial
```

A `ResNet50` foi usada apenas como comparação técnica no notebook de treinamento. Ela não é usada na API de produção porque é um classificador fechado e exigiria retreinamento sempre que novos alunos fossem cadastrados.

## Notebook de treinamento

O notebook fica em:

```text
notebooks/modelos/01_treinamento_reconhecimento.ipynb
```

Ele avalia:

- tamanho das imagens;
- divisão treino, validação e teste;
- `buffalo_s + busca vetorial`;
- classificador auxiliar;
- open-set para desconhecidos;
- multi-pessoas no mesmo frame;
- tracking temporal;
- comparação com `ResNet50`;
- latência e throughput.


## Comandos úteis

### Ver containers rodando

```powershell
docker ps
```

### Ver logs da API

```powershell
docker logs -f api-presenca-facial
```

### Entrar no container

```powershell
docker exec -it api-presenca-facial sh
```

### Ver variáveis da API dentro do container

```powershell
docker exec -it api-presenca-facial sh -lc "printenv | grep FACE"
```

### Testar GPU dentro do container

```powershell
docker exec -it api-presenca-facial nvidia-smi
```

## Resumo

A API está alinhada com a arquitetura  do projeto:

```text
buffalo_s
↓
embedding facial
↓
Firebase face_embeddings
↓
índice vetorial em memória
↓
busca por similaridade
↓
rejeição de desconhecidos
↓
classificador auxiliar em casos duvidosos
↓
backend registra presença
```

