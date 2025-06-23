import os
import multiprocessing

# Porta que o Railway define
bind = f"0.0.0.0:{os.environ.get('PORT', '5000')}"

# Número de workers (garçons)
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'sync'
timeout = 30
keepalive = 2

# Restart workers após X requests (evita memory leaks)
max_requests = 1000
max_requests_jitter = 50

# Logs
accesslog = '-'  # stdout
errorlog = '-'   # stderr
loglevel = 'info'

# Performance
preload_app = True
proc_name = 'leilaogpt_backend'