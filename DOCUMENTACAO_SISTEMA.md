# 🍎 Apple Academy Manager - Documentação do Sistema

## 1. Visão Geral
O **Apple Academy Manager** é um sistema web desenvolvido para gerenciar os recursos, alunos e equipamentos da Apple Developer Academy. O sistema centraliza o controle de inventário, empréstimos de devices e acompanhamento de alunos, oferecendo uma interface intuitiva para a administração.

## 2. Funcionalidades do Sistema

### 📊 Dashboard Administrativo
Painel central que oferece uma visão rápida do estado atual da Academy:
- **Métricas de Alunos:** Contagem total, dividida por modalidade (Regular e Foundation).
- **Estatísticas de Devices:**
  - Total de devices para empréstimo.
  - Devices atualmente emprestados vs. disponíveis.
  - Devices em manutenção.
  - Distribuição por tipo (Macbooks para Regular, iPads/iPhones para Foundation).
- **Monitoramento:**
  - Lista dos 5 empréstimos mais recentes.
  - Top 5 devices mais utilizados.
- **Biblioteca:**
  - Resumo de títulos no acervo.
  - Exemplares disponíveis para empréstimo.
  - Total de empréstimos de livros ativos.

### 📱 Controle de Equipamentos (Equipment Control)
Módulo dedicado ao gerenciamento detalhado dos dispositivos (MacBooks, iPads, iPhones, etc.):
- **Cadastro Completo:** Registro de número de série, modelo, cor, especificações (processador, memória, armazenamento).
- **Gestão de Status:** Controle de disponibilidade (Disponível, Emprestado, Manutenção).
- **Rastreabilidade:** Registro de responsável atual, local de armazenamento e convênio.
- **Sincronização Automática:** Integração inteligente com o módulo de empréstimos.
- **Exportação/Importação:** Suporte a planilhas Excel para cadastro em massa e relatórios.

### 📦 Inventário Geral
Gestão de patrimônio e outros ativos da Academy:
- Controle por número de tombamento.
- Registro de localização e carga.
- Status de etiquetagem.

### � Módulo de Biblioteca
Sistema completo para gestão do acervo bibliográfico e circulação de livros:
- **Catálogo de Livros:**
  - Cadastro de títulos com ISBN, autor, editora e ano.
  - Controle de múltiplas cópias (exemplares) por título.
  - Pesquisa rápida por título ou autor.
- **Gestão de Exemplares:**
  - Identificação única por código de barras.
  - Status individual (Disponível, Emprestado, Extraviado).
  - Ações de edição e exclusão de cópias.
- **Circulação:**
  - Realização de empréstimos para alunos.
  - Devolução simplificada com controle de prazos.
  - Histórico de movimentações.

### �🔐 Segurança e Acesso
- **Autenticação Segura:** Sistema de login protegido.
- **Controle de Permissões:** Acesso restrito a funcionalidades críticas (apenas Administradores).
- **Gestão de Conta:** Funcionalidade para alteração segura de senha.

---

## 3. Guia de Instalação e Execução

Este guia destina-se à equipe técnica para configuração do ambiente de desenvolvimento ou produção.

### Pré-requisitos
- **Python 3.8** ou superior.
- **MySQL Server** instalado e em execução.
- **Git** (para clonar o repositório).

### Passo a Passo

#### 1. Configuração do Ambiente
Clone o repositório e navegue até a pasta do projeto:
```bash
cd apple_academy_manager
```

Crie e ative o ambiente virtual (recomendado):
```bash
# Criar ambiente
python -m venv venv

# Ativar (Mac/Linux)
source venv/bin/activate

# Ativar (Windows)
venv\Scripts\activate
```

#### 2. Instalação de Dependências
Instale as bibliotecas necessárias listadas no `requirements.txt`:
```bash
pip install -r requirements.txt
```

#### 3. Configuração do Banco de Dados
1. Crie um banco de dados MySQL chamado `apple_academy`.
2. Crie um arquivo `.env` na raiz do projeto com as credenciais (use o modelo abaixo):

```env
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=apple_academy
DB_PORT=3306
SECRET_KEY=chave_secreta_segura_aqui
```

3. Inicialize as tabelas do banco de dados:
```bash
python database.py
```

#### 4. Executando a Aplicação
Inicie o servidor web:
```bash
python app.py
```
*O sistema estará acessível em: `http://localhost:5001`*

### Tecnologias Utilizadas
- **Backend:** Python com Framework Flask.
- **Banco de Dados:** MySQL (Conector `mysql-connector-python`).
- **Frontend:** HTML5, CSS3, Jinja2 Templates.
- **Análise de Dados:** Pandas (para manipulação de planilhas e relatórios).
- **Servidor WSGI:** Gunicorn (para produção).
