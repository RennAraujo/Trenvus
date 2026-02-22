# Exchange Platform - Guia para Agentes de IA

> Este documento contém informações precisas e atualizadas sobre a arquitetura, stack tecnológica e convenções do projeto Exchange Platform. Leia este arquivo antes de fazer qualquer modificação no código.

---

## Visão Geral do Projeto

O **Exchange Platform** é uma plataforma de câmbio digital que permite:
- Gestão de carteiras digitais (USD e TRV - Trenvus)
- Conversão de moedas (USD ↔ TRV) com taxa de 1%
- Transferências TRV entre usuários (por email ou apelido/nickname)
- QR Code payments (gerar e pagar invoices)
- Dados de mercado em tempo real (integração OKX)
- Painel administrativo para gestão de usuários e ajuste de saldos

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
| Spring Security | 6.x | Autenticação JWT (RS256) |
| Spring Data JPA | - | Persistência de dados |
| PostgreSQL | 16 | Banco de dados principal |
| Flyway | 10.x | Migrações de banco de dados |
| H2 | 2.x | Banco de dados para testes |
| SpringDoc OpenAPI | 2.8.9 | Documentação Swagger/OpenAPI |
| Maven | 3.9+ | Build e dependências |

### Frontend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | 18.2.x | Framework UI |
| TypeScript | ~5.4.5 | Linguagem com tipagem |
| Vite | 5.2.x | Build tool e dev server |
| React Router DOM | 6.22.x | Roteamento SPA |
| jsPDF | 4.2.x | Geração de PDFs |
| libphonenumber-js | 1.12.x | Validação de telefones |
| ESLint | 8.57.x | Linting |

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
│   │   ├── invoice/                      # QR Code payments
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
│       └── trenvus/Exchange/
│           ├── exchange/                 # Testes de conversão
│           ├── money/                    # Testes de cálculo monetário
│           └── transfer/                 # Testes de transferência
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
        ├── phone.ts            # Validação de telefone
        ├── main.tsx            # Ponto de entrada
        ├── App.tsx             # Componente raiz com rotas
        ├── Shell.tsx           # Layout principal com navegação
        ├── ProtectedRoute.tsx  # Guarda de rotas autenticadas
        ├── AdminRoute.tsx      # Guarda de rotas de admin
        └── pages/              # Componentes de página
            ├── Account.tsx
            ├── AdminUsers.tsx
            ├── Dashboard.tsx
            ├── InvoicesReceive.tsx
            ├── InvoicesSend.tsx
            ├── Landing.tsx
            ├── Login.tsx
            ├── Manifesto.tsx
            ├── Market.tsx
            ├── Register.tsx
            ├── Security.tsx
            ├── Statement.tsx
            └── Transfer.tsx
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

| Tipo | Email | Senha | Role |
|------|-------|-------|------|
| Teste 1 | user1@test.com | 123 | ADMIN |
| Teste 2 | user2@test.com | 123 | USER |
| Teste 3 | user3@test.com | 123 | USER |
| Admin | admin@trenvus.com | admin123 | ADMIN |

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
10. **Enums**: PascalCase para nome, UPPER_SNAKE_CASE para valores (ex: `UserRole.ADMIN`)

### Frontend (TypeScript/React)

1. **Componentes**: PascalCase (ex: `Dashboard.tsx`, `Login.tsx`)
2. **Hooks customizados**: prefixo `use` (ex: `useAuth`)
3. **Tipos/Interfaces**: PascalCase, preferir `type` sobre `interface`
4. **Funções utilitárias**: camelCase
5. **Páginas**: Dentro de `src/pages/`, nome descritivo
6. **API**: Todas as chamadas centralizadas em `api.ts`
7. **Mensagens i18n**: Chaves em camelCase com prefixo de contexto (ex: `dashboard.convert.title`)

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

### Executando Testes

```bash
# Todos os testes do backend
./mvnw test

# Testes específicos
./mvnw test -Dtest=ExchangeServiceTests

# Com relatório de cobertura
./mvnw test jacoco:report
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
- `id` (PK), `user_id` (FK), `type`, `usd_amount_cents`, `trv_amount_cents`, `fee_usd_cents`, `idempotency_key`, `created_at`

**Tabela `refresh_tokens`**:
- `id` (PK), `user_id` (FK), `token_hash`, `expires_at`, `revoked_at`, `created_at`

### Histórico de Migrações

| Versão | Descrição |
|--------|-----------|
| V1 | Schema inicial (users, wallets, transactions) |
| V2 | Tabela de refresh tokens |
| V3 | Coluna role em users |
| V4 | Renomeia VPS para TRV |
| V5 | Campo fee_source_user |
| V6 | Campos de perfil (nickname, phone) |
| V7 | Campo avatar_data_url |

---

## Segurança

### Autenticação JWT

- **Algoritmo**: RS256 (par de chaves RSA)
- **Tokens**: Access token (curta duração) + Refresh token (longa duração)
- **Chaves**: Configuradas via variáveis `JWT_PRIVATE_KEY_B64` e `JWT_PUBLIC_KEY_B64` (Base64 encoded PEM)

### Rotas Públicas

- `/auth/register`, `/auth/login`, `/auth/test-login`, `/auth/admin-login`
- `/auth/refresh`, `/auth/logout`, `/auth/test-accounts-status`
- `/swagger-ui/**`, `/v3/api-docs/**`, `/error`

### Autorização

- `/admin/**` requer role `ADMIN`
- Todas as outras rotas requerem autenticação

### CORS

Configurado via variável `APP_CORS_ORIGINS` (lista separada por vírgulas).

### Medidas de Segurança

1. **Senhas**: Sempre armazenadas com BCrypt (nunca em plain text)
2. **SQL Injection**: Protegido pelo JPA/Hibernate (prepared statements)
3. **Optimistic Locking**: Campo `version` na tabela `wallets` previne race conditions
4. **Idempotência**: Operações de conversão aceitam header `Idempotency-Key` para evitar duplicação
5. **Refresh Tokens**: Armazenados como hash SHA-256, suportam revogação

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
TEST_ACCOUNTS="user1@test.com:123:ADMIN;user2@test.com:123:USER"

# Conta admin
ADMIN_ACCOUNT_ENABLED=true
ADMIN_LOGIN_ENABLED=true
ADMIN_EMAIL=admin@trenvus.com
ADMIN_PASSWORD=admin123

# Mercado
MARKET_ASSETS=BTC-USDT,ETH-USDT,SOL-USDT
MARKET_CACHE_TTL_SECONDS=30
```

### Gerando Chaves JWT

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
base64 -w 0 private.pem  # para JWT_PRIVATE_KEY_B64
base64 -w 0 public.pem   # para JWT_PUBLIC_KEY_B64
```

---

## Internacionalização (i18n)

O frontend suporta dois idiomas:
- **pt-BR**: Português (padrão)
- **en**: Inglês

Arquivos de mensagens:
- `frontend/src/i18n.messages.ptBR.ts`
- `frontend/src/i18n.messages.en.ts`

Chaves seguem o padrão: `{contexto}.{subcontexto}.{acao}`
Exemplos: `dashboard.convert.title`, `errors.loadBalance`, `actions.save`

---

## API e Endpoints Principais

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/register` | Criar conta |
| POST | `/auth/login` | Login |
| POST | `/auth/test-login` | Login com conta de teste |
| POST | `/auth/admin-login` | Login como admin |
| POST | `/auth/refresh` | Renovar access token |
| POST | `/auth/logout` | Logout |

### Carteira
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/wallet` | Obter saldo |
| POST | `/wallet/deposit` | Depositar USD |

### Câmbio
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/exchange/convert` | USD → TRV |
| POST | `/exchange/convert-trv-to-usd` | TRV → USD |

### Transferências
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/transfer/trv` | Transferir TRV |

### Usuário
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/me` | Dados do usuário |
| PUT | `/me/phone` | Atualizar telefone |
| PUT | `/me/password` | Alterar senha |
| POST | `/me/avatar` | Upload de avatar |
| GET | `/transactions/private` | Extrato |

### Admin
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/admin/users` | Listar usuários |
| GET | `/admin/users/{id}/wallet` | Ver carteira |
| PUT | `/admin/users/{id}/wallet` | Ajustar saldo |
| PUT | `/admin/users/{id}/role` | Alterar role |
| GET | `/admin/users/{id}/fees` | Taxas recebidas |

### Mercado
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/market/tickers` | Preços |
| GET | `/market/orderbook` | Livro de ofertas |
| GET | `/market/candles` | Candlesticks |

### Invoices (QR Code)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/invoices/generate` | Gerar QR code |
| POST | `/invoices/pay` | Pagar invoice |
| POST | `/invoices/simulate-pay` | Simular pagamento |

---

## Dicas de Desenvolvimento

1. **A API usa centavos** para representar valores monetários (evita floating point)
2. **Idempotência**: Operações de conversão aceitam header `Idempotency-Key` para evitar duplicação
3. **Retry automático**: O frontend faz retry em erros 502/503/504 para lidar com startup do backend
4. **Mensagens de erro**: O backend retorna mensagens em português (ex: "saldo", "mínimo")
5. **Telefone**: Usa libphonenumber-js para validação e formatação
6. **Avatar**: Armazenado como data URL (base64), limite de 1MB
7. **Taxa de conversão**: 1% por transação (mínimo de 1 centavo)
8. **Taxa de transferência**: Zero (gratuito entre usuários)

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

---

## Agentes Especializados

O projeto inclui 4 agentes especializados para auxiliar no desenvolvimento:

```
.agents/skills/
├── exchange-backend/      # Java/Spring Boot Senior Developer
├── exchange-frontend/     # React/TypeScript Senior Developer
├── exchange-security/     # Security Engineer (JWT/Auth)
└── exchange-testing/      # QA/Test Engineer
```

### Como Usar

Durante o desenvolvimento, solicite ajuda aos agentes:

- **Backend**: "Consulte o agente de backend para implementar..."
- **Frontend**: "O agente de frontend deve criar o componente..."
- **Security**: "O agente de segurança deve revisar..."
- **Testing**: "O agente de testes deve cobrir..."

Cada agente contém:
- Especialização técnica detalhada
- Convenções de código específicas
- Padrões e boas práticas
- Exemplos de código
