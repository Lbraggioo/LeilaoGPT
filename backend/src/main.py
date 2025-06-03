from flask import Flask, send_from_directory
from flask_cors import CORS
from datetime import timedelta
import os
import sys

from dotenv import load_dotenv
from src.models import db
from src.routes.user import user_bp, login_manager
from src.routes.chat import chat_bp

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../.env'))

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

is_local = os.getenv("FLASK_ENV", "development") != "production"

# 🛠️ CONFIG DE SESSÃO + SEGURANÇA
app.config.update(
    SECRET_KEY=os.getenv("SECRET_KEY", "default-secret-key"),
    SESSION_COOKIE_NAME='session',
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='None' if not is_local else 'Lax',
    SESSION_COOKIE_SECURE=False,  # <----- FORÇADO AQUI
    PERMANENT_SESSION_LIFETIME=timedelta(days=7)
)

# ✅ CORS HABILITADO COM ORIGEM DO FRONTEND
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

# 🧠 LOGIN
login_manager.login_view = 'user.login'
login_manager.init_app(app)

# 🗄️ BANCO DE DADOS
app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{os.getenv('DB_USERNAME', 'root')}:{os.getenv('DB_PASSWORD', 'password')}@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '3306')}/{os.getenv('DB_NAME', 'mydb')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
with app.app_context():
    db.create_all()

# 🌐 ROTAS
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(chat_bp, url_prefix='/api')

# SPA fallback
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if path and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        return send_from_directory(static_folder_path, 'index.html')

# 🔥 EXECUÇÃO
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
