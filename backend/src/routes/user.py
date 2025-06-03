from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from src.models import db
from src.models.user import User
from flask_login import LoginManager, login_user, logout_user, login_required, current_user


user_bp = Blueprint('user', __name__)

# Inicializar o LoginManager
login_manager = LoginManager()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Rota para registro de usuário
@user_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Verificar se os campos necessários estão presentes
    if not all(k in data for k in ['username', 'email', 'password']):
        return jsonify({'error': 'Dados incompletos'}), 400
    
    # Verificar se o usuário ou email já existem
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Nome de usuário já existe'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email já está em uso'}), 400
    
    # Criar novo usuário
    hashed_password = generate_password_hash(data['password'])
    new_user = User(
        username=data['username'],
        email=data['email'],
        password=hashed_password
    )
    
    # Adicionar à base de dados
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'Usuário registrado com sucesso'}), 201

# Rota para login
@user_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Verificar se os campos necessários estão presentes
    if not all(k in data for k in ['email', 'password']):
        return jsonify({'error': 'Dados incompletos'}), 400
    
    # Buscar usuário pelo email
    user = User.query.filter_by(email=data['email']).first()
    
    # Verificar se o usuário existe e a senha está correta
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'error': 'Email ou senha inválidos'}), 401
    
    # Login do usuário
    login_user(user)
    
    return jsonify({
        'message': 'Login realizado com sucesso',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email
        }
    }), 200

# Rota para logout
@user_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logout realizado com sucesso'}), 200

# Rota para recuperação de senha (simplificada)
@user_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    
    # Verificar se o email está presente
    if 'email' not in data:
        return jsonify({'error': 'Email não fornecido'}), 400
    
    # Buscar usuário pelo email
    user = User.query.filter_by(email=data['email']).first()
    
    if not user:
        return jsonify({'error': 'Email não encontrado'}), 404
    
    # Em uma aplicação real, enviaríamos um email com um link para redefinição de senha
    # Aqui, apenas simulamos o processo
    
    return jsonify({'message': 'Instruções para redefinição de senha enviadas para o email'}), 200

# Rota para obter informações do usuário atual
@user_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    return jsonify({
        'id': current_user.id,
        'username': current_user.username,
        'email': current_user.email
    }), 200
