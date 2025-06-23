from functools import wraps
from flask import request, jsonify, current_app
from ..models.user import db, User  # ← CORRIGIDO: import relativo
import jwt

def token_required(f):
    """Decorator para verificar token JWT"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Verifica se o token está no header Authorization
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({'message': 'Token inválido'}), 401
        
        if not token:
            return jsonify({'message': 'Token não fornecido'}), 401
        
        try:
            # Decodifica o token
            payload = User.verify_token(token)
            if payload is None:
                return jsonify({'message': 'Token inválido ou expirado'}), 401
            
            # Busca o usuário no banco
            current_user = User.query.get(payload['user_id'])
            if not current_user or not current_user.is_active:
                return jsonify({'message': 'Usuário não encontrado ou inativo'}), 401
            
        except Exception as e:
            return jsonify({'message': 'Token inválido'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

def admin_required(f):
    """Decorator para verificar se o usuário é admin"""
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if not current_user.is_admin:
            return jsonify({'message': 'Acesso negado. Privilégios de administrador necessários.'}), 403
        return f(current_user, *args, **kwargs)
    
    return decorated

def validate_json_data(required_fields):
    """Decorator para validar dados JSON obrigatórios"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not request.is_json:
                return jsonify({'message': 'Content-Type deve ser application/json'}), 400
            
            data = request.get_json()
            if not data:
                return jsonify({'message': 'Dados JSON não fornecidos'}), 400
            
            missing_fields = [field for field in required_fields if field not in data or not data[field]]
            if missing_fields:
                return jsonify({
                    'message': f'Campos obrigatórios ausentes: {", ".join(missing_fields)}'
                }), 400
            
            return f(data, *args, **kwargs)
        
        return decorated
    return decorator