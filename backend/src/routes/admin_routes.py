from flask import Blueprint, request, jsonify, send_file, send_from_directory, Response
from models.user import db, User, Conversation, Message
from utils.auth import token_required, admin_required
import os
import mimetypes

admin_routes_bp = Blueprint('admin_routes', __name__)

@admin_routes_bp.route('/admin')
def admin_panel():
    """Serve a interface administrativa - SEM AUTENTICAÇÃO NA ROTA"""
    try:
        # Tenta primeiro com 'static' no caminho
        admin_html_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), 
            'static', 
            'admin.html'
        )
        
        # Se não encontrar, tenta sem 'static'
        if not os.path.exists(admin_html_path):
            admin_html_path = os.path.join(
                os.path.dirname(os.path.abspath(__file__)), 
                'admin.html'
            )
        
        # Verifica se o arquivo existe
        if not os.path.exists(admin_html_path):
            return jsonify({
                'error': 'Interface administrativa não encontrada',
                'path_checked': admin_html_path,
                'current_dir': os.path.dirname(os.path.abspath(__file__)),
                'files_in_dir': os.listdir(os.path.dirname(os.path.abspath(__file__)))
            }), 404
        
        # Lê e retorna o arquivo HTML
        with open(admin_html_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return Response(content, mimetype='text/html')
        
    except Exception as e:
        return jsonify({
            'error': 'Erro ao carregar interface administrativa',
            'details': str(e)
        }), 500

@admin_routes_bp.route('/admin.js')
def admin_js():
    """Serve o JavaScript da interface administrativa"""
    try:
        # Tenta primeiro com 'static' no caminho
        admin_js_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), 
            'static', 
            'admin.js'
        )
        
        # Se não encontrar, tenta sem 'static'
        if not os.path.exists(admin_js_path):
            admin_js_path = os.path.join(
                os.path.dirname(os.path.abspath(__file__)), 
                'admin.js'
            )
        
        # Verifica se o arquivo existe
        if not os.path.exists(admin_js_path):
            return jsonify({
                'error': 'JavaScript do admin não encontrado',
                'path_checked': admin_js_path
            }), 404
        
        # Lê e retorna o arquivo JS
        with open(admin_js_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return Response(content, mimetype='application/javascript')
        
    except Exception as e:
        return jsonify({
            'error': 'Erro ao carregar JavaScript',
            'details': str(e)
        }), 500

@admin_routes_bp.route('/admin/<path:filename>')
def admin_static(filename):
    """Serve arquivos estáticos adicionais do admin (CSS, imagens, etc)"""
    try:
        # Diretório base
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Tenta primeiro na pasta static
        static_dir = os.path.join(base_dir, 'static')
        if os.path.exists(os.path.join(static_dir, filename)):
            return send_from_directory(static_dir, filename)
        
        # Se não encontrar, tenta no diretório principal
        if os.path.exists(os.path.join(base_dir, filename)):
            return send_from_directory(base_dir, filename)
        
        return jsonify({'error': f'Arquivo {filename} não encontrado'}), 404
        
    except Exception as e:
        return jsonify({
            'error': 'Erro ao carregar arquivo',
            'details': str(e)
        }), 500

# Rota de debug para verificar a estrutura de arquivos
@admin_routes_bp.route('/admin/debug')
def admin_debug():
    """Rota de debug para verificar se os arquivos estão no lugar certo"""
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        static_dir = os.path.join(base_dir, 'static')
        
        # Lista arquivos no diretório de rotas
        files_in_routes = os.listdir(base_dir) if os.path.exists(base_dir) else []
        
        # Lista arquivos no diretório static (se existir)
        files_in_static = os.listdir(static_dir) if os.path.exists(static_dir) else []
        
        # Verifica existência dos arquivos principais
        admin_html_in_routes = 'admin.html' in files_in_routes
        admin_js_in_routes = 'admin.js' in files_in_routes
        admin_html_in_static = 'admin.html' in files_in_static
        admin_js_in_static = 'admin.js' in files_in_static
        
        return jsonify({
            'base_directory': base_dir,
            'static_directory': static_dir,
            'static_exists': os.path.exists(static_dir),
            'files_in_routes_dir': files_in_routes,
            'files_in_static_dir': files_in_static,
            'admin.html_location': {
                'in_routes': admin_html_in_routes,
                'in_static': admin_html_in_static
            },
            'admin.js_location': {
                'in_routes': admin_js_in_routes,
                'in_static': admin_js_in_static
            }
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Erro no debug',
            'details': str(e)
        }), 500