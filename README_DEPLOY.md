# Guia de Deploy - Apple Academy Manager

Este guia descreve como implantar o sistema no servidor Mac Mini.

## Pré-requisitos no Servidor

- **Docker Desktop** instalado e rodando.
- **MySQL Local** rodando e acessível via `host.docker.internal`.
- Acesso à internet para baixar as dependências.

## Configuração Atual (Resgate de Dados)

O sistema foi configurado para rodar o backend e o frontend no Docker, mas consumindo o banco de dados **MySQL que já estava no seu sistema**. Isso garante que nenhum dado seja perdido.

1.  **Backend**: Conecta em `host.docker.internal:3306`.
2.  **Frontend**: Usa um proxy Nginx customizado para encaminhar chamadas `/api` para o backend.

## Passos para Deploy

1.  **Acessar a Pasta**:
    ```bash
    cd /Users/joaoleonidas/Documents/Projeto/apple_academy_manager
    ```

2.  **Executar**:
    ```bash
    docker compose up -d --build
    ```

3.  **Verificar**:
    Acesse `http://localhost` (Porta 80) para a versão de produção.
    Acesse `http://localhost:5173` para a versão de desenvolvimento (Vite).

## Solução de Problemas

- **Ver Logs**:
    ```bash
    docker compose logs -f
    ```
