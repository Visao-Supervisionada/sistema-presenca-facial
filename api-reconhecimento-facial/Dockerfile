# syntax=docker/dockerfile:1.6
FROM python:3.10-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PIP_DEFAULT_TIMEOUT=1000
ENV PIP_RETRIES=20
ENV PIP_RESUME_RETRIES=20

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    g++ \
    libglib2.0-0 \
    libgomp1 \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

COPY app ./app
COPY modelos ./modelos

RUN mkdir -p /app/data
RUN mkdir -p /root/.insightface/models/buffalo_l

RUN --mount=type=cache,target=/root/.cache/pip \
    python -m pip install --upgrade setuptools wheel

RUN --mount=type=cache,target=/root/.cache/pip \
    python -m pip install \
    fastapi==0.115.0 \
    "uvicorn[standard]==0.30.6" \
    python-multipart==0.0.9 \
    numpy==1.26.4 \
    pillow==10.4.0 \
    opencv-python-headless==4.10.0.84 \
    onnxruntime==1.19.2 \
    scipy==1.14.1 \
    scikit-learn==1.5.2 \
    easydict==1.13 \
    requests==2.32.3 \
    onnx==1.16.2 \
    joblib==1.4.2 \
    cython==3.0.11

RUN --mount=type=cache,target=/root/.cache/pip \
    python -m pip install --no-build-isolation insightface==0.7.3

RUN curl -L \
    https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip \
    -o /tmp/buffalo_l.zip \
    && unzip /tmp/buffalo_l.zip -d /root/.insightface/models/buffalo_l \
    && rm /tmp/buffalo_l.zip

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]