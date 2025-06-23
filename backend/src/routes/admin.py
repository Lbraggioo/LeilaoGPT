import os
import psutil
from flask import Blueprint, request, jsonify
from ..models.user import db, User, Conversation, Message  # ← CORRIGIDO
from ..utils.auth import token_required, admin_required  # ← CORRIGIDO
from datetime import datetime, timedelta
from sqlalchemy import func, desc

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/dashboard', methods=['GET'])
@token_required
@admin_required
def get_dashboard_stats(current_user):
    """Estatísticas gerais do sistema para o dashboard admin"""
    try:
        # Estatísticas básicas
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        total_conversations = Conversation.query.count()
        total_messages = Message.query.count()
        
        # Usuários criados nos últimos 30 dias
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        new_users_30d = User.query.filter(User.created_at >= thirty_days_ago).count()
        
        # Conversas criadas nos últimos 30 dias
        new_conversations_30d = Conversation.query.filter(Conversation.created_at >= thirty_days_ago).count()
        
        # Usuários mais ativos (por número de mensagens)
        top_users = db.session.query(
            User.username,
            User.email,
            func.count(Message.id).label('message_count')
        ).join(Conversation, User.id == Conversation.user_id)\
         .join(Message, Conversation.id == Message.conversation_id)\
         .group_by(User.id)\
         .order_by(desc('message_count'))\
         .limit(5).all()
        
        # Atividade por dia (últimos 7 dias)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        daily_activity = db.session.query(
            func.date(Message.timestamp).label('date'),
            func.count(Message.id).label('message_count')
        ).filter(Message.timestamp >= seven_days_ago)\
         .group_by(func.date(Message.timestamp))\
         .order_by('date').all()
        
        return jsonify({
            'total_users': total_users,
            'active_users': active_users,
            'total_conversations': total_conversations,
            'total_messages': total_messages,
            'new_users_30d': new_users_30d,
            'new_conversations_30d': new_conversations_30d,
            'top_users': [
                {
                    'username': user.username,
                    'email': user.email,
                    'message_count': user.message_count
                } for user in top_users
            ],
            'daily_activity': [
                {
                    'date': activity.date.isoformat(),
                    'message_count': activity.message_count
                } for activity in daily_activity
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Erro interno do servidor'}), 500

@admin_bp.route('/conversations', methods=['GET'])
@token_required
@admin_required
def get_all_conversations(current_user):
    """Lista todas as conversas do sistema (admin only)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        user_id = request.args.get('user_id', type=int)
        
        query = db.session.query(Conversation, User.username)\
            .join(User, Conversation.user_id == User.id)
        
        if user_id:
            query = query.filter(Conversation.user_id == user_id)
        
        conversations = query.order_by(Conversation.updated_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        result = []
        for conv, username in conversations.items:
            conv_data = conv.to_dict()
            conv_data['username'] = username
            result.append(conv_data)
        
        return jsonify({
            'conversations': result,
            'total': conversations.total,
            'pages': conversations.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Erro interno do servidor'}), 500

@admin_bp.route('/conversations/<int:conversation_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_conversation_admin(current_user, conversation_id):
    """Deleta qualquer conversa (admin only)"""
    try:
        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            return jsonify({'message': 'Conversa não encontrada'}), 404
        
        db.session.delete(conversation)
        db.session.commit()
        
        return jsonify({'message': 'Conversa deletada com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Erro interno do servidor'}), 500

@admin_bp.route('/users/<int:user_id>/conversations', methods=['GET'])
@token_required
@admin_required
def get_user_conversations(current_user, user_id):
    """Lista conversas de um usuário específico (admin only)"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'Usuário não encontrado'}), 404
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        conversations = Conversation.query.filter_by(user_id=user_id)\
            .order_by(Conversation.updated_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'user': user.to_dict(),
            'conversations': [conv.to_dict() for conv in conversations.items],
            'total': conversations.total,
            'pages': conversations.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Erro interno do servidor'}), 500

@admin_bp.route('/backup', methods=['POST'])
@token_required
@admin_required
def create_backup(current_user):
    """Cria backup dos dados (admin only)"""
    try:
        import json
        from datetime import datetime
        
        # Coleta todos os dados
        users_data = []
        for user in User.query.all():
            user_dict = user.to_dict()
            user_dict['conversations'] = []
            
            for conv in user.conversations:
                conv_dict = conv.to_dict()
                conv_dict['messages'] = [msg.to_dict() for msg in conv.messages]
                user_dict['conversations'].append(conv_dict)
            
            users_data.append(user_dict)
        
        backup_data = {
            'backup_date': datetime.utcnow().isoformat(),
            'version': '1.0',
            'users': users_data
        }
        
        # Salva backup em arquivo
        backup_filename = f"backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        backup_path = os.path.join(os.path.dirname(__file__), '..', 'backups', backup_filename)
        
        # Cria diretório se não existir
        os.makedirs(os.path.dirname(backup_path), exist_ok=True)
        
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, ensure_ascii=False, indent=2)
        
        return jsonify({
            'message': 'Backup criado com sucesso',
            'filename': backup_filename,
            'path': backup_path,
            'total_users': len(users_data)
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Erro ao criar backup: {str(e)}'}), 500

@admin_bp.route('/system-info', methods=['GET'])
@token_required
@admin_required
def get_system_info(current_user):
    """Informações do sistema (admin only)"""
    try:
        import psutil
        import platform
        
        # Informações do sistema
        system_info = {
            'platform': platform.platform(),
            'python_version': platform.python_version(),
            'cpu_count': psutil.cpu_count(),
            'memory_total': psutil.virtual_memory().total,
            'memory_available': psutil.virtual_memory().available,
            'disk_usage': psutil.disk_usage('/').percent
        }
        
        # Informações do banco de dados
        db_info = {
            'database_url': os.getenv('DATABASE_URL', 'Not configured'),
            'total_tables': len(db.metadata.tables)
        }
        
        # Informações da aplicação
        app_info = {
            'openai_configured': bool(os.getenv('OPENAI_API_KEY')),
            'assistant_id': os.getenv('OPENAI_ASSISTANT_ID', 'Not configured'),
            'cors_origins': os.getenv('CORS_ORIGINS', 'Not configured')
        }
        
        return jsonify({
            'system': system_info,
            'database': db_info,
            'application': app_info
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Erro ao obter informações do sistema'}), 500