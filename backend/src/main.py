"""
Backend principal do Chatbot.
– Flask + SQLAlchemy + JWT + CORS
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, send_from_directory, jsonify
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
app.debug = os.getenv("FLASK_ENV") == "development"
app.config.update(
    PROPAGATE_EXCEPTIONS=True,
    TRAP_HTTP_EXCEPTIONS=True,
    TRAP_BAD_REQUEST_ERRORS=True,
)

# ─── Chaves / JWT ──────────────────────────────────────────
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "fallback_secret_key")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "change-me-in-prod")

# JWT configuration
app.config.update(
    JWT_TOKEN_LOCATION=["headers"],
    JWT_HEADER_NAME="Authorization",
    JWT_HEADER_TYPE="Bearer",
)
jwt = JWTManager(app)

# ─── Banco de Dados ────────────────────────────────────────
from models.user import db
from utils.database import init_database

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
        "http://localhost:5174",
        "https://leilaogpt-production.up.railway.app",
        "https://*.railway.app"
    ],
    supports_credentials=True,
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
    expose_headers=["Content-Type", "Authorization"]
)

# ─── Blueprints / Rotas ─────────────────────────────────────
from routes.auth import auth_bp
from routes.user import user_bp
from routes.chat import chat_bp
from routes.admin import admin_bp
from routes.admin_routes import admin_routes_bp
from routes.upload import upload_bp

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(user_bp, url_prefix="/api")
app.register_blueprint(chat_bp, url_prefix="/api/chat")
app.register_blueprint(admin_bp, url_prefix="/api/admin")
app.register_blueprint(admin_routes_bp, url_prefix="/")
app.register_blueprint(upload_bp, url_prefix="/api")

# ─── Debug das rotas ───────────────────────────────────────
print("🚀 Rotas registradas:")
for rule in app.url_map.iter_rules():
    if '/api/' in rule.rule:
        methods = ','.join(sorted(rule.methods - {'HEAD', 'OPTIONS'}))
        print(f"  [{methods}] {rule.rule}")

# ─── Healthcheck ───────────────────────────────────────────
@app.route("/health")
def health_check():
    return jsonify(
        status="healthy", 
        message="Backend Chatbot está funcionando!",
        environment=os.getenv("FLASK_ENV", "production")
    ), 200

# ─── Rota para testar API ──────────────────────────────────
@app.route("/api/test")
def test_api():
    return jsonify(
        message="API funcionando!",
        timestamp=str(datetime.utcnow())
    ), 200

# ─── SPA estático (opcional) ───────────────────────────────
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path: str):
    """
    Devolve arquivos do build do React.
    Se não encontrar, devolve index.html para suportar roteamento SPA.
    """
    static_folder = app.static_folder
    if not static_folder:
        return jsonify(error="No static folder configured"), 404
        
    requested = Path(static_folder) / path
    if path and requested.exists():
        return send_from_directory(static_folder, path)
    
    index_html = Path(static_folder) / "index.html"
    if index_html.exists():
        return send_from_directory(static_folder, "index.html")
    
    return jsonify(error="Frontend não encontrado"), 404

# ─── Import datetime para o test ───────────────────────────
from datetime import datetime

# ─── Execução direta ───────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)