# API de Reconhecimento Facial

Projeto de reconhecimento facial em tempo real com abordagem híbrida.

## Visão geral

A solução combina:

- **InsightFace / buffalo_l** para detecção facial e extração de embeddings
- **classificador treinado sobre embeddings** para decisão de match / non-match

O sistema permite:

- cadastrar pessoas localmente
- reconhecer uma pessoa em imagem
- reconhecer múltiplos rostos em imagem/frame
- classificar rostos não cadastrados como **Desconhecido**
- testar reconhecimento em tempo real pela webcam

## Como iniciar

Na raiz do projeto:

```bash
docker compose up --build
````

Depois acesse:

```bash
http://localhost:8000/docs
```

## Estrutura do projeto 

```bash
api-reconhecimento-facial/
├── app/
├── modelos/
│   └── classificador_match_embeddings_final.pkl
├── notebooks/
│   └── 01_treinamento_huggingface.ipynb
├── scripts/
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
└── .gitignore
```
