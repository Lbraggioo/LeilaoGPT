import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import app
from src.models import db

with app.app_context():
    db.create_all()
