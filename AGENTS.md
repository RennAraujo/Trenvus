# Exchange Platform - Guia para Agentes de IA

> Este documento contém informações essenciais sobre a arquitetura, stack tecnológica e convenções do projeto Exchange Platform. Leia este arquivo antes de fazer qualquer modificação no código.

---

## Visão Geral do Projeto

O **Exchange Platform** é uma plataforma de câmbio digital segura e moderna que permite:
- Gestão de carteiras digitais (USD e TRV - Trenvus)
- Conversão de moedas (USD ↔ TRV) com taxa de 1%
- Transferências TRV entre usuários (por email ou apelido)
- Dados de mercado em tempo real (integração OKX)
- Painel administrativo para gestão de usuários

O projeto é dividido em dois módulos principais:
- **Backend**: API REST em Java 17 + Spring Boot 3.4.2
- **Frontend**: SPA em React 18 + TypeScript + Vite

---

## Stack Tecnológica

### Backend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Java | 17 | Linguagem principal |
| Spring Boot | 3.4.2 | Framework web |
| Spring Security | - | Autenticação JWT (RS256) |
| Spring Data JPA | - | Persistência de dados |
| PostgreSQL | 16 | Banco de dados principal |
| Flyway | - | Migrações de banco de dados |
| H2 | - | Banco de dados para testes |
| SpringDoc OpenAPI | 2.8.9 | Documentação Swagger/OpenAPI |

### Frontend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | 18 | Framework UI |
| TypeScript | ~5.4 | Linguagem com tipagem |
| Vite | 5.2 | Build tool e dev server |
| React Router DOM | 6.22 | Roteamento SPA |
| jsPDF | 4.2 | Geração de PDFs |
| libphonenumber-js | 1.12 | Validação de telefones |

### Infraestrutura
| Tecnologia | Propósito |
|------------|-----------|
| Docker | Containerização |
| Docker Compose | Orquestração local |
| Nginx | Reverse proxy e serving do frontend |
| Maven | Build e dependências do backend |
| npm | Gerenciamento de pacotes do frontend |

---

## Estrutura de Diretórios

```
.
├── pom.xml                     # Configuração Maven do backend
├── Dockerfile                  # Dockerfile do backend (multi-stage)
├── docker-compose.yml          # Orquestração completa (db + backend + frontend)
├── .env                        # Variáveis de ambiente (não versionado)
├── .env.example                # Template de variáveis de ambiente
├── mvnw / mvnw.cmd             # Maven Wrapper
│
├── src/
│   ├── main/java/trenvus/Exchange/
│   │   ├── ExchangeApplication.java      # Ponto de entrada Spring Boot
│   │   ├── admin/                        # Endpoints e serviços administrativos
│   │   ├── auth/                         # Autenticação, JWT, tokens, contas de teste
│   │   ├── config/                       # Configurações (Swagger, etc)
│   │   ├── exchange/                     # Lógica de conversão USD ↔ TRV
│   │   ├── market/                       # Dados de mercado (integração OKX)
│   │   ├── money/                        # Value objects para dinheiro
│   │   ├── security/                     # Configuração de segurança JWT
│   │   ├── transfer/                     # Transferências entre usuários
│   │   ├── tx/                           # Transações (entidade, repositório)
│   │   ├── user/                         # Usuários (entidade, repositório, /me)
│   │   ├── wallet/                       # Carteiras (entidade, serviço)
│   │   └── web/                          # Handlers de exceções globais
│   ├── main/resources/
│   │   ├── application.properties        # Configuração da aplicação
│   │   ├── static/                       # Arquivos estáticos
│   │   └── db/migration/                 # Scripts Flyway (V1__init.sql, etc)
│   └── test/java/                        # Testes unitários e de integração
│
└── frontend/
    ├── package.json            # Dependências npm
    ├── Dockerfile              # Dockerfile do frontend (multi-stage com Nginx)
    ├── nginx.conf              # Configuração Nginx (proxy para API)
    ├── vite.config.ts          # Configuração Vite
    ├── tsconfig.json           # Configuração TypeScript
    └── src/
        ├── api.ts              # Cliente HTTP e tipos da API
        ├── auth.tsx            # Contexto de autenticação React
        ├── i18n*.ts            # Internacionalização (pt-BR, en)
        ├── main.tsx            # Ponto de entrada
        ├── App.tsx             # Componente raiz com rotas
        ├── Shell.tsx           # Layout principal com navegação
        ├── ProtectedRoute.tsx  # Guarda de rotas autenticadas
        ├── AdminRoute.tsx      # Guarda de rotas de admin
        └── pages/              # Componentes de página
```

---

## Comandos de Build e Execução

### Backend (Maven)

```bash
# Compilar e rodar testes
./mvnw clean test

# Compilar sem testes
./mvnw clean package -DskipTests

# Rodar aplicação localmente (requer PostgreSQL local)
./mvnw spring-boot:run

# Build completo para produção
./mvnw clean package
```

### Frontend (npm)

```bash
cd frontend

# Instalar dependências
npm install

# Servidor de desenvolvimento (http://localhost:5173)
npm run dev

# Build de produção (gera /dist)
npm run build

# Preview do build de produção
npm run preview

# Linting
npm run lint
```

### Docker (Recomendado para desenvolvimento)

```bash
# Configurar ambiente
cp .env.example .env
# Editar .env com suas configurações

# Subir toda a stack
docker-compose up --build -d

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Parar tudo
docker-compose down

# Parar e remover volumes (limpa dados do banco)
docker-compose down -v
```

---

## Endpoints e Acesso

Após iniciar com Docker:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html

### Contas de Teste (quando habilitadas via env)

| Tipo | Email | Senha | Apelido |
|------|-------|-------|---------|
| Teste 1 | user@test.com | 123 | teste1 |
| Teste 2 | user2@test.com | 123 | teste2 |
| Teste 3 | user3@test.com | 123 | teste3 |
| Admin | admin@trenvus.local | admin123 | Administrador |

---

## Convenções de Código

### Backend (Java)

1. **Pacotes**: Todos os pacotes começam com `trenvus.Exchange`
2. **Classes**: PascalCase (ex: `ExchangeService`, `UserEntity`)
3. **Métodos e variáveis**: camelCase
4. **Constantes**: UPPER_SNAKE_CASE
5. **Records Java**: Usados para DTOs de request/response (ex: `AuthController.RegisterRequest`)
6. **Entidades JPA**: Sufixo `Entity` (ex: `UserEntity`, `WalletEntity`)
7. **Repositórios**: Sufixo `Repository` (ex: `UserRepository`)
8. **Serviços**: Sufixo `Service` (ex: `AuthService`)
9. **Controllers**: Sufixo `Controller` (ex: `AuthController`)

### Frontend (TypeScript/React)

1. **Componentes**: PascalCase (ex: `Dashboard.tsx`, `Login.tsx`)
2. **Hooks customizados**: prefixo `use` (ex: `useAuth`)
3. **Tipos/Interfaces**: PascalCase, preferir `type` sobre `interface`
4. **Funções utilitárias**: camelCase
5. **Páginas**: Dentro de `src/pages/`, nome descritivo
6. **API**: Todas as chamadas centralizadas em `api.ts`

---

## Estratégia de Testes

### Backend

- **Framework**: JUnit 5 + Spring Boot Test
- **Banco de testes**: H2 em memória (configurado em `src/test/resources/application.properties`)
- **Anotações principais**:
  - `@SpringBootTest` - Teste de integração completo
  - `@ActiveProfiles("test")` - Usa configuração de teste
  - `@Transactional` - Rollback automático após cada teste

```java
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ExchangeServiceTests {
    // ...
}
```

### Localização dos Testes

```
src/test/java/trenvus/Exchange/
├── ExchangeApplicationTests.java       # Teste de contexto Spring
├── exchange/
│   ├── ExchangeServiceTests.java       # Testes de conversão
│   └── FeeRecipientTests.java          # Testes de taxas
├── money/
│   └── MoneyCentsTests.java            # Testes de cálculo monetário
└── transfer/
    └── TransferServiceTests.java       # Testes de transferência
```

---

## Banco de Dados e Migrações

O projeto usa **Flyway** para migrações versionadas. Os scripts estão em `src/main/resources/db/migration/`.

### Convenções de Nomenclatura Flyway

- `V{versao}__{descricao}.sql` (dois underscores)
- Exemplos: `V1__init.sql`, `V2__refresh_tokens.sql`

### Schema Principal

**Tabela `users`**:
- `id` (PK), `email` (unique), `password_hash`, `nickname`, `phone`, `avatar_data_url`, `role`, `created_at`

**Tabela `wallets`**:
- `id` (PK), `user_id` (FK), `currency` (USD/TRV), `balance_cents`, `version` (optimistic locking)

**Tabela `transactions`**:
- `id` (PK), `user_id` (FK), `type`, `usd_amount_cents`, `fee_usd_cents`, `idempotency_key`, `created_at`

**Tabela `refresh_tokens`**:
- `token` (PK), `user_id` (FK), `expires_at`, `created_at`

---

## Segurança

### Autenticação JWT

- **Algoritmo**: RS256 (par de chaves RSA)
- **Tokens**: Access token (curta duração) + Refresh token (longa duração)
- **Chaves**: Configuradas via variáveis `JWT_PRIVATE_KEY_B64` e `JWT_PUBLIC_KEY_B64` (Base64 encoded)

### Rotas Públicas

- `/auth/register`, `/auth/login`, `/auth/test-login`, `/auth/admin-login`
- `/auth/refresh`, `/auth/logout`
- `/swagger-ui/**`, `/v3/api-docs/**`

### Autorização

- `/admin/**` requer role `ADMIN`
- Todas as outras rotas requerem autenticação

### CORS

Configurado via variável `APP_CORS_ORIGINS` (lista separada por vírgulas).

---

## Configuração de Ambiente

Variáveis essenciais em `.env`:

```bash
# Banco de dados
POSTGRES_DB=trenvus
POSTGRES_USER=trenvus
POSTGRES_PASSWORD=...

# JWT (Base64 encoded PEM)
JWT_PRIVATE_KEY_B64=...
JWT_PUBLIC_KEY_B64=...

# CORS
APP_CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Contas de teste (desenvolvimento)
TEST_ACCOUNT_ENABLED=true
ADMIN_ACCOUNT_ENABLED=true
ADMIN_LOGIN_ENABLED=true
ADMIN_EMAIL=admin@trenvus.local
ADMIN_PASSWORD=admin123
```

---

## Considerações de Segurança

1. **Nunca commite o arquivo `.env`** - Ele contém segredos (senhas, chaves JWT)
2. **Chaves JWT**: Use par RSA de 2048 bits ou mais. Gere com:
   ```bash
   openssl genrsa -out private.pem 2048
   openssl rsa -in private.pem -pubout -out public.pem
   base64 -w 0 private.pem  # para JWT_PRIVATE_KEY_B64
   base64 -w 0 public.pem   # para JWT_PUBLIC_KEY_B64
   ```
3. **Senhas**: Sempre armazenadas com BCrypt (nunca em plain text)
4. **SQL Injection**: Protegido pelo JPA/Hibernate (prepared statements)
5. **Optimistic Locking**: Campo `version` na tabela `wallets` previne race conditions

---

## Dicas de Desenvolvimento

1. **A API usa centavos** para representar valores monetários (evita floating point)
2. **Idempotência**: Operações de conversão aceitam header `Idempotency-Key` para evitar duplicação
3. **Retry automático**: O frontend faz retry em erros 502/503/504 para lidar com startup do backend
4. **Mensagens de erro**: O backend retorna mensagens em português (ex: "saldo", "mínimo")
5. **Telefone**: Usa libphonenumber-js para validação e formatação

---

## Solução de Problemas

### Erro "Falha de rede ao acessar a API"
- Aguarde o backend inicializar (especialmente na primeira vez com Docker)
- Verifique logs: `docker-compose logs -f backend`
- Confirme que as variáveis CORS incluem a origem do frontend

### Erros de migração Flyway
- Verifique se o banco não tem estado inconsistente
- Em desenvolvimento, pode limpar com: `docker-compose down -v` (apaga dados!)

### Problemas com JWT
- Verifique se as chaves Base64 estão corretas (sem quebras de linha)
- Confirme que está usando o par correto (private para assinar, public para verificar)
