import os
from dotenv import load_dotenv
from models.user import db, User

# Carrega variáveis de ambiente
load_dotenv()

def create_admin_user():
    """Cria usuário administrador padrão se não existir"""
    admin_username = os.getenv('ADMIN_USERNAME', 'admin')
    admin_password = os.getenv('ADMIN_PASSWORD', 'admin123')
    admin_email = os.getenv('ADMIN_EMAIL', 'admin@chatbot.com')
    
    # Verifica se já existe um admin por username OU email
    admin_user = User.query.filter(
        (User.username == admin_username) | (User.email == admin_email)
    ).first()
    
    if not admin_user:
        # Cria novo admin
        admin_user = User(
            username=admin_username,
            email=admin_email,
            password=admin_password,
            is_admin=True
        )
        db.session.add(admin_user)
        try:
            db.session.commit()
            print(f"✅ Usuário administrador criado: {admin_username}")
        except Exception as e:
            db.session.rollback()
            print(f"⚠️  Erro ao criar admin (pode já existir): {e}")
    else:
        print(f"✅ Usuário administrador já existe: {admin_user.username} ({admin_user.email})")
        
        # Garante que é admin e está ativo
        if not admin_user.is_admin or not admin_user.is_active:
            admin_user.is_admin = True
            admin_user.is_active = True
            try:
                db.session.commit()
                print("✅ Privilégios de admin atualizados")
            except Exception as e:
                db.session.rollback()
                print(f"⚠️  Erro ao atualizar admin: {e}")

def init_database(app):
    """Inicializa o banco de dados e cria usuário admin"""
    with app.app_context():
        try:
            db.create_all()
            create_admin_user()
        except Exception as e:
            print(f"⚠️  Aviso na inicialização do banco: {e}")
            # Continua a execução mesmo com erro