# syntax=docker/dockerfile:1.6
FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PIP_DEFAULT_TIMEOUT=1000
ENV PIP_RETRIES=20
ENV PIP_RESUME_RETRIES=20
ENV CC=/usr/bin/gcc-13
ENV CXX=/usr/bin/g++-13
ENV INSIGHTFACE_HOME=/root/.insightface

RUN apt-get update && apt-get install -y --no-install-recommends \
    software-properties-common \
    ca-certificates \
    gnupg \
    && add-apt-repository -y ppa:ubuntu-toolchain-r/test \
    && apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    gcc-13 \
    g++-13 \
    libstdc++6 \
    libglib2.0-0 \
    libgomp1 \
    libgl1 \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./requirements.txt

RUN --mount=type=cache,target=/root/.cache/pip \
    python3 -m pip install --upgrade pip setuptools wheel

# instala primeiro porque o insightface precisa disso no build
RUN --mount=type=cache,target=/root/.cache/pip \
    python3 -m pip install \
    numpy==1.26.4 \
    cython==3.0.11

RUN --mount=type=cache,target=/root/.cache/pip \
    python3 -m pip install --no-build-isolation -r requirements.txt

COPY app ./app
COPY modelos ./modelos

RUN mkdir -p /app/data
RUN mkdir -p /root/.insightface/models

RUN curl -L \
    https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_s.zip \
    -o /tmp/buffalo_s.zip \
    && unzip /tmp/buffalo_s.zip -d /root/.insightface/models \
    && rm /tmp/buffalo_s.zip

EXPOSE 8000

CMD ["python3", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]