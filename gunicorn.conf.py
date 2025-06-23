import os
import multiprocessing

# Porta que o Railway define
bind = f"0.0.0.0:{os.environ.get('PORT', '5000')}"

# Número de workers
workers = 2  # Reduza para 2 workers
worker_class = 'sync'
timeout = 120  # Aumente para 120 segundos
keepalive = 5

# Restart workers após X requests
max_requests = 1000
max_requests_jitter = 50

# Logs
accesslog = '-'
errorlog = '-'
loglevel = 'info'

# Performance
preload_app = True
proc_name = 'leilaogpt_backend'

# Graceful timeout
graceful_timeout = 40