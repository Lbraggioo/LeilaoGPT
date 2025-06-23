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

# Copiar código da aplicação
COPY backend/ ./
COPY gunicorn.conf.py .

# Expor porta
EXPOSE 5000

# Comando corrigido - agora aponta para src.main:app
CMD ["gunicorn", "--config", "gunicorn.conf.py", "src.main:app"]