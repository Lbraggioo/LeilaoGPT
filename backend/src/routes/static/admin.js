// Configuração da API
const API_BASE_URL = window.location.port === '8080' 
    ? 'http://localhost:5000/api' 
    : window.location.origin + '/api';
let authToken = localStorage.getItem('admin-token');

// Estado da aplicação
let currentSection = 'dashboard';
let currentPage = 1;
let chartCreated = false;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
    showSection('dashboard');
});

// Verificação de autenticação
function checkAuth() {
    if (!authToken) {
        showLoginForm();
        return;
    }
    
    // Verifica se o token é válido
    fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Token inválido');
        }
        return response.json();
    })
    .then(data => {
        if (data.user) {
            // Buscar dados completos do usuário
            return fetch(`${API_BASE_URL}/profile`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
        }
        throw new Error('Usuário não encontrado');
    })
    .then(response => response.json())
    .then(userData => {
        if (userData.user && userData.user.is_admin) {
            document.getElementById('admin-name').textContent = userData.user.username;
            loadDashboard();
        } else {
            throw new Error('Usuário não é administrador');
        }
    })
    .catch(error => {
        console.error('Erro de autenticação:', error);
        showLoginForm();
    });
}

// Formulário de login
function showLoginForm() {
    document.body.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-md w-full space-y-8">
                <div>
                    <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-500">
                        <i class="fas fa-robot text-white text-xl"></i>
                    </div>
                    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Painel Administrativo
                    </h2>
                    <p class="mt-2 text-center text-sm text-gray-600">
                        Faça login para acessar o sistema
                    </p>
                </div>
                <form class="mt-8 space-y-6" onsubmit="login(event)">
                    <div class="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input id="login-username" name="username" type="text" required 
                                   class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" 
                                   placeholder="Username ou Email">
                        </div>
                        <div>
                            <input id="login-password" name="password" type="password" required 
                                   class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" 
                                   placeholder="Senha">
                        </div>
                    </div>

                    <div>
                        <button type="submit" 
                                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                                <i class="fas fa-lock text-blue-500 group-hover:text-blue-400"></i>
                            </span>
                            Entrar
                        </button>
                    </div>
                    
                    <div id="login-error" class="hidden text-red-600 text-sm text-center"></div>
                </form>
            </div>
        </div>
    `;
}

// Login
function login(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username, password: password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            authToken = data.token;
            localStorage.setItem('admin-token', authToken);
            
            // Verifica se o usuário é admin
            return fetch(`${API_BASE_URL}/profile`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
        } else {
            throw new Error(data.message || 'Erro ao fazer login');
        }
    })
    .then(response => response.json())
    .then(profileData => {
        if (profileData.user && profileData.user.is_admin) {
            location.reload();
        } else {
            throw new Error('Acesso negado. Apenas administradores podem acessar este painel.');
        }
    })
    .catch(error => {
        const errorDiv = document.getElementById('login-error');
        errorDiv.textContent = error.message || 'Erro ao fazer login';
        errorDiv.classList.remove('hidden');
        
        // Remove o token se não for admin
        localStorage.removeItem('admin-token');
        authToken = null;
    });
}

// Logout
function logout() {
    localStorage.removeItem('admin-token');
    location.reload();
}

// Event listeners
function setupEventListeners() {
    // Sidebar toggle
    document.getElementById('sidebar-toggle').addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('-translate-x-full');
    });
    
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('href').substring(1);
            showSection(section);
        });
    });
}

// Mostrar seção
function showSection(section) {
    // Esconder todas as seções
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    
    // Mostrar seção selecionada
    const sectionElement = document.getElementById(`${section}-section`);
    if (sectionElement) {
        sectionElement.classList.remove('hidden');
    }
    
    // Atualizar navegação ativa
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('bg-blue-100', 'text-blue-600');
    });
    
    const activeLink = document.querySelector(`[href="#${section}"]`);
    if (activeLink) {
        activeLink.classList.add('bg-blue-100', 'text-blue-600');
    }
    
    currentSection = section;
    
    // Carregar dados da seção
    switch(section) {
        case 'dashboard':
            // Dashboard é carregado apenas na inicialização
            break;
        case 'users':
            loadUsers();
            break;
        case 'conversations':
            loadConversations();
            break;
        case 'settings':
            loadSettings();
            break;
        case 'backup':
            // Backup section doesn't need initial loading
            break;
    }
}

// Carregar dashboard
function loadDashboard() {
    showLoading();
    
    fetch(`${API_BASE_URL}/admin/dashboard`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        // Atualizar estatísticas
        document.getElementById('total-users').textContent = data.total_users || 0;
        document.getElementById('total-conversations').textContent = data.total_conversations || 0;
        document.getElementById('total-messages').textContent = data.total_messages || 0;
        document.getElementById('new-users').textContent = data.new_users_30d || 0;
        
        // Carregar usuários mais ativos
        loadTopUsers(data.top_users || []);
        
        // Carregar gráfico de atividade
        if (!chartCreated) {
            loadActivityChart(data.daily_activity || []);
            chartCreated = true;
        }
        
        hideLoading();
    })
    .catch(error => {
        console.error('Erro ao carregar dashboard:', error);
        hideLoading();
        showError('Erro ao carregar dados do dashboard');
    });
}

// Carregar usuários mais ativos
function loadTopUsers(users) {
    const container = document.getElementById('top-users');
    
    if (users.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center">Nenhum usuário ativo encontrado</p>';
        return;
    }
    
    container.innerHTML = users.map((user, index) => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    ${index + 1}
                </div>
                <div>
                    <p class="font-medium text-gray-800">${user.username}</p>
                    <p class="text-sm text-gray-600">${user.email}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="font-bold text-blue-600">${user.message_count}</p>
                <p class="text-xs text-gray-500">mensagens</p>
            </div>
        </div>
    `).join('');
}

// Carregar gráfico de atividade - VERSÃO CSS PURA
function loadActivityChart(data) {
    const container = document.getElementById('activity-chart');
    if (!container) {
        console.error('Container do gráfico não encontrado');
        return;
    }
    
    // Limpa o container
    container.innerHTML = '';
    
    // Se não há dados
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="flex items-center justify-center h-full text-gray-500">
                <p>Sem dados de atividade disponíveis</p>
            </div>
        `;
        return;
    }
    
    // Encontra o valor máximo para escala
    const maxValue = Math.max(...data.map(item => item.message_count || 0), 1);
    
    // Cria o gráfico usando HTML/CSS puro
    const chartHTML = `
        <div class="w-full h-full flex flex-col p-4">
            <!-- Área do gráfico -->
            <div class="flex-1 flex items-end justify-between gap-2" style="height: 200px;">
                ${data.map(item => {
                    const date = new Date(item.date);
                    const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    const value = item.message_count || 0;
                    const heightPercent = (value / maxValue) * 100;
                    
                    return `
                        <div class="flex-1 flex flex-col items-center justify-end">
                            <span class="text-xs font-bold text-gray-700 mb-1">${value}</span>
                            <div class="w-full bg-blue-500 rounded-t transition-all duration-500 hover:bg-blue-600" 
                                 style="height: ${heightPercent}%; min-height: 4px;"
                                 title="${value} mensagens em ${day}">
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <!-- Linha base -->
            <div class="border-t-2 border-gray-300 mt-2"></div>
            
            <!-- Labels das datas -->
            <div class="flex justify-between gap-2 mt-2">
                ${data.map(item => {
                    const date = new Date(item.date);
                    const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    return `<span class="flex-1 text-xs text-gray-600 text-center">${day}</span>`;
                }).join('')}
            </div>
        </div>
    `;
    
    container.innerHTML = chartHTML;
}

// Carregar usuários
function loadUsers(page = 1, search = '') {
    showLoading();
    
    const url = new URL(`${API_BASE_URL}/users`);
    url.searchParams.append('page', page);
    url.searchParams.append('per_page', 10);
    if (search) {
        url.searchParams.append('search', search);
    }
    
    fetch(url, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        loadUsersTable(data.users || []);
        loadUsersPagination(data.current_page, data.pages, data.total);
        hideLoading();
    })
    .catch(error => {
        console.error('Erro ao carregar usuários:', error);
        hideLoading();
        showError('Erro ao carregar usuários');
    });
}

// Carregar tabela de usuários
function loadUsersTable(users) {
    const tbody = document.getElementById('users-table');
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                    Nenhum usuário encontrado
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                        ${user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div class="text-sm font-medium text-gray-900">${user.username}</div>
                        ${user.is_admin ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Admin</span>' : ''}
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.email}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${user.is_active ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="editUser(${user.id})" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteUser(${user.id})" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Carregar paginação de usuários
function loadUsersPagination(currentPage, totalPages, totalItems) {
    const container = document.getElementById('users-pagination');
    
    let pagination = `
        <div class="text-sm text-gray-700">
            Mostrando ${Math.min((currentPage - 1) * 10 + 1, totalItems)} a ${Math.min(currentPage * 10, totalItems)} de ${totalItems} usuários
        </div>
        <div class="flex space-x-2">
    `;
    
    // Botão anterior
    if (currentPage > 1) {
        pagination += `<button onclick="loadUsers(${currentPage - 1})" class="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Anterior</button>`;
    }
    
    // Números das páginas
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        const isActive = i === currentPage;
        pagination += `
            <button onclick="loadUsers(${i})" 
                    class="px-3 py-1 border rounded-md text-sm ${isActive ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 hover:bg-gray-50'}">
                ${i}
            </button>
        `;
    }
    
    // Botão próximo
    if (currentPage < totalPages) {
        pagination += `<button onclick="loadUsers(${currentPage + 1})" class="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Próximo</button>`;
    }
    
    pagination += '</div>';
    container.innerHTML = pagination;
}

// Buscar usuários
function searchUsers() {
    const search = document.getElementById('user-search').value;
    loadUsers(1, search);
}

// Modal de criar usuário
function showCreateUserModal() {
    document.getElementById('create-user-modal').classList.remove('hidden');
}

function hideCreateUserModal() {
    document.getElementById('create-user-modal').classList.add('hidden');
    document.getElementById('create-user-form').reset();
}

// Criar usuário
function createUser(event) {
    event.preventDefault();
    
    const username = document.getElementById('new-username').value;
    const email = document.getElementById('new-email').value;
    const password = document.getElementById('new-password').value;
    const isAdmin = document.getElementById('new-is-admin').checked;
    
    fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            email: email,
            password: password,
            is_admin: isAdmin
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.user) {
            hideCreateUserModal();
            loadUsers();
            showSuccess('Usuário criado com sucesso!');
        } else {
            throw new Error(data.message || 'Erro ao criar usuário');
        }
    })
    .catch(error => {
        showError(error.message || 'Erro ao criar usuário');
    });
}

// Carregar conversas
function loadConversations() {
    showLoading();
    
    // Primeiro carrega a lista de usuários para o filtro
    fetch(`${API_BASE_URL}/users`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const select = document.getElementById('conversation-user-filter');
        select.innerHTML = '<option value="">Todos os usuários</option>';
        data.users.forEach(user => {
            select.innerHTML += `<option value="${user.id}">${user.username} (${user.email})</option>`;
        });
    });
    
    // Carrega as conversas
    const userId = document.getElementById('conversation-user-filter')?.value || '';
    const url = new URL(`${API_BASE_URL}/admin/conversations`);
    if (userId) {
        url.searchParams.append('user_id', userId);
    }
    
    fetch(url, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        loadConversationsTable(data.conversations || []);
        hideLoading();
    })
    .catch(error => {
        console.error('Erro ao carregar conversas:', error);
        hideLoading();
        showError('Erro ao carregar conversas');
    });
}

// Carregar tabela de conversas
function loadConversationsTable(conversations) {
    const tbody = document.getElementById('conversations-table');
    
    if (conversations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                    Nenhuma conversa encontrada
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = conversations.map(conv => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${conv.title}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${conv.username || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${conv.message_count || 0}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${conv.updated_at ? new Date(conv.updated_at).toLocaleDateString('pt-BR') : 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="deleteConversation(${conv.id})" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Deletar conversa
function deleteConversation(conversationId) {
    if (!confirm('Tem certeza que deseja deletar esta conversa?')) {
        return;
    }
    
    fetch(`${API_BASE_URL}/admin/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        loadConversations();
        showSuccess('Conversa deletada com sucesso!');
    })
    .catch(error => {
        showError('Erro ao atualizar usuário');
    });
}

// Deletar usuário
function deleteUser(userId) {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) {
        return;
    }
    
    fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        loadUsers();
        showSuccess('Usuário deletado com sucesso!');
    })
    .catch(error => {
        showError('Erro ao deletar usuário');
    });
}

// Utilitários
function showLoading() {
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

function showSuccess(message) {
    // Cria um toast de sucesso
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse';
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-check-circle mr-2"></i>
            ${message}
        </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showError(message) {
    // Cria um toast de erro
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse';
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-circle mr-2"></i>
            ${message}
        </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}


// Carregar configurações
function loadSettings() {
    showLoading();
    
    fetch(`${API_BASE_URL}/admin/system-info`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        loadSystemInfo(data.system || {});
        loadAppInfo(data.application || {});
        hideLoading();
    })
    .catch(error => {
        console.error('Erro ao carregar configurações:', error);
        hideLoading();
        showError('Erro ao carregar configurações');
    });
}

// Carregar informações do sistema
function loadSystemInfo(info) {
    const container = document.getElementById('system-info');
    container.innerHTML = `
        <div class="space-y-2">
            <div class="flex justify-between">
                <span class="text-gray-600">Plataforma:</span>
                <span class="font-medium">${info.platform || 'N/A'}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Python:</span>
                <span class="font-medium">${info.python_version || 'N/A'}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">CPUs:</span>
                <span class="font-medium">${info.cpu_count || 'N/A'}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Memória Total:</span>
                <span class="font-medium">${info.memory_total ? (info.memory_total / 1024 / 1024 / 1024).toFixed(2) + ' GB' : 'N/A'}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Uso do Disco:</span>
                <span class="font-medium">${info.disk_usage ? info.disk_usage.toFixed(1) + '%' : 'N/A'}</span>
            </div>
        </div>
    `;
}

// Carregar informações da aplicação
function loadAppInfo(info) {
    const container = document.getElementById('app-info');
    container.innerHTML = `
        <div class="space-y-2">
            <div class="flex justify-between">
                <span class="text-gray-600">OpenAI Configurado:</span>
                <span class="font-medium ${info.openai_configured ? 'text-green-600' : 'text-red-600'}">
                    ${info.openai_configured ? 'Sim' : 'Não'}
                </span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Assistant ID:</span>
                <span class="font-medium text-xs">${info.assistant_id || 'N/A'}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">CORS Origins:</span>
                <span class="font-medium text-xs">${info.cors_origins || 'N/A'}</span>
            </div>
        </div>
    `;
}

// Criar backup
function createBackup() {
    const button = document.getElementById('backup-btn');
    const status = document.getElementById('backup-status');
    
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Criando Backup...';
    
    fetch(`${API_BASE_URL}/admin/backup`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        status.innerHTML = `
            <div class="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                <i class="fas fa-check-circle mr-2"></i>
                Backup criado com sucesso!<br>
                <small>Arquivo: ${data.filename}</small><br>
                <small>Total de usuários: ${data.total_users}</small>
            </div>
        `;
        status.classList.remove('hidden');
    })
    .catch(error => {
        status.innerHTML = `
            <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <i class="fas fa-exclamation-circle mr-2"></i>
                Erro ao criar backup: ${error.message}
            </div>
        `;
        status.classList.remove('hidden');
    })
    .finally(() => {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-download mr-2"></i>Criar Backup Agora';
    });
}

// Modal de mudança de senha
function showChangePasswordModal() {
    document.getElementById('change-password-modal').classList.remove('hidden');
}

function hideChangePasswordModal() {
    document.getElementById('change-password-modal').classList.add('hidden');
    document.getElementById('change-password-form').reset();
}

// Mudar senha
function changePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validações
    if (newPassword !== confirmPassword) {
        showError('As senhas não coincidem!');
        return;
    }
    
    if (newPassword.length < 6) {
        showError('A nova senha deve ter pelo menos 6 caracteres!');
        return;
    }
    
    showLoading();
    
    fetch(`${API_BASE_URL}/change-password`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.message === 'Senha alterada com sucesso!') {
            hideChangePasswordModal();
            showSuccess('Senha alterada com sucesso!');
        } else {
            showError(data.message || 'Erro ao alterar senha');
        }
    })
    .catch(error => {
        hideLoading();
        showError('Erro ao alterar senha');
    });
}

// Editar usuário
function editUser(userId) {
    // Buscar dados do usuário
    fetch(`${API_BASE_URL}/users/${userId}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.user) {
            showEditUserModal(data.user);
        }
    })
    .catch(error => {
        showError('Erro ao buscar dados do usuário');
    });
}

function showEditUserModal(user) {
    // Cria um modal similar ao de criar usuário
    const modalHTML = `
        <div id="edit-user-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50">
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-800">Editar Usuário</h3>
                            <button onclick="document.getElementById('edit-user-modal').remove()" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <form onsubmit="updateUser(event, ${user.id})">
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Nome de Usuário</label>
                                    <input type="text" id="edit-username" value="${user.username}" required 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" id="edit-email" value="${user.email}" required 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Nova Senha (deixe em branco para manter)</label>
                                    <input type="password" id="edit-password" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>
                                
                                <div class="flex items-center">
                                    <input type="checkbox" id="edit-is-active" ${user.is_active ? 'checked' : ''} class="mr-2">
                                    <label for="edit-is-active" class="text-sm text-gray-700">Usuário Ativo</label>
                                </div>
                                
                                <div class="flex items-center">
                                    <input type="checkbox" id="edit-is-admin" ${user.is_admin ? 'checked' : ''} class="mr-2">
                                    <label for="edit-is-admin" class="text-sm text-gray-700">Usuário Administrador</label>
                                </div>
                            </div>
                            
                            <div class="flex space-x-3 mt-6">
                                <button type="button" onclick="document.getElementById('edit-user-modal').remove()" 
                                        class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                                    Cancelar
                                </button>
                                <button type="submit" 
                                        class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200">
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function updateUser(event, userId) {
    event.preventDefault();
    
    const updateData = {
        username: document.getElementById('edit-username').value,
        email: document.getElementById('edit-email').value,
        is_active: document.getElementById('edit-is-active').checked,
        is_admin: document.getElementById('edit-is-admin').checked
    };
    
    const password = document.getElementById('edit-password').value;
    if (password) {
        updateData.password = password;
    }
    
    fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.user) {
            document.getElementById('edit-user-modal').remove();
            loadUsers();
            showSuccess('Usuário atualizado com sucesso!');
        } else {
            showError(data.message || 'Erro ao atualizar usuário');
        }
    })
    .catch(error => {
        showError('Erro ao deletar usuário');
    });
}