from flask import Blueprint, request, jsonify
from models.user import db, User
from utils.auth import token_required
import re

auth_bp = Blueprint("auth", __name__)

# ────────────────────────────────
# Debug middleware
# ────────────────────────────────
@auth_bp.before_request
def log_request():
    """Log todas as requisições para debug"""
    print(f"🔍 AUTH REQUEST: {request.method} {request.path}")
    print(f"🔍 CONTENT-TYPE: {request.content_type}")
    if request.is_json:
        print(f"🔍 JSON DATA: {request.get_json()}")

# ────────────────────────────────
# POST /auth/login
# ────────────────────────────────
@auth_bp.route("/login", methods=["POST", "OPTIONS"])
def login():
    """Endpoint para login de usuários"""
    # Handle preflight
    if request.method == "OPTIONS":
        return "", 200
        
    try:
        # Validação dos dados
        if not request.is_json:
            return jsonify({"message": "Content-Type deve ser application/json"}), 400
        
        data = request.get_json()
        if not data:
            return jsonify({"message": "Dados JSON não fornecidos"}), 400
        
        username = data.get("username")
        password = data.get("password")
        
        if not username or not password:
            return jsonify({"message": "Username e password são obrigatórios"}), 400
        
        username = username.strip()
        print(f"🔐 Tentativa de login: {username}")

        # Busca usuário por username ou email
        user = User.query.filter(
            (User.username == username) | (User.email == username)
        ).first()

        if not user:
            print(f"❌ Usuário não encontrado: {username}")
            return jsonify({"message": "Usuário não encontrado"}), 401

        if not user.is_active:
            print(f"❌ Conta desativada: {username}")
            return jsonify({"message": "Conta desativada"}), 401

        if not user.check_password(password):
            print(f"❌ Senha incorreta para: {username}")
            return jsonify({"message": "Senha incorreta"}), 401

        print(f"✅ Login bem-sucedido: {username}")
        
        # Atualiza último login
        try:
            user.update_last_login()
        except Exception as e:
            print(f"⚠️ Erro ao atualizar último login: {e}")

        # Gera token
        token = user.generate_token()

        return jsonify({
            "token": token,
            "user": {
                "email": user.email,
                "username": user.username,
                "is_admin": user.is_admin
            }
        }), 200

    except Exception as e:
        print(f"🚨 Erro no login: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": "Erro interno do servidor"}), 500

# ────────────────────────────────
# POST /auth/register
# ────────────────────────────────
@auth_bp.route("/register", methods=["POST"])
def register():
    """Registro de novos usuários"""
    try:
        data = request.get_json() or {}
        email = data.get("email")
        username = data.get("username")
        password = data.get("password")

        if not (email and username and password):
            return jsonify({"message": "email, username e password obrigatórios"}), 400

        # Validações
        if not re.match(r'^[a-zA-Z0-9_]{3,30}$', username):
            return jsonify({"message": "Username inválido. Use apenas letras, números e underscore (3-30 caracteres)"}), 400
        
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            return jsonify({"message": "Email inválido"}), 400
        
        if len(password) < 6:
            return jsonify({"message": "Senha deve ter pelo menos 6 caracteres"}), 400

        # Verifica se já existe
        if User.query.filter_by(email=email).first():
            return jsonify({"message": "E-mail já cadastrado"}), 400
            
        if User.query.filter_by(username=username).first():
            return jsonify({"message": "Username já existe"}), 400

        # Cria usuário
        user = User(email=email, username=username, password=password)
        db.session.add(user)
        db.session.commit()

        return jsonify({"message": "Usuário criado com sucesso"}), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"🚨 Erro no registro: {str(e)}")
        return jsonify({"message": "Erro ao criar usuário"}), 500

# ────────────────────────────────
# GET /auth/me
# ────────────────────────────────
@auth_bp.route("/me", methods=["GET"])
@token_required
def me(current_user):
    """Retorna dados do usuário autenticado"""
    return jsonify({
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "username": current_user.username,
            "is_admin": current_user.is_admin,
            "is_active": current_user.is_active
        }
    }), 200

# ────────────────────────────────
# POST /auth/logout
# ────────────────────────────────
@auth_bp.route("/logout", methods=["POST"])
@token_required
def logout(current_user):
    """Logout do usuário"""
    # Em uma implementação JWT simples, o logout é feito no frontend
    # removendo o token. Aqui podemos adicionar lógica adicional se necessário
    return jsonify({"message": "Logout realizado com sucesso"}), 200

# ────────────────────────────────
# GET /auth/verify-token (compatibilidade)
# ────────────────────────────────
@auth_bp.route("/verify-token", methods=["GET", "POST"])
@token_required
def verify_token(current_user):
    """Verifica se o token é válido (retrocompatibilidade)"""
    return me(current_user)