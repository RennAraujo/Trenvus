# Solução Definitiva para o Problema do .env no Windows

## O Problema

O Docker Desktop no Windows tem dificuldade em passar variáveis de ambiente longas (como as chaves JWT Base64) através da seção `environment:` do docker-compose.yml.

Isso causa:
- Backend em loop infinito
- Erro "Invalid JWT_PRIVATE_KEY_B64"
- Chaves vazias no container mesmo estando no .env local

## A Solução (3 passos simples)

### Passo 1: Copiar o docker-compose.envfile.yml para docker-compose.yml

Execute no terminal (Git Bash ou CMD):

```bash
cd E:/Code/Trenvus
copy docker-compose.envfile.yml docker-compose.yml
```

Ou manualmente:
1. Apague o arquivo `docker-compose.yml` atual
2. Renomeie `docker-compose.envfile.yml` para `docker-compose.yml`

### Passo 2: Criar o arquivo .env.backend

Execute este comando no terminal:

```bash
cd E:/Code/Trenvus

# Extrair as chaves do .env
grep "^JWT_PRIVATE_KEY_B64=" .env > .env.backend
grep "^JWT_PUBLIC_KEY_B64=" .env >> .env.backend

# Adicionar as outras variáveis
cat >> .env.backend << 'EOF'
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/exchange
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres
JWT_ISSUER=Trenvus
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_TTL_SECONDS=2592000
APP_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
APP_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:8080
TEST_ACCOUNT_ENABLED=true
TEST_ACCOUNTS=user1@test.com:123:USER;user2@test.com:123:USER;user3@test.com:123:USER
ADMIN_ACCOUNT_ENABLED=true
ADMIN_LOGIN_ENABLED=true
ADMIN_EMAIL=admin@trenvus.com
ADMIN_PASSWORD=admin123
JAVA_OPTS=-Xmx768m -Xms256m -XX:+UseContainerSupport -XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom -Dspring.main.banner-mode=off
SPRING_MAIN_BANNER_MODE=off
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_BOOT=INFO
LOGGING_LEVEL_TRENVUS_EXCHANGE=DEBUG
EOF
```

### Passo 3: Subir os containers

```bash
docker-compose down
docker-compose up --build -d
```

## Verificação

Após 30 segundos, verifique se funcionou:

```bash
# Ver se o backend está rodando
docker ps

# Ver logs (deve mostrar "Started ExchangeApplication" sem erros)
docker logs exchange-backend | tail -20

# Verificar se as chaves estão no container
docker exec exchange-backend printenv | findstr JWT
```

## Por que isso funciona?

O `env_file:` carrega as variáveis diretamente de um arquivo, em vez de passá-las inline. Isso:
- ✅ Não tem limite de tamanho das variáveis
- ✅ Funciona 100% no Windows
- ✅ Não depende de scripts complexos
- ✅ É o método recomendado pela Docker para variáveis longas

## Se precisar resetar tudo

```bash
docker-compose down -v
docker volume rm trenvus_pgdata 2>nul || true
docker-compose up --build -d
```

## Resumo dos arquivos

| Arquivo | Propósito |
|---------|-----------|
| `.env` | Seu arquivo local (nunca commitado) |
| `.env.backend` | Cópia das variáveis para o Docker ler |
| `docker-compose.yml` | Usa `env_file:` em vez de `environment:` |

---

**Nota:** Depois de fazer isso uma vez, o `git pull` não vai mais quebrar a aplicação, pois o `.env.backend` permanece na sua máquina e não é afetado pelo git.
