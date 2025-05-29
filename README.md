# Guia de Instalação e Uso do LeilãoGPT

## Visão Geral

O LeilãoGPT é uma aplicação web completa que transforma o assistente de leilões original em uma interface moderna e interativa, similar ao ChatGPT. A aplicação possui sistema de autenticação, histórico de conversas, tema claro/escuro e integração completa com a API da OpenAI.

## Estrutura do Projeto

O projeto está dividido em duas partes principais:

### Backend (Flask)

- **Tecnologias**: Flask, SQLAlchemy, MySQL, Flask-Login, Flask-Bcrypt
- **Funcionalidades**:
  - Sistema de autenticação (login, cadastro, recuperação de senha)
  - Armazenamento de histórico de conversas
  - Integração com a API da OpenAI
  - Endpoints RESTful para gerenciamento de conversas e mensagens

### Frontend (React)

- **Tecnologias**: React, TypeScript, Tailwind CSS, Framer Motion, Axios
- **Funcionalidades**:
  - Interface similar ao ChatGPT
  - Tema claro/escuro com persistência
  - Responsividade para dispositivos móveis
  - Animações suaves
  - Sugestões de perguntas iniciais
  - Histórico de conversas

## Como Executar o Projeto

### Requisitos

- Python 3.11+
- Node.js 20+
- MySQL

### Backend

1. Navegue até a pasta do backend:
   ```
   cd /caminho/para/LeilaoGPT/backend
   ```

2. Instale as dependências:
   ```
   pip install -r requirements.txt
   ```

3. Configure o banco de dados MySQL:
   - Certifique-se de que o MySQL está em execução
   - As credenciais padrão são:
     - Usuário: root
     - Senha: password
     - Banco de dados: mydb

4. Execute o servidor:
   ```
   python -m src.main
   ```

### Frontend

1. Navegue até a pasta do frontend:
   ```
   cd /caminho/para/LeilaoGPT/frontend
   ```

2. Instale as dependências:
   ```
   pnpm install
   ```

3. Execute o servidor de desenvolvimento:
   ```
   pnpm run dev
   ```

4. Acesse a aplicação em seu navegador:
   ```
   http://localhost:5173
   ```

## Importante: Sobre o arquivo index.html

O arquivo index.html na pasta public é um "esqueleto" que serve como ponto de entrada para a aplicação React. Este arquivo contém:
- Uma div com id="root" onde o React irá renderizar todo o conteúdo
- Um script que carrega o código JavaScript da aplicação

**Nota:** Este arquivo HTML não deve ser aberto diretamente no navegador. Para ver a aplicação funcionando, é necessário iniciar o servidor de desenvolvimento com `pnpm run dev` e acessar a aplicação através da URL fornecida (geralmente http://localhost:5173).

## Implantação em Produção

Para implantar a aplicação em produção, siga estas etapas:

1. Configure o backend:
   - Atualize a chave secreta em `src/main.py`
   - Configure um banco de dados MySQL de produção
   - Desative o modo de depuração

2. Configure o frontend:
   - Execute `pnpm run build` para gerar os arquivos estáticos
   - Copie os arquivos da pasta `dist` para o diretório `static` do backend

3. Configure um servidor web (Nginx, Apache) para servir a aplicação

## Funcionalidades Principais

### Autenticação

- Registro de usuário
- Login
- Recuperação de senha

### Chat

- Criação de novas conversas
- Histórico de conversas
- Envio e recebimento de mensagens
- Sugestões de perguntas iniciais

### Interface

- Tema claro/escuro
- Responsividade para dispositivos móveis
- Animações suaves
- Layout similar ao ChatGPT

## Considerações Finais

O LeilãoGPT foi desenvolvido seguindo as melhores práticas de desenvolvimento web, com foco em experiência do usuário, segurança e escalabilidade. A aplicação está pronta para uso e pode ser facilmente estendida com novas funcionalidades no futuro.
