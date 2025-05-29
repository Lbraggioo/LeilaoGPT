import os
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from src.models.user import db, Conversation, Message
from openai import OpenAI
import time
from dotenv import load_dotenv # Importe para carregar do .env

load_dotenv() 

chat_bp = Blueprint('chat', __name__)

# Configuração da API OpenAI
ASSISTANT_ID = os.getenv("OPENAI_ASSISTANT_ID") # Obtém o Assistant ID da variável de ambiente
API_KEY = os.getenv("OPENAI_API_KEY") # Obtém a API Key da variável de ambiente

# Validação para garantir que as variáveis de ambiente foram definidas
if not API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable not set.")
if not ASSISTANT_ID:
    raise ValueError("OPENAI_ASSISTANT_ID environment variable not set.")

client = OpenAI(api_key=API_KEY)

# Rota para criar uma nova conversa
@chat_bp.route('/conversations', methods=['POST'])
@login_required
def create_conversation():
    data = request.get_json()
    title = data.get('title', 'Nova Conversa')
    
    new_conversation = Conversation(
        title=title,
        user_id=current_user.id
    )
    
    db.session.add(new_conversation)
    db.session.commit()
    
    return jsonify({
        'id': new_conversation.id,
        'title': new_conversation.title,
        'created_at': new_conversation.created_at.isoformat()
    }), 201

# Rota para listar todas as conversas do usuário
@chat_bp.route('/conversations', methods=['GET'])
@login_required
def get_conversations():
    conversations = Conversation.query.filter_by(user_id=current_user.id).order_by(Conversation.updated_at.desc()).all()
    
    result = []
    for conv in conversations:
        result.append({
            'id': conv.id,
            'title': conv.title,
            'created_at': conv.created_at.isoformat(),
            'updated_at': conv.updated_at.isoformat()
        })
    
    return jsonify(result), 200

# Rota para obter uma conversa específica com suas mensagens
@chat_bp.route('/conversations/<int:conversation_id>', methods=['GET'])
@login_required
def get_conversation(conversation_id):
    conversation = Conversation.query.filter_by(id=conversation_id, user_id=current_user.id).first()
    
    if not conversation:
        return jsonify({'error': 'Conversa não encontrada'}), 404
    
    messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.created_at).all()
    
    messages_list = []
    for msg in messages:
        messages_list.append({
            'id': msg.id,
            'role': msg.role,
            'content': msg.content,
            'created_at': msg.created_at.isoformat()
        })
    
    return jsonify({
        'id': conversation.id,
        'title': conversation.title,
        'created_at': conversation.created_at.isoformat(),
        'updated_at': conversation.updated_at.isoformat(),
        'messages': messages_list
    }), 200

# Rota para enviar uma mensagem e obter resposta do LeilãoGPT
@chat_bp.route('/conversations/<int:conversation_id>/messages', methods=['POST'])
@login_required
def send_message(conversation_id):
    conversation = Conversation.query.filter_by(id=conversation_id, user_id=current_user.id).first()
    
    if not conversation:
        return jsonify({'error': 'Conversa não encontrada'}), 404
    
    data = request.get_json()
    
    if 'content' not in data:
        return jsonify({'error': 'Conteúdo da mensagem não fornecido'}), 400
    
    # Salvar mensagem do usuário
    user_message = Message(
        conversation_id=conversation_id,
        role='user',
        content=data['content']
    )
    
    db.session.add(user_message)
    db.session.commit()
    
    # Obter todas as mensagens da conversa para contexto
    messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.created_at).all()
    
    # Preparar mensagens para a API da OpenAI
    openai_messages = []
    for msg in messages:
        openai_messages.append({
            'role': msg.role,
            'content': msg.content
        })
    
    # Criar ou recuperar thread existente
    thread = client.beta.threads.create(
        messages=[
            {
                "role": "user",
                "content": data['content']
            }
        ]
    )
    
    # Executar o thread com o assistente
    run = client.beta.threads.runs.create(
        thread_id=thread.id, 
        assistant_id=ASSISTANT_ID
    )
    
    # Aguardar a conclusão do processamento
    while run.status != "completed":
        run = client.beta.threads.runs.retrieve(
            thread_id=thread.id, 
            run_id=run.id
        )
        time.sleep(1)
    
    # Obter a resposta do assistente
    message_response = client.beta.threads.messages.list(thread_id=thread.id)
    messages = message_response.data
    
    # Obter a mensagem mais recente (resposta do assistente)
    latest_message = messages[0]
    assistant_response = latest_message.content[0].text.value
    
    # Salvar resposta do assistente
    assistant_message = Message(
        conversation_id=conversation_id,
        role='assistant',
        content=assistant_response
    )
    
    db.session.add(assistant_message)
    
    # Atualizar timestamp da conversa
    conversation.updated_at = db.func.now()
    
    db.session.commit()
    
    return jsonify({
        'id': assistant_message.id,
        'role': 'assistant',
        'content': assistant_response,
        'created_at': assistant_message.created_at.isoformat()
    }), 201

# Rota para excluir uma conversa
@chat_bp.route('/conversations/<int:conversation_id>', methods=['DELETE'])
@login_required
def delete_conversation(conversation_id):
    conversation = Conversation.query.filter_by(id=conversation_id, user_id=current_user.id).first()
    
    if not conversation:
        return jsonify({'error': 'Conversa não encontrada'}), 404
    
    db.session.delete(conversation)
    db.session.commit()
    
    return jsonify({'message': 'Conversa excluída com sucesso'}), 200

# Rota para atualizar o título de uma conversa
@chat_bp.route('/conversations/<int:conversation_id>', methods=['PATCH'])
@login_required
def update_conversation(conversation_id):
    conversation = Conversation.query.filter_by(id=conversation_id, user_id=current_user.id).first()
    
    if not conversation:
        return jsonify({'error': 'Conversa não encontrada'}), 404
    
    data = request.get_json()
    
    if 'title' in data:
        conversation.title = data['title']
        db.session.commit()
    
    return jsonify({
        'id': conversation.id,
        'title': conversation.title,
        'created_at': conversation.created_at.isoformat(),
        'updated_at': conversation.updated_at.isoformat()
    }), 200
