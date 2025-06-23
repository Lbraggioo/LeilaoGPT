from flask import Blueprint, request, jsonify
from ..models.user import db, User
from ..utils.auth import token_required, validate_json_data
import re

auth_bp = Blueprint("auth", __name__)


# ────────────────────────────────
# POST /auth/login
# ────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
@validate_json_data(["username", "password"])
def login(data):
    """Endpoint para login de usuários"""
    try:
        username = data["username"].strip()
        password = data["password"]

        # Busca usuário por username ou email
        user = User.query.filter(
            (User.username == username) | (User.email == username)
        ).first()

        if not user:
            return jsonify({"message": "Usuário não encontrado"}), 401

        if not user.is_active:
            return jsonify({"message": "Conta desativada"}), 401

        if not user.check_password(password):
            return jsonify({"message": "Senha incorreta"}), 401

        # Atualiza último login
        user.update_last_login()

        # Gera token
        token = user.generate_token()

        return (
            jsonify(
                {
                    "token": token,
                    "user": {"email": user.email},  # usado pelo frontend
                }
            ),
            200,
        )

    except Exception:
        return jsonify({"message": "Erro interno do servidor"}), 500
    
# ────────────────────────────────
# POST /auth/register
# ────────────────────────────────
@auth_bp.route("/register", methods=["POST"])
def register():
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
@auth_bp.route("/me", methods=["GET"])
@auth_bp.route("/verify-token", methods=["GET", "POST"])
@token_required
def me(current_user):
    """Retorna dados do usuário se o token for válido"""
    return jsonify({"user": {"email": current_user.email}}), 200


# ────────────────────────────────
# POST /auth/logout
# ────────────────────────────────
@auth_bp.route("/logout", methods=["POST"])
@token_required
def logout(current_user):
    """Logout (front apenas descarta o token, mas mantemos compatibilidade)"""
    return "", 204