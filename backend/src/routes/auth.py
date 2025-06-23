from flask import Blueprint, request, jsonify
from models.user import db, User  # ← MUDANÇA: import sem ..
from utils.auth import token_required  # ← MUDANÇA: import sem .. e removido validate_json_data
import re

auth_bp = Blueprint("auth", __name__)


# ────────────────────────────────
# POST /auth/login - SIMPLIFICADO
# ────────────────────────────────
@auth_bp.route("/login", methods=["POST", "OPTIONS"])
def login():
    """Endpoint para login de usuários - SIMPLIFICADO"""
    
    # Trata OPTIONS para CORS
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        print("🔍 DEBUG: Iniciando login...")
        
        # Validação manual dos dados
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
        
        print(f"🔍 DEBUG: Username recebido: '{username}'")
        print(f"🔍 DEBUG: Password length: {len(password)}")

        # Busca usuário por username ou email
        print("🔍 DEBUG: Buscando usuário no banco...")
        user = User.query.filter(
            (User.username == username) | (User.email == username)
        ).first()

        if not user:
            print("❌ DEBUG: Usuário não encontrado")
            return jsonify({"message": "Usuário não encontrado"}), 401
        
        print(f"✅ DEBUG: Usuário encontrado: {user.username} ({user.email})")
        print(f"🔍 DEBUG: User is_active: {user.is_active}")
        print(f"🔍 DEBUG: User is_admin: {user.is_admin}")

        if not user.is_active:
            print("❌ DEBUG: Conta desativada")
            return jsonify({"message": "Conta desativada"}), 401

        print("🔍 DEBUG: Verificando senha...")
        try:
            password_check = user.check_password(password)
            print(f"🔍 DEBUG: Password check result: {password_check}")
        except Exception as e:
            print(f"❌ DEBUG: Erro na verificação de senha: {e}")
            return jsonify({"message": "Erro na verificação de senha"}), 500

        if not password_check:
            print("❌ DEBUG: Senha incorreta")
            return jsonify({"message": "Senha incorreta"}), 401

        print("✅ DEBUG: Senha correta! Atualizando último login...")
        try:
            user.update_last_login()
            print("✅ DEBUG: Último login atualizado")
        except Exception as e:
            print(f"⚠️ DEBUG: Erro ao atualizar último login: {e}")
            # Continua mesmo com erro no update

        print("🔍 DEBUG: Gerando token...")
        try:
            token = user.generate_token()
            print(f"✅ DEBUG: Token gerado com sucesso (length: {len(token)})")
        except Exception as e:
            print(f"❌ DEBUG: Erro ao gerar token: {e}")
            return jsonify({"message": "Erro ao gerar token"}), 500

        print("✅ DEBUG: Login realizado com sucesso!")
        return (
            jsonify(
                {
                    "token": token,
                    "user": {"email": user.email},
                }
            ),
            200,
        )

    except Exception as e:
        print(f"🚨 DEBUG: Erro geral no login: {e}")
        print(f"🚨 DEBUG: Tipo do erro: {type(e)}")
        import traceback
        print(f"🚨 DEBUG: Traceback completo:")
        traceback.print_exc()
        return jsonify({"message": "Erro interno do servidor"}), 500
    
# ────────────────────────────────
# POST /auth/register
# ────────────────────────────────
@auth_bp.route("/register", methods=["POST", "OPTIONS"])
def register():
    if request.method == "OPTIONS":
        return "", 200
        
    data = request.get_json() or {}
    email    = data.get("email")
    username = data.get("username")
    password = data.get("password")

    if not (email and username and password):
        return jsonify({"msg": "email, username e password obrigatórios"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "E-mail já cadastrado"}), 400

    # passa password exigido pelo __init__
    user = User(email=email, username=username, password=password)
    # se o modelo não faz hash automático, faça:
    # user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({"msg": "Usuário criado"}), 201



# ────────────────────────────────
# GET /auth/me          – valida o token
# (mantém compat. com /verify-token se quiser)
# ────────────────────────────────
@auth_bp.route("/me", methods=["GET", "OPTIONS"])
@auth_bp.route("/verify-token", methods=["GET", "POST", "OPTIONS"])
@token_required
def me(current_user):
    """Retorna dados do usuário se o token for válido"""
    if request.method == "OPTIONS":
        return "", 200
    return jsonify({"user": {"email": current_user.email}}), 200


# ────────────────────────────────
# POST /auth/logout
# ────────────────────────────────
@auth_bp.route("/logout", methods=["POST", "OPTIONS"])
@token_required
def logout(current_user):
    """Logout (front apenas descarta o token, mas mantemos compatibilidade)"""
    if request.method == "OPTIONS":
        return "", 200
    return "", 204