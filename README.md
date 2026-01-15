# Apple Academy Manager 🍎

Sistema completo para gerenciamento de alunos, equipamentos, empréstimos e biblioteca para a Apple Developer Academy.

## 🚀 Tecnologias

- **Backend:** Python (Flask)
- **Frontend:** React (Vite, TailwindCSS)
- **Banco de Dados:** MySQL / PostgreSQL (suporte híbrido)
- **Containerização:** Docker & Docker Compose

## 🛠️ Como Executar

### Pré-requisitos
- Docker Desktop
- Node.js (opcional, para desenvolvimento)
- Python 3.11+ (opcional, para desenvolvimento)

### Usando Docker (Recomendado)
1. Clone o repositório:
   ```bash
   git clone https://github.com/SEU_USUARIO/apple_academy_manager.git
   cd apple_academy_manager
   ```
2. Configure o arquivo `.env`:
   ```bash
   cp .env.example .env
   # Edite as variáveis conforme seu ambiente
   ```
3. Inicie os containers:
   ```bash
   docker compose up -d --build
   ```
4. Acesse o sistema:
   - Aplicação: [http://localhost](http://localhost)
   - API Backend: [http://localhost:5001](http://localhost:5001)

### Desenvolvimento Local (Vite)
1. Instale as dependências do frontend:
   ```bash
   cd client
   npm install
   npm run dev
   ```
2. O frontend estará disponível em [http://localhost:5173](http://localhost:5173).

## 📂 Estrutura do Projeto

- `/backend`: Código fonte da API Flask, rotas administrativas e lógica de banco.
- `/client`: Aplicação frontend React com Dashboard e controle de módulos.
- `/uploads`: Diretório para armazenamento de fotos de alunos e documentos.
- `docker-compose.yml`: Orquestração dos serviços de Backend e Client.

## 🔒 Segurança
O sistema utiliza `Flask-Login` para autenticação e `Flask-WTF` para proteção contra CSRF. As senhas são criptografadas usando `PBKDF2`.

## 📄 Licença
Este projeto é para uso exclusivo da Apple Developer Academy - IFCE.

---
Desenvolvido com ❤️ para a comunidade Academy.
