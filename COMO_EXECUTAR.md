# 🚀 Como Executar a Aplicação Apple Academy Manager

## 📋 Pré-requisitos

1. **Python 3.8+** instalado
2. **MySQL** instalado e rodando
3. **Banco de dados** criado (apple_academy)

## 🔧 Passo a Passo

### 1. Ativar o Ambiente Virtual

```bash
# No terminal, navegue até a pasta do projeto
cd /Users/joaoleonidas/Documents/Projeto/apple_academy_manager

# Ative o ambiente virtual
source venv/bin/activate
```

Você verá `(venv)` no início da linha do terminal quando estiver ativo.

### 2. Instalar/Atualizar Dependências (se necessário)

```bash
pip install -r requirements.txt
```

### 3. Configurar o Banco de Dados

Certifique-se de que o arquivo `.env` está configurado corretamente:

```env
DB_HOST=localhost
DB_USER=apple_user
DB_PASSWORD=sua_senha_aqui
DB_NAME=apple_academy
DB_PORT=3306
SECRET_KEY=sua_chave_secreta_aqui
```

### 4. Inicializar o Banco de Dados (se for a primeira vez)

```bash
python database.py
```

Isso criará todas as tabelas necessárias.

### 5. Executar a Aplicação

```bash
python app.py
```

Ou usando Flask diretamente:

```bash
flask run --host=0.0.0.0 --port=5001
```

### 6. Acessar a Aplicação

Abra seu navegador e acesse:

```
http://localhost:5001
```

ou

```
http://127.0.0.1:5001
```

## 🛑 Para Parar a Aplicação

No terminal onde a aplicação está rodando, pressione:

```
Ctrl + C
```

## 📝 Notas Importantes

- A aplicação roda na **porta 5001** por padrão
- O modo **debug está ativado**, então você verá erros detalhados no navegador
- Certifique-se de que o MySQL está rodando antes de iniciar a aplicação
- O primeiro usuário precisa ser criado manualmente no banco de dados ou através da interface de administração

## 🔍 Verificar se está tudo OK

1. ✅ Ambiente virtual ativado (aparece `(venv)` no terminal)
2. ✅ MySQL rodando
3. ✅ Banco de dados `apple_academy` criado
4. ✅ Arquivo `.env` configurado
5. ✅ Dependências instaladas
6. ✅ Aplicação iniciada sem erros

## 🐛 Problemas Comuns

### Erro de conexão com MySQL
- Verifique se o MySQL está rodando
- Confirme as credenciais no arquivo `.env`
- Teste a conexão: `mysql -u apple_user -p apple_academy`

### Porta já em uso
- A porta 5001 pode estar ocupada
- Altere a porta no `app.py` (última linha) ou mate o processo que está usando a porta

### Módulo não encontrado
- Ative o ambiente virtual: `source venv/bin/activate`
- Instale as dependências: `pip install -r requirements.txt`

