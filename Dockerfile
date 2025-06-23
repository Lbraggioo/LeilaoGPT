FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && \
    apt-get install -y gcc && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependências Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar TODO o backend mantendo a estrutura
COPY backend/ .

# Copiar gunicorn config
COPY gunicorn.conf.py .

# Adicionar diretório atual ao PYTHONPATH
ENV PYTHONPATH=/app

# Expor porta
EXPOSE 5000

# Comando final - agora deve funcionar
CMD ["gunicorn", "--config", "gunicorn.conf.py", "src.main:app"]