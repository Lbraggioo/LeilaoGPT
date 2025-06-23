from flask import Blueprint, request, jsonify
from ..models.user import db, User
from ..utils.auth import token_required
import re

auth_bp = Blueprint("auth", __name__)


# ────────────────────────────────
# POST /auth/login - DEFINITIVO
# ────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
def login():
    """Endpoint para login de usuários - DEFINITIVO"""
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

        return jsonify({
            "token": token,
            "user": {"email": user.email},
        }), 200

    except Exception as e:
        print(f"🚨 Erro no login: {e}")
        return jsonify({"message": "Erro interno do servidor"}), 500


# ────────────────────────────────
# POST /auth/register
# ────────────────────────────────
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email")
    username = data.get("username")
    password = data.get("password")

    if not (email and username and password):
        return jsonify({"msg": "email, username e password obrigatórios"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "E-mail já cadastrado"}), 400

    user = User(email=email, username=username, password=password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"msg": "Usuário criado"}), 201


# ────────────────────────────────
# GET /auth/me
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
    """Logout"""
    return "", 204