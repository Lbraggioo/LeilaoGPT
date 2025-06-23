"""
Backend principal do Chatbot - LOGIN DIRETO NO MAIN.
– Flask + SQLAlchemy + JWT + CORS
– Login direto no main.py para evitar conflitos de Blueprint
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager

# Carrega variáveis de ambiente (.env)
load_dotenv()

# ───────────────────────────────────────────────────────────
# Instância do app Flask
# ───────────────────────────────────────────────────────────
app = Flask(
    __name__,
    static_folder=str(Path(__file__).parent / "routes" / "static"),
)

# Debug detalhado em desenvolvimento
app.debug = True
app.config.update(
    PROPAGATE_EXCEPTIONS=True,
    TRAP_HTTP_EXCEPTIONS=True,
    TRAP_BAD_REQUEST_ERRORS=True,
)

# ─── Chaves / JWT ──────────────────────────────────────────
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "fallback_secret_key")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "change-me-in-prod")

# JWT em cookies (permite HttpOnly + CSRF opcional)
app.config.update(
    JWT_TOKEN_LOCATION=["cookies"],
    JWT_ACCESS_COOKIE_PATH="/",
    JWT_COOKIE_SECURE=False,      # ➜ True em produção + HTTPS
    JWT_COOKIE_CSRF_PROTECT=False,
)
jwt = JWTManager(app)

# ─── Banco de Dados ────────────────────────────────────────
from .models.user import db, User
from .utils.database import init_database

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)
init_database(app)

# ─── CORS ───────────────────────────────────────────────────
CORS(
    app,
    origins=[
        "http://localhost:8080",
        "http://localhost:5173", 
        "https://leilaogpt-production.up.railway.app"
    ],
    supports_credentials=True,
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

# ─── LOGIN DIRETO NO MAIN ───────────────────────────────────
@app.route("/api/auth/login", methods=["POST"])
def login_direct():
    """Login direto no main.py - SOLUÇÃO DEFINITIVA"""
    try:
        print("🔍 LOGIN DIRETO: Iniciando...")
        
        # Validação dos dados
        if not request.is_json:
            print("❌ LOGIN DIRETO: Não é JSON")
            return jsonify({"message": "Content-Type deve ser application/json"}), 400
        
        data = request.get_json()
        if not data:
            print("❌ LOGIN DIRETO: Dados JSON vazios")
            return jsonify({"message": "Dados JSON não fornecidos"}), 400
        
        username = data.get("username")
        password = data.get("password")
        
        if not username or not password:
            print("❌ LOGIN DIRETO: Username ou password faltando")
            return jsonify({"message": "Username e password são obrigatórios"}), 400
        
        username = username.strip()
        print(f"🔍 LOGIN DIRETO: Username: {username}")

        # Busca usuário por username ou email
        user = User.query.filter(
            (User.username == username) | (User.email == username)
        ).first()

        if not user:
            print("❌ LOGIN DIRETO: Usuário não encontrado")
            return jsonify({"message": "Usuário não encontrado"}), 401
        
        print(f"✅ LOGIN DIRETO: Usuário encontrado: {user.email}")

        if not user.is_active:
            print("❌ LOGIN DIRETO: Conta desativada")
            return jsonify({"message": "Conta desativada"}), 401

        if not user.check_password(password):
            print("❌ LOGIN DIRETO: Senha incorreta")
            return jsonify({"message": "Senha incorreta"}), 401

        print("✅ LOGIN DIRETO: Senha correta!")

        # Atualiza último login
        try:
            user.update_last_login()
        except Exception as e:
            print(f"⚠️ LOGIN DIRETO: Erro ao atualizar último login: {e}")

        # Gera token
        token = user.generate_token()
        print("✅ LOGIN DIRETO: Token gerado!")

        return jsonify({
            "token": token,
            "user": {"email": user.email},
        }), 200

    except Exception as e:
        print(f"🚨 LOGIN DIRETO: Erro geral: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": "Erro interno do servidor"}), 500

# ─── OUTRAS ROTAS DE AUTH ───────────────────────────────────
@app.route("/api/auth/me", methods=["GET"])
def auth_me():
    """Verificação de token"""
    from .utils.auth import token_required
    
    @token_required
    def _me(current_user):
        return jsonify({"user": {"email": current_user.email}}), 200
    
    return _me()

# ─── Blueprints / Outras Rotas ─────────────────────────────
from .routes.user import user_bp
from .routes.chat import chat_bp
from .routes.admin import admin_bp
from .routes.admin_routes import admin_routes_bp
from .routes.upload import upload_bp

app.register_blueprint(user_bp, url_prefix="/api")
app.register_blueprint(chat_bp, url_prefix="/api/chat")
app.register_blueprint(admin_bp, url_prefix="/api/admin")
app.register_blueprint(admin_routes_bp, url_prefix="/")
app.register_blueprint(upload_bp, url_prefix="/api")

# ─── Debug das rotas ───────────────────────────────────────
print("🚀 Rotas registradas:")
for rule in app.url_map.iter_rules():
    if '/api/' in rule.rule or '/upload' in rule.rule:
        print(f"  {rule.methods} {rule.rule}")

# ─── SPA estático (opcional) ───────────────────────────────
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path: str):
    """
    Devolve arquivos do build do React.
    Se não encontrar, devolve index.html para suportar roteamento SPA.
    """
    static_folder = app.static_folder
    requested = Path(static_folder) / path
    if path and requested.exists():
        return send_from_directory(static_folder, path)
    index_html = Path(static_folder) / "index.html"
    if index_html.exists():
        return send_from_directory(static_folder, "index.html")
    return "index.html not found", 404

# ─── Healthcheck simples ───────────────────────────────────
@app.route("/health")
def health_check():
    return (
        jsonify(status="healthy", message="Backend Chatbot está funcionando!"),
        200,
    )

# ─── Execução direta ───────────────────────────────────────
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)