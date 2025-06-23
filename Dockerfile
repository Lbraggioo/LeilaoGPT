FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && \
    apt-get install -y gcc postgresql-client && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependências Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar TODO o backend mantendo a estrutura
COPY backend/ .

# Copiar arquivos de configuração
COPY gunicorn.conf.py .
COPY railway.toml .

# Adicionar diretório atual ao PYTHONPATH
ENV PYTHONPATH=/app:$PYTHONPATH

# Criar diretórios necessários
RUN mkdir -p /app/database /app/backups

# Expor porta
EXPOSE 5000

# Comando final
CMD ["gunicorn", "--config", "gunicorn.conf.py", "src.main:app"]