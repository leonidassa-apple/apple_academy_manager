#!/bin/bash

# Script de Deploy para Apple Academy Manager

echo "🚀 Iniciando deploy..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Por favor, instale o Docker Desktop."
    exit 1
fi

echo "📦 Construindo a imagem Docker..."
docker-compose build

echo "🛑 Parando containers antigos..."
docker-compose down

echo "▶️ Iniciando a aplicação..."
docker-compose up -d

echo "✅ Deploy concluído! A aplicação deve estar rodando em http://localhost:5001"
echo "📝 Verifique os logs com: docker-compose logs -f"
