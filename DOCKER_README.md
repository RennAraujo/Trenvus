# Trenvus - Comandos Docker Manuais

Este projeto usa Docker Compose para orquestração de containers.

## ⚠️ IMPORTANTE PARA WINDOWS

Se o backend entrar em loop infinito após `git pull`:

### Solução Rápida (Execute 1 vez):

```bash
# Git Bash
./fix-env-definitivo.sh

# Windows CMD
fix-env-definitivo.bat
```

### Por que isso acontece?

O Docker Desktop no Windows não passa variáveis longas (como JWT keys Base64) corretamente através da seção `environment:`.

A solução usa `env_file:` que é 100% confiável.

### Se o script não funcionar, faça manualmente:

1. **Use o docker-compose com env_file:**
   ```bash
   docker-compose -f docker-compose.envfile.yml up -d
   ```

2. **Ou crie o .env.backend manualmente:**
   ```bash
   # Copiar chaves do .env
   grep "^JWT_PRIVATE_KEY_B64=" .env > .env.backend
   grep "^JWT_PUBLIC_KEY_B64=" .env >> .env.backend
   
   # Adicionar restante das configs (veja FIX_ENV_DEFINITIVO.md)
   ```

---

## ⚡ Comandos Básicos

### Iniciar a aplicação
```bash
docker-compose up -d
```

### Parar a aplicação
```bash
docker-compose down
```

### Parar e remover volumes (limpa dados)
```bash
docker-compose down -v
```

### Rebuildar com alterações
```bash
docker-compose up --build -d
```

### Rebuildar sem cache
```bash
docker-compose build --no-cache
docker-compose up -d
```

## 🔧 Comandos Úteis

### Ver logs
```bash
# Backend
docker logs -f exchange-backend

# Frontend
docker logs -f exchange-frontend

# Banco
docker logs -f exchange-db
```

### Ver containers rodando
```bash
docker ps
```

### Reiniciar um serviço
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Acessar banco de dados
```bash
docker exec -it exchange-db psql -U postgres -d exchange
```

## 🚀 Primeira vez / Reset completo

1. Configure o `.env`:
   ```bash
   cp .env.example .env
   # Edite .env e adicione suas JWT keys
   ```

2. Inicie tudo:
   ```bash
   docker-compose up --build -d
   ```

3. Aguarde 30-60 segundos e acesse:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8080

## 📝 Configuração

### Variáveis obrigatórias no `.env`:
- `JWT_PRIVATE_KEY_B64` - Chave privada JWT (PKCS#8 DER, Base64)
- `JWT_PUBLIC_KEY_B64` - Chave pública JWT (X.509 DER, Base64)
- `POSTGRES_PASSWORD` - Senha do banco

### Gerar JWT keys:
```bash
# Linux/Mac
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
openssl pkcs8 -topk8 -inform PEM -outform DER -in private.pem -nocrypt | base64 -w 0
openssl rsa -pubin -in public.pem -outform DER | base64 -w 0

# Windows (Git Bash)
# Mesmos comandos acima
```

## 🐛 Troubleshooting

### Backend reiniciando (loop)
Verifique se JWT keys estão configuradas:
```bash
docker logs exchange-backend | tail -20
```

### Frontend não atualiza
Rebuild sem cache:
```bash
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Limpar tudo e começar do zero
```bash
docker-compose down -v
docker volume rm trenvus_pgdata 2>/dev/null || true
docker-compose up --build -d
```

## 📁 Arquivos

- `docker-compose.yml` - Configuração principal
- `docker-compose.envfile.yml` - Alternativa usando env_file
- `.env` - Variáveis de ambiente (não commitar)
- `.env.example` - Template de variáveis
