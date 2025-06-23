# backend/src/routes/upload.py
import os
import uuid
import shutil
import tempfile
from flask import Blueprint, request, jsonify, current_app
from openai import OpenAI

upload_bp = Blueprint("upload_bp", __name__)  # ← REMOVIDO url_prefix="/api"

# inicialize o client uma vez, usando sua API key do .env
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def is_image_file(filename, content_type):
    """Detecta se o arquivo é uma imagem"""
    if not filename:
        return False
    
    # Verifica por extensão
    image_extensions = ('.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg')
    if filename.lower().endswith(image_extensions):
        return True
    
    # Verifica por content type
    if content_type and content_type.startswith('image/'):
        return True
    
    # Verifica por nome (WhatsApp images, etc.)
    if 'image' in filename.lower():
        return True
    
    return False

@upload_bp.route("/upload", methods=["POST"])  # ← MUDADO para /upload apenas
def upload_files():
    """
    Recebe multipart/form-data com chave "files",
    faz upload para OpenAI e retorna [{"filename", "file_id"}].
    """
    print(">>>> ROTA /upload FOI ACIONADA, arquivos enviados:", list(request.files.keys()))
    if "files" not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400

    files = request.files.getlist("files")
    uploaded = []

    for f in files:
        # Detecta se é imagem
        is_image = is_image_file(f.filename, f.content_type)
        print(f"📁 Processando: {f.filename} ({f.content_type}) - Imagem: {is_image}")
        
        # grava em arquivo temporário MANTENDO A EXTENSÃO
        file_extension = os.path.splitext(f.filename)[1] if f.filename else ""
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=file_extension)
        f.save(tmp.name)
        tmp.close()

        try:
            # envia à OpenAI com purpose apropriado
            with open(tmp.name, "rb") as fd:
                if is_image:
                    # Para imagens, usa purpose="vision" e preserva nome original
                    resp = client.files.create(
                        file=(f.filename, fd, f.content_type), 
                        purpose="vision"
                    )
                    print(f"✅ Imagem enviada com purpose=vision: {resp.id}")
                else:
                    # Para outros arquivos, usa purpose="assistants"
                    resp = client.files.create(
                        file=(f.filename, fd, f.content_type), 
                        purpose="assistants"
                    )
                    print(f"✅ Documento enviado com purpose=assistants: {resp.id}")

            uploaded.append({
                "filename": f.filename,
                "file_id": resp.id
            })
            
        except Exception as e:
            print(f"❌ Erro ao enviar arquivo {f.filename}: {e}")
            return jsonify({"error": f"Erro ao processar arquivo {f.filename}: {str(e)}"}), 500
        finally:
            # Remove arquivo temporário
            os.unlink(tmp.name)

    return jsonify({"data": uploaded}), 200