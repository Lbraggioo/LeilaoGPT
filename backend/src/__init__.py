"""
Permite fazer `from backend import app` para usar o objeto Flask
sem precisar importar main.py diretamente.
"""
from .main import app  # noqa: F401
