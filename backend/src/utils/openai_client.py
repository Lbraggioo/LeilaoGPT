# backend/src/utils/openai_client.py
import os
import openai

def get_openai_client() -> openai.OpenAI:
    """
    Retorna uma instância configurada do SDK OpenAI.
    
    Requer a variável de ambiente OPENAI_API_KEY no arquivo .env
    ou exportada no ambiente do servidor.
    """
    
    return openai.OpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        # Ajuste aqui se precisar de proxy, organização etc.
    )