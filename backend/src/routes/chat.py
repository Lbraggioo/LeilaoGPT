from flask import Blueprint, request, jsonify
from ..models.user import db, User, Conversation, Message  # ← CORRIGIDO
from ..utils.auth import token_required  # ← CORRIGIDO
from ..utils.openai_client import get_openai_client  # ← CORRIGIDO
import os
from datetime import datetime
import uuid
import time

chat_bp = Blueprint("chat", __name__)

# Configuração do Assistant ID
ASSISTANT_ID = os.getenv("OPENAI_ASSISTANT_ID")


# ────────────────────────────────
# GET /chat/conversations
# ────────────────────────────────
@chat_bp.route("/conversations", methods=["GET"])
@token_required
def get_conversations(current_user):
    """Lista todas as conversas do usuário"""
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)

        conversations = (
            Conversation.query.filter_by(user_id=current_user.id)
            .order_by(Conversation.updated_at.desc())
            .paginate(page=page, per_page=per_page, error_out=False)
        )

        return (
            jsonify({"conversations": [c.to_dict() for c in conversations.items]}),
            200,
        )

    except Exception:
        return jsonify({"message": "Erro interno do servidor"}), 500


# ────────────────────────────────
# POST /chat/conversations
# ────────────────────────────────
@chat_bp.route("/conversations", methods=["POST"])
@token_required
def create_conversation(current_user):
    """Cria nova conversa"""
    try:
        data = request.get_json() or {}
        title = data.get("title", "Nova Conversa")

        conversation = Conversation(user_id=current_user.id, title=title)

        db.session.add(conversation)
        db.session.commit()

        return (
            jsonify({"conversation": conversation.to_dict()}),
            201,
        )

    except Exception:
        db.session.rollback()
        return jsonify({"message": "Erro interno do servidor"}), 500


# ────────────────────────────────
# DELETE /chat/conversations  (limpa todas)
# ────────────────────────────────
@chat_bp.route("/conversations", methods=["DELETE"])
@token_required
def delete_all_conversations(current_user):
    """Remove todas as conversas do usuário"""
    try:
        Conversation.query.filter_by(user_id=current_user.id).delete()
        db.session.commit()
        return "", 204
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Erro interno do servidor"}), 500


# ────────────────────────────────
# GET /chat/conversations/<id>
# ────────────────────────────────
@chat_bp.route("/conversations/<int:conversation_id>", methods=["GET"])
@token_required
def get_conversation(current_user, conversation_id):
    """Busca conversa específica"""
    try:
        conversation = Conversation.query.filter_by(
            id=conversation_id, user_id=current_user.id
        ).first()

        if not conversation:
            return jsonify({"message": "Conversa não encontrada"}), 404

        messages = (
            Message.query.filter_by(conversation_id=conversation_id)
            .order_by(Message.timestamp.asc())
            .all()
        )

        data = conversation.to_dict()
        data["messages"] = [m.to_dict() for m in messages]

        return jsonify({"conversation": data}), 200

    except Exception:
        return jsonify({"message": "Erro interno do servidor"}), 500


# ────────────────────────────────
# PATCH /chat/conversations/<id>
# ────────────────────────────────
@chat_bp.route("/conversations/<int:conversation_id>", methods=["PATCH", "PUT"])
@token_required
def update_conversation(current_user, conversation_id):
    """Atualiza título da conversa"""
    try:
        conversation = Conversation.query.filter_by(
            id=conversation_id, user_id=current_user.id
        ).first()

        if not conversation:
            return jsonify({"message": "Conversa não encontrada"}), 404

        data = request.get_json() or {}
        title = data.get("title")
        if not title:
            return jsonify({"message": "Título é obrigatório"}), 400

        conversation.title = title
        conversation.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({"conversation": conversation.to_dict()}), 200

    except Exception:
        db.session.rollback()
        return jsonify({"message": "Erro interno do servidor"}), 500


# ────────────────────────────────
# DELETE /chat/conversations/<id>
# ────────────────────────────────
@chat_bp.route("/conversations/<int:conversation_id>", methods=["DELETE"])
@token_required
def delete_conversation(current_user, conversation_id):
    """Deleta conversa"""
    try:
        conversation = Conversation.query.filter_by(
            id=conversation_id, user_id=current_user.id
        ).first()

        if not conversation:
            return jsonify({"message": "Conversa não encontrada"}), 404

        db.session.delete(conversation)
        db.session.commit()
        return "", 204

    except Exception:
        db.session.rollback()
        return jsonify({"message": "Erro interno do servidor"}), 500


# ────────────────────────────────
# Função para gerar título inteligente
# ────────────────────────────────
def generate_smart_title(content):
    """Gera título inteligente baseado no conteúdo da mensagem"""
    if not content:
        return "Nova Conversa"
    
    # Remove pontuação e converte para minúsculas
    import re
    clean = re.sub(r'[^\w\s]', '', content.lower())
    words = clean.split()
    
    # Palavras-chave para diferentes tipos de solicitação
    keywords_map = {
        'análise': ['analise', 'analisar', 'análise', 'examinar', 'avaliar'],
        'resumo': ['resumir', 'resumo', 'sintetizar', 'síntese'],
        'explicação': ['explicar', 'explique', 'como', 'o que é', 'definir'],
        'tradução': ['traduzir', 'tradução', 'translate'],
        'código': ['codigo', 'código', 'programar', 'script', 'função'],
        'texto': ['escrever', 'redação', 'texto', 'artigo'],
        'cálculo': ['calcular', 'matemática', 'equação', 'formula'],
        'email': ['email', 'e-mail', 'carta', 'mensagem'],
        'relatório': ['relatório', 'relatorio', 'report'],
        'apresentação': ['apresentação', 'slide', 'powerpoint'],
        'pesquisa': ['pesquisar', 'buscar', 'encontrar'],
        'comparação': ['comparar', 'diferença', 'versus', 'vs'],
        'dúvida': ['dúvida', 'duvida', 'pergunta', 'questão'],
        'ajuda': ['ajuda', 'socorro', 'help', 'auxilio'],
        'edital': ['edital', 'licitação', 'concurso'],
        'contrato': ['contrato', 'acordo', 'termo'],
        'imagem': ['imagem', 'foto', 'figura', 'picture'],
        'documento': ['documento', 'pdf', 'arquivo', 'doc']
    }
    
    # Identifica o tipo de solicitação
    request_type = None
    for category, keywords in keywords_map.items():
        if any(keyword in words for keyword in keywords):
            request_type = category
            break
    
    # Identifica substantivos importantes (palavras com mais de 3 letras)
    important_words = [w for w in words if len(w) > 3 and w not in [
        'para', 'com', 'sobre', 'por', 'em', 'de', 'da', 'do', 'das', 'dos',
        'que', 'qual', 'como', 'quando', 'onde', 'porque', 'este', 'esta',
        'isso', 'aquilo', 'muito', 'mais', 'menos', 'melhor', 'pior',
        'favor', 'pode', 'consegue', 'gostaria', 'preciso', 'quero'
    ]]
    
    # Constrói o título
    if request_type and important_words:
        # Ex: "Análise Edital", "Resumo Documento"
        main_word = important_words[0].title()
        title = f"{request_type.title()} {main_word}"
    elif request_type:
        # Ex: "Análise", "Resumo"
        title = request_type.title()
    elif important_words:
        # Ex: "Edital", "Documento"
        title = " ".join(important_words[:2]).title()
    else:
        # Fallback: primeiras palavras
        title = " ".join(words[:3]).title()
    
    # Limita o tamanho e garante que não está vazio
    title = title[:30].strip()
    return title if title else "Nova Conversa"


# ────────────────────────────────
# Função auxiliar para detectar tipo de arquivo
# ────────────────────────────────
def get_file_info(client, file_id):
    """Obtém informações do arquivo da OpenAI"""
    try:
        file_info = client.files.retrieve(file_id)
        return file_info
    except Exception as e:
        print(f"⚠️ Erro ao obter info do arquivo {file_id}: {e}")
        return None


# ────────────────────────────────
# POST /chat/conversations/<id>/messages - CORRIGIDO PARA ARQUIVOS
# ────────────────────────────────
@chat_bp.route("/conversations/<int:conversation_id>/messages", methods=["POST"])
@token_required
def send_message(current_user, conversation_id):
    """Envia mensagem do usuário e obtém resposta do assistente - COM SUPORTE CORRIGIDO A ARQUIVOS"""
    try:
        conversation = Conversation.query.filter_by(
            id=conversation_id, user_id=current_user.id
        ).first()
        if not conversation:
            return jsonify({"message": "Conversa não encontrada"}), 404

        data = request.get_json() or {}
        content = data.get("content")
        file_ids = data.get("file_ids", [])  # ← file_ids do frontend
        original_files = data.get("original_files", [])  # ← NOVO: info dos arquivos originais
        
        if not content:
            return jsonify({"message": "Conteúdo da mensagem é obrigatório"}), 400

        # Debug - mostra o que foi recebido
        print(f"📩 Mensagem recebida: {content}")
        print(f"📎 File IDs recebidos: {file_ids}")
        print(f"📁 Arquivos originais: {[f.get('name', 'N/A') for f in original_files] if original_files else 'N/A'}")

        # 1) Salva mensagem do usuário
        user_msg = Message(conversation_id=conversation_id, content=content, role="user")
        db.session.add(user_msg)

        # 2) Chama Assistants API com suporte a arquivos CORRIGIDO
        try:
            client = get_openai_client()  # ← USA O CLIENTE CENTRALIZADO
            
            # Cria ou reutiliza thread
            if not conversation.thread_id:
                # Sempre cria thread simples - anexamos arquivos via mensagem
                thread = client.beta.threads.create()
                print(f"🧵 Thread criado: {thread.id}")
                
                conversation.thread_id = thread.id
                db.session.commit()
            else:
                thread_id = conversation.thread_id
                print(f"🧵 Reutilizando thread: {thread_id}")
                
                # Se há arquivos, apenas prepara para processamento
                if file_ids:
                    print(f"📎 Preparando {len(file_ids)} arquivo(s) para processamento")

            # Prepara conteúdo da mensagem - ESTRUTURA CORRIGIDA
            message_content = []
            
            # Adiciona texto
            if content.strip():
                message_content.append({
                    "type": "text",
                    "text": content
                })
            
            # Para arquivos, usa informações do frontend para detectar tipo
            if file_ids:
                print(f"📎 Processando {len(file_ids)} arquivo(s)")
                for i, file_id in enumerate(file_ids):
                    # Usa informações do arquivo original se disponível
                    if original_files and i < len(original_files):
                        original_file = original_files[i]
                        filename = original_file.get('name', '').lower()
                        file_type = original_file.get('type', '').lower()
                        
                        # Detecta se é imagem pelo tipo MIME ou nome
                        is_image = (
                            file_type.startswith('image/') or
                            filename.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg')) or
                            'image' in filename
                        )
                        
                        if is_image:
                            # Para imagens, usa image_file
                            message_content.append({
                                "type": "image_file",
                                "image_file": {"file_id": file_id}
                            })
                            print(f"  - Imagem: {file_id} ({filename}) - tipo: {file_type}")
                        else:
                            # Para documentos (PDF, DOC, etc.), adiciona como anexo simples
                            # O assistant deve estar configurado com file_search habilitado
                            print(f"  - Documento: {file_id} ({filename}) - tipo: {file_type}")
                            # Não adiciona ao content da mensagem - será processado automaticamente
                            # se o assistant tiver file_search habilitado
                    else:
                        # Fallback: usa API da OpenAI para detectar tipo
                        file_info = get_file_info(client, file_id)
                        if file_info:
                            filename = getattr(file_info, 'filename', '').lower()
                            is_image = (
                                filename.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg')) or
                                'image' in filename
                            )
                            
                            if is_image:
                                message_content.append({
                                    "type": "image_file", 
                                    "image_file": {"file_id": file_id}
                                })
                                print(f"  - Imagem (API): {file_id} ({filename})")
                            else:
                                print(f"  - Documento (API): {file_id} ({filename})")
                        else:
                            print(f"  - Arquivo: {file_id} (tipo não identificado)")

            # Cria mensagem no thread
            message_data = {
                "thread_id": conversation.thread_id,
                "role": "user",
                "content": message_content
            }
            
            # Se há documentos (PDFs, etc.), adiciona attachments
            document_files = []
            if file_ids and original_files:
                for i, file_id in enumerate(file_ids):
                    if i < len(original_files):
                        original_file = original_files[i]
                        file_type = original_file.get('type', '').lower()
                        is_image = file_type.startswith('image/')
                        
                        if not is_image:  # Se não é imagem, é documento
                            document_files.append({
                                "file_id": file_id,
                                "tools": [{"type": "file_search"}]
                            })
            
            if document_files:
                message_data["attachments"] = document_files
                print(f"📎 Anexando {len(document_files)} documento(s) com file_search")

            thread_message = client.beta.threads.messages.create(**message_data)
            print(f"✉️ Mensagem criada no thread: {thread_message.id}")

            # Executa o assistant
            run = client.beta.threads.runs.create(
                thread_id=conversation.thread_id,
                assistant_id=ASSISTANT_ID
            )
            print(f"🤖 Run iniciado: {run.id}")

            # Aguarda conclusão
            max_wait = 60  # timeout de 60 segundos
            wait_time = 0
            while run.status in ("queued", "in_progress") and wait_time < max_wait:
                time.sleep(1)
                wait_time += 1
                run = client.beta.threads.runs.retrieve(
                    thread_id=conversation.thread_id, run_id=run.id
                )
                if wait_time % 5 == 0:  # Log a cada 5 segundos
                    print(f"⏳ Aguardando... Status: {run.status} ({wait_time}s)")

            if run.status == "completed":
                print("✅ Run completado com sucesso")
                
                # Busca resposta do assistant
                messages = client.beta.threads.messages.list(
                    thread_id=conversation.thread_id,
                    order="desc",
                    limit=1
                ).data
                
                if messages:
                    assistant_reply = ""
                    for content_block in messages[0].content:
                        if hasattr(content_block, 'text'):
                            assistant_reply += content_block.text.value
                    
                    if not assistant_reply:
                        assistant_reply = "Desculpe, não consegui processar sua mensagem."
                else:
                    assistant_reply = "Desculpe, não recebi resposta do assistente."
                    
            elif run.status == "failed":
                error_info = getattr(run, 'last_error', 'Erro desconhecido')
                print(f"❌ Run falhou: {error_info}")
                assistant_reply = "Desculpe, ocorreu um erro ao processar sua mensagem."
            elif wait_time >= max_wait:
                print("⏰ Timeout aguardando resposta")
                assistant_reply = "Desculpe, a resposta está demorando muito. Tente novamente."
            else:
                print(f"⚠️ Run terminou com status: {run.status}")
                assistant_reply = "Desculpe, ocorreu um erro inesperado."
                
        except Exception as api_error:
            print(f"🚨 Erro na API OpenAI: {api_error}")
            assistant_reply = "Desculpe, estou temporariamente indisponível. Tente novamente mais tarde."

        # 4) Salva resposta do assistente
        ai_msg = Message(
            conversation_id=conversation_id, content=assistant_reply, role="assistant"
        )
        db.session.add(ai_msg)

        # 5) Atualiza meta-dados da conversa
        conversation.updated_at = datetime.utcnow()
        
        # Define título automático inteligente APENAS na primeira mensagem do usuário
        if not conversation.title or conversation.title == "Nova Conversa":
            # Conta apenas mensagens do usuário para determinar se é a primeira
            user_messages_count = Message.query.filter_by(
                conversation_id=conversation_id, 
                role="user"
            ).count()
            
            if user_messages_count <= 1:  # Primeira mensagem do usuário
                # Limpa instruções do sistema para criar título
                clean_content = content
                if "SISTEMA:" in content:
                    # Extrai apenas a pergunta do usuário
                    parts = content.split("PERGUNTA DO USUÁRIO: ")
                    if len(parts) > 1:
                        clean_content = parts[1]
                
                # Gera título inteligente baseado em palavras-chave
                title = generate_smart_title(clean_content)
                conversation.title = title
                print(f"📝 Título gerado automaticamente: '{title}'")

        db.session.commit()
        print("💾 Dados salvos no banco")

        return (
            jsonify(
                {
                    "user_message": user_msg.to_dict(),
                    "assistant_message": ai_msg.to_dict(),
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        print(f"🚨 Erro geral: {e}")
        return jsonify({"message": "Erro interno do servidor"}), 500


# ────────────────────────────────
# GET /chat/conversations/<id>/messages
# ────────────────────────────────
@chat_bp.route("/conversations/<int:conversation_id>/messages", methods=["GET"])
@token_required
def get_messages(current_user, conversation_id):
    """Lista mensagens de uma conversa"""
    try:
        conversation = Conversation.query.filter_by(
            id=conversation_id, user_id=current_user.id
        ).first()
        if not conversation:
            return jsonify({"message": "Conversa não encontrada"}), 404

        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 50, type=int)

        messages = (
            Message.query.filter_by(conversation_id=conversation_id)
            .order_by(Message.timestamp.asc())
            .paginate(page=page, per_page=per_page, error_out=False)
        )

        return (
            jsonify({"messages": [m.to_dict() for m in messages.items]}),
            200,
        )

    except Exception:
        return jsonify({"message": "Erro interno do servidor"}), 500