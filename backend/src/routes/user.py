from flask import Blueprint, request, jsonify
from ..models.user import db, User  # ← CORRIGIDO
from ..utils.auth import token_required, admin_required, validate_json_data  # ← CORRIGIDO
import re

user_bp = Blueprint('user', __name__)

def validate_email(email):
    """Valida formato do email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_username(username):
    """Valida formato do username"""
    # Username deve ter entre 3-30 caracteres, apenas letras, números e underscore
    pattern = r'^[a-zA-Z0-9_]{3,30}$'
    return re.match(pattern, username) is not None

@user_bp.route('/users', methods=['GET'])
@token_required
@admin_required
def get_users(current_user):
    """Lista todos os usuários (apenas admin)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '', type=str)
        
        query = User.query
        
        # Filtro de busca
        if search:
            query = query.filter(
                (User.username.contains(search)) | 
                (User.email.contains(search))
            )
        
        # Paginação
        users = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'users': [user.to_dict() for user in users.items],
            'total': users.total,
            'pages': users.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Erro interno do servidor'}), 500

@user_bp.route('/users', methods=['POST'])
@token_required
@admin_required
def create_user(current_user):
    """Cria novo usuário (apenas admin)"""
    try:
        if not request.is_json:
            return jsonify({'message': 'Content-Type deve ser application/json'}), 400
        
        data = request.get_json()
        
        # Validação de campos obrigatórios
        required_fields = ['username', 'email', 'password']
        missing_fields = []
        
        for field in required_fields:
            if field not in data or not data[field]:
                missing_fields.append(field)
        
        if missing_fields:
            return jsonify({'message': f'Campos obrigatórios: {", ".join(missing_fields)}'}), 400
        
        # Extrai dados
        username = data['username'].strip()
        email = data['email'].strip().lower()
        password = data['password']
        is_admin = data.get('is_admin', False)
        
        # Validações
        if not validate_username(username):
            return jsonify({
                'message': 'Username inválido. Use apenas letras, números e underscore (3-30 caracteres)'
            }), 400
        
        if not validate_email(email):
            return jsonify({'message': 'Email inválido'}), 400
        
        if len(password) < 6:
            return jsonify({'message': 'Senha deve ter pelo menos 6 caracteres'}), 400
        
        # Verifica se username já existe
        if User.query.filter_by(username=username).first():
            return jsonify({'message': 'Username já existe'}), 400
        
        # Verifica se email já existe
        if User.query.filter_by(email=email).first():
            return jsonify({'message': 'Email já existe'}), 400
        
        # Cria novo usuário
        new_user = User(
            username=username,
            email=email,
            password=password,
            is_admin=is_admin
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'Usuário criado com sucesso',
            'user': new_user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Erro ao criar usuário'}), 500

@user_bp.route('/users/<int:user_id>', methods=['GET'])
@token_required
@admin_required
def get_user(current_user, user_id):
    """Busca usuário por ID (apenas admin)"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'Usuário não encontrado'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'message': 'Erro interno do servidor'}), 500

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
@token_required
@admin_required
def update_user(current_user, user_id):
    """Atualiza usuário (apenas admin)"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'Usuário não encontrado'}), 404
        
        if not request.is_json:
            return jsonify({'message': 'Content-Type deve ser application/json'}), 400
        
        data = request.get_json()
        if not data:
            return jsonify({'message': 'Dados não fornecidos'}), 400
        
        # Atualiza campos se fornecidos
        if 'username' in data:
            username = data['username'].strip()
            if not validate_username(username):
                return jsonify({
                    'message': 'Username inválido. Use apenas letras, números e underscore (3-30 caracteres)'
                }), 400
            
            # Verifica se username já existe (exceto o próprio usuário)
            existing_user = User.query.filter(
                User.username == username,
                User.id != user_id
            ).first()
            if existing_user:
                return jsonify({'message': 'Username já existe'}), 400
            
            user.username = username
        
        if 'email' in data:
            email = data['email'].strip().lower()
            if not validate_email(email):
                return jsonify({'message': 'Email inválido'}), 400
            
            # Verifica se email já existe (exceto o próprio usuário)
            existing_user = User.query.filter(
                User.email == email,
                User.id != user_id
            ).first()
            if existing_user:
                return jsonify({'message': 'Email já existe'}), 400
            
            user.email = email
        
        if 'password' in data:
            password = data['password']
            if len(password) < 6:
                return jsonify({'message': 'Senha deve ter pelo menos 6 caracteres'}), 400
            user.set_password(password)
        
        if 'is_active' in data:
            user.is_active = bool(data['is_active'])
        
        if 'is_admin' in data:
            # Não permite remover admin do próprio usuário
            if user_id == current_user.id and not data['is_admin']:
                return jsonify({'message': 'Não é possível remover privilégios de admin de si mesmo'}), 400
            user.is_admin = bool(data['is_admin'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Usuário atualizado com sucesso',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Erro interno do servidor'}), 500

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(current_user, user_id):
    """Deleta usuário (apenas admin)"""
    try:
        # Não permite deletar a si mesmo
        if user_id == current_user.id:
            return jsonify({'message': 'Não é possível deletar sua própria conta'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'Usuário não encontrado'}), 404
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'Usuário deletado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Erro interno do servidor'}), 500

@user_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Busca perfil do usuário logado"""
    return jsonify({'user': current_user.to_dict()}), 200

@user_bp.route('/profile', methods=['PUT'])
@token_required
@validate_json_data(['current_password'])
def update_profile(current_user, data):
    """Atualiza perfil do usuário logado"""
    try:
        current_password = data['current_password']
        
        # Verifica senha atual
        if not current_user.check_password(current_password):
            return jsonify({'message': 'Senha atual incorreta'}), 400
        
        # Atualiza campos se fornecidos
        if 'new_password' in data:
            new_password = data['new_password']
            if len(new_password) < 6:
                return jsonify({'message': 'Nova senha deve ter pelo menos 6 caracteres'}), 400
            current_user.set_password(new_password)
        
        if 'email' in data:
            email = data['email'].strip().lower()
            if not validate_email(email):
                return jsonify({'message': 'Email inválido'}), 400
            
            # Verifica se email já existe
            existing_user = User.query.filter(
                User.email == email,
                User.id != current_user.id
            ).first()
            if existing_user:
                return jsonify({'message': 'Email já existe'}), 400
            
            current_user.email = email
        
        db.session.commit()
        
        return jsonify({
            'message': 'Perfil atualizado com sucesso',
            'user': current_user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Erro interno do servidor'}), 500

@user_bp.route('/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    """Altera a senha do usuário logado"""
    try:
        data = request.get_json()
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'message': 'Senha atual e nova senha são obrigatórias'}), 400
        
        # Verifica senha atual
        if not current_user.check_password(current_password):
            return jsonify({'message': 'Senha atual incorreta'}), 401
        
        # Valida nova senha
        if len(new_password) < 6:
            return jsonify({'message': 'Nova senha deve ter pelo menos 6 caracteres'}), 400
        
        # Atualiza senha
        current_user.set_password(new_password)
        db.session.commit()
        
        return jsonify({'message': 'Senha alterada com sucesso!'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Erro ao alterar senha'}), 500