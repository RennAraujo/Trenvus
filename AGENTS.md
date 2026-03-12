# Trenvus Exchange - Guia para Agentes de IA

> Este documento contém informações precisas e atualizadas sobre a arquitetura, stack tecnológica e convenções do projeto Trenvus Exchange. Leia este arquivo antes de fazer qualquer modificação no código.

---

## Visão Geral do Projeto

O **Trenvus Exchange** é uma aplicação de exchange de criptomoedas com suporte a múltiplas moedas, carteiras digitais e sistema de pagamentos integrado.

### Funcionalidades Principais

- **Carteiras Digitais**: Gestão de saldos em USD e TRV (Trenvus Coin)
- **Conversão de Moedas**: USD ↔ TRV com taxa de 1% e cotação 1:1
- **Transferências**: Envio de TRV entre usuários (por email ou apelido/nickname)
- **Pagamentos QR Code**: Geração e pagamento de invoices via QR Code
- **Vouchers**: Sistema de vouchers/QR code para identificação de perfil
- **Dados de Mercado**: Cotações em tempo real (integração OKX via proxy Coinext)
- **Painel Administrativo**: Gestão de usuários, ajuste de saldos e visualização de taxas
- **Integração Mercado Pago**: Pagamentos em BRL
- **Verificação de Email**: Fluxo completo de registro com confirmação por email
- **Internacionalização**: Suporte a pt-BR e en

### Arquitetura

O projeto segue uma arquitetura de duas camadas:

- **Backend**: API REST em Java 17 + Spring Boot 3.4.2
- **Frontend**: SPA em React 18 + TypeScript + Vite
- **Infraestrutura**: Docker Compose com PostgreSQL, Nginx como reverse proxy

---

## Stack Tecnológica

### Backend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Java | 17 | Linguagem principal |
| Spring Boot | 3.4.2 | Framework web |
| Spring Security | 6.x | Autenticação JWT (RS256) |
| Spring Data JPA | - | Persistência de dados |
| Spring Validation | - | Validação de inputs |
| Spring Mail | - | Envio de emails |
| PostgreSQL | 16 | Banco de dados principal |
| Flyway | 10.x | Migrações de banco de dados |
| H2 | 2.x | Banco de dados para testes |
| SpringDoc OpenAPI | 2.8.9 | Documentação Swagger/OpenAPI |
| Mercado Pago SDK | 2.1.29 | Integração de pagamentos |
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
| qrcode.react | 4.2.0 | Geração de QR codes |
| ESLint | 8.57.x | Linting |

### Infraestrutura

| Tecnologia | Propósito |
|------------|-----------|
| Docker | Containerização |
| Docker Compose | Orquestração local |
| Nginx | Reverse proxy, serving do frontend e proxy para Coinext API |
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
├── .env.backend                # Variáveis de ambiente do backend (env_file)
├── mvnw / mvnw.cmd             # Maven Wrapper
│
├── src/
│   ├── main/java/trenvus/Exchange/
│   │   ├── ExchangeApplication.java      # Ponto de entrada Spring Boot
│   │   ├── admin/                        # Endpoints e serviços administrativos
│   │   │   ├── AdminUserController.java
│   │   │   └── AdminUserService.java
│   │   ├── auth/                         # Autenticação, JWT, tokens, contas de teste
│   │   │   ├── AuthController.java
│   │   │   ├── AuthService.java
│   │   │   ├── TokenService.java
│   │   │   ├── TokenBlacklistService.java
│   │   │   ├── RefreshTokenEntity.java
│   │   │   ├── RefreshTokenRepository.java
│   │   │   ├── RevokedTokenEntity.java
│   │   │   ├── RevokedTokenRepository.java
│   │   │   ├── TestAccountBootstrap.java
│   │   │   ├── TestAccountsConfig.java
│   │   │   ├── AdminAccountBootstrap.java
│   │   │   └── AdminAccountConfig.java
│   │   ├── config/                       # Configurações (Swagger, Email, Database)
│   │   │   ├── SwaggerConfig.java
│   │   │   ├── EmailConfig.java
│   │   │   ├── GlobalExceptionHandler.java
│   │   │   └── DatabaseHealthCheck.java
│   │   ├── email/                        # Serviço de envio de emails
│   │   │   └── EmailService.java
│   │   ├── exchange/                     # Lógica de conversão USD ↔ TRV
│   │   │   ├── ExchangeController.java
│   │   │   └── ExchangeService.java
│   │   ├── invoice/                      # QR Code payments
│   │   │   ├── InvoiceController.java
│   │   │   └── InvoiceService.java
│   │   ├── market/                       # Dados de mercado (integração OKX)
│   │   │   ├── MarketController.java
│   │   │   └── MarketDataService.java
│   │   ├── mercadopago/                  # Integração Mercado Pago
│   │   │   ├── MercadoPagoConfiguration.java
│   │   │   ├── MercadoPagoController.java
│   │   │   ├── MercadoPagoPaymentController.java
│   │   │   └── MercadoPagoService.java
│   │   ├── money/                        # Value objects para dinheiro
│   │   │   └── MoneyCents.java
│   │   ├── security/                     # Configuração de segurança JWT
│   │   │   ├── SecurityConfig.java
│   │   │   ├── JwtKeyMaterial.java
│   │   │   ├── BlacklistAwareJwtDecoder.java
│   │   │   └── SecurityUserDetailsService.java
│   │   ├── transfer/                     # Transferências entre usuários
│   │   │   ├── TransferController.java
│   │   │   └── TransferService.java
│   │   ├── tx/                           # Transações (entidade, repositório, email)
│   │   │   ├── TransactionController.java
│   │   │   ├── TransactionEntity.java
│   │   │   ├── TransactionRepository.java
│   │   │   ├── TransactionType.java
│   │   │   └── StatementEmailController.java
│   │   ├── user/                         # Usuários (entidade, repositório, /me)
│   │   │   ├── MeController.java
│   │   │   ├── UserController.java
│   │   │   ├── UserEntity.java
│   │   │   ├── UserRepository.java
│   │   │   ├── UserRole.java
│   │   │   ├── RegistrationService.java
│   │   │   ├── ConfirmationService.java
│   │   │   ├── ConfirmationToken.java
│   │   │   ├── ConfirmationTokenRepository.java
│   │   │   ├── PendingRegistration.java
│   │   │   └── PendingRegistrationRepository.java
│   │   ├── voucher/                      # Vouchers/QR code de perfil
│   │   │   ├── VoucherController.java
│   │   │   ├── VoucherEntity.java
│   │   │   ├── VoucherRepository.java
│   │   │   └── VoucherService.java
│   │   └── wallet/                       # Carteiras (entidade, serviço)
│   │       ├── WalletController.java
│   │       ├── WalletEntity.java
│   │       ├── WalletRepository.java
│   │       ├── WalletService.java
│   │       └── Currency.java
│   ├── main/resources/
│   │   ├── application.properties        # Configuração da aplicação
│   │   ├── static/                       # Arquivos estáticos
│   │   └── db/migration/                 # Scripts Flyway
│   │       ├── V1__init.sql
│   │       ├── V2__refresh_tokens.sql
│   │       ├── V3__user_roles.sql
│   │       ├── V4__rename_vps_to_trv.sql
│   │       ├── V5__fee_source_user.sql
│   │       ├── V6__user_profile_fields.sql
│   │       ├── V7__user_avatar.sql
│   │       ├── V8__create_confirmation_tokens.sql
│   │       ├── V8__email_verification_tokens.sql
│   │       ├── V9__create_pending_registrations.sql
│   │       ├── V10__create_revoked_tokens.sql
│   │       ├── V11__add_notes_to_transactions.sql
│   │       ├── V12__add_unique_nickname_constraint.sql
│   │       ├── V13__create_vouchers_table.sql
│   │       ├── V14__add_verified_to_users.sql
│   │       └── V15__add_target_user_id_to_transactions.sql
│   └── test/java/                        # Testes unitários e de integração
│       └── trenvus/Exchange/
│           ├── ExchangeApplicationTests.java       # Teste de contexto Spring
│           ├── auth/
│           │   ├── AuthIntegrationTest.java
│           │   └── AuthServiceTest.java
│           ├── exchange/
│           │   ├── ExchangeServiceTests.java       # Testes de conversão
│           │   └── FeeRecipientTests.java          # Testes de taxas
│           ├── money/
│           │   └── MoneyCentsTests.java            # Testes de cálculo monetário
│           └── transfer/
│               └── TransferServiceTests.java       # Testes de transferência
│
└── frontend/
    ├── package.json            # Dependências npm
    ├── Dockerfile              # Dockerfile do frontend (multi-stage com Nginx)
    ├── nginx.conf              # Configuração Nginx (proxy para API e Coinext)
    ├── vite.config.ts          # Configuração Vite
    ├── tsconfig.json           # Configuração TypeScript
    ├── eslint.config.js        # Configuração ESLint
    └── src/
        ├── api.ts              # Cliente HTTP e tipos da API
        ├── auth.tsx            # Contexto de autenticação React
        ├── phone.ts            # Validação de telefone
        ├── profileComplete.tsx # Contexto de perfil completo
        ├── i18n.tsx            # Configuração de internacionalização
        ├── i18n.messages.ptBR.ts   # Mensagens em português
        ├── i18n.messages.en.ts     # Mensagens em inglês
        ├── main.tsx            # Ponto de entrada
        ├── App.tsx             # Componente raiz com rotas
        ├── Shell.tsx           # Layout principal com navegação
        ├── ProtectedRoute.tsx  # Guarda de rotas autenticadas
        ├── AdminRoute.tsx      # Guarda de rotas de admin
        ├── index.css           # Estilos globais e CSS variables
        ├── components/         # Componentes reutilizáveis
        │   ├── ConvertConfirmationModal.tsx
        │   ├── DeleteAccountModal.tsx
        │   ├── ExportPdfModal.tsx
        │   ├── InvoiceModal.tsx
        │   ├── MercadoPagoModal.tsx
        │   ├── MercadoPagoReturnHandler.tsx
        │   ├── ProfileIncompleteOverlay.tsx
        │   ├── TermsModal.tsx
        │   └── TransferConfirmationModal.tsx
        ├── pages/              # Componentes de página
        │   ├── Account.tsx
        │   ├── AdminUsers.tsx
        │   ├── ConfirmRegistration.tsx
        │   ├── Dashboard.tsx
        │   ├── InvoicesReceive.tsx
        │   ├── InvoicesSend.tsx
        │   ├── Landing.tsx
        │   ├── Login.tsx
        │   ├── Manifesto.tsx
        │   ├── Market.tsx
        │   ├── PayInvoice.tsx
        │   ├── Register.tsx
        │   ├── Security.tsx
        │   ├── Statement.tsx
        │   ├── Transfer.tsx
        │   ├── VoucherCard.tsx
        │   └── VoucherView.tsx
        └── assets/             # Imagens e recursos estáticos
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
| Teste 1 | user1@test.com | 123 | USER |
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

### Design System (CSS)

Variáveis CSS definidas em `frontend/src/index.css`:

```css
:root {
  --color-primary: #a855f7;
  --color-secondary: #6366f1;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  
  --bg-primary: #0f0f1a;
  --bg-secondary: #1a1a2e;
  --bg-elevated: #252542;
  
  --text-primary: #ffffff;
  --text-secondary: #a0a0b0;
  --text-muted: #606070;
}
```

Classes de componentes:
- **Botões**: `btn btn-primary`, `btn btn-secondary`, `btn-success`, `btn-danger`, `btn-ghost`
- **Cards**: `card`, `card-header`, `card-body`, `card-footer`
- **Formulários**: `field`, `field-label`, `input`, `field-error`

---

## Estratégia de Testes

### Backend

- **Framework**: JUnit 5 + Spring Boot Test
- **Banco de testes**: H2 em memória (configurado em `src/test/resources/application-test.properties`)
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
├── auth/
│   ├── AuthIntegrationTest.java        # Testes de integração de auth
│   └── AuthServiceTest.java            # Testes unitários de AuthService
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
- `id` (BIGSERIAL PK), `email` (VARCHAR 255 UNIQUE), `password_hash` (VARCHAR 255)
- `nickname` (VARCHAR 64 UNIQUE), `phone` (VARCHAR 32), `avatar_data_url` (TEXT)
- `role` (VARCHAR 16), `verified` (BOOLEAN), `created_at` (TIMESTAMP)

**Tabela `wallets`**:
- `id` (BIGSERIAL PK), `user_id` (BIGINT FK), `currency` (VARCHAR 16)
- `balance_cents` (BIGINT), `version` (BIGINT - optimistic locking)
- Índice único: `ux_wallet_user_curr` em (user_id, currency)

**Tabela `transactions`**:
- `id` (BIGSERIAL PK), `user_id` (BIGINT FK), `type` (VARCHAR 32)
- `usd_amount_cents` (BIGINT), `trv_amount_cents` (BIGINT), `fee_usd_cents` (BIGINT)
- `idempotency_key` (VARCHAR 128), `created_at` (TIMESTAMP), `source_user_id` (BIGINT)
- `target_user_id` (BIGINT), `notes` (TEXT)
- Índice único: `ux_tx_user_idempotency_key` em (user_id, idempotency_key)

**Tabela `refresh_tokens`**:
- `id` (BIGSERIAL PK), `user_id` (BIGINT FK), `token_hash` (VARCHAR 64)
- `expires_at` (TIMESTAMP), `revoked_at` (TIMESTAMP), `created_at` (TIMESTAMP)
- Índice único: `ux_refresh_hash` em (token_hash)

**Tabela `revoked_tokens`**:
- `id` (BIGSERIAL PK), `token_hash` (VARCHAR 64 UNIQUE)
- `revoked_at` (TIMESTAMP), `expires_at` (TIMESTAMP)

**Tabela `confirmation_tokens`**:
- `id` (BIGSERIAL PK), `user_id` (BIGINT), `token` (VARCHAR 64 UNIQUE)
- `email` (VARCHAR 255), `token_type` (VARCHAR 32)
- `created_at` (TIMESTAMP), `expires_at` (TIMESTAMP), `used_at` (TIMESTAMP)
- Índices: `idx_confirmation_token`, `idx_confirmation_user_type`

**Tabela `pending_registrations`**:
- `id` (BIGSERIAL PK), `email` (VARCHAR 255), `password_hash` (VARCHAR 255)
- `nickname` (VARCHAR 64), `phone` (VARCHAR 32), `token` (VARCHAR 64 UNIQUE)
- `created_at` (TIMESTAMP), `expires_at` (TIMESTAMP)
- Índices: `idx_pending_registration_token`, `idx_pending_registration_email`

**Tabela `vouchers`**:
- `id` (BIGSERIAL PK), `code` (VARCHAR 64 UNIQUE), `user_id` (BIGINT FK)
- `active` (BOOLEAN), `created_at` (TIMESTAMP), `expires_at` (TIMESTAMP)
- Índice: `idx_voucher_user` em (user_id)

### Histórico de Migrações

| Versão | Arquivo | Descrição |
|--------|---------|-----------|
| V1 | V1__init.sql | Schema inicial (users, wallets, transactions) |
| V2 | V2__refresh_tokens.sql | Tabela de refresh tokens |
| V3 | V3__user_roles.sql | Coluna role em users |
| V4 | V4__rename_vps_to_trv.sql | Renomeia VPS para TRV |
| V5 | V5__fee_source_user.sql | Campo source_user_id em transactions |
| V6 | V6__user_profile_fields.sql | Campos nickname e phone em users |
| V7 | V7__user_avatar.sql | Campo avatar_data_url em users |
| V8 | V8__create_confirmation_tokens.sql | Tabela de tokens de confirmação |
| V8 | V8__email_verification_tokens.sql | Tabela de tokens de verificação de email |
| V9 | V9__create_pending_registrations.sql | Tabela de registros pendentes |
| V10 | V10__create_revoked_tokens.sql | Tabela de tokens revogados (blacklist) |
| V11 | V11__add_notes_to_transactions.sql | Campo notes em transactions |
| V12 | V12__add_unique_nickname_constraint.sql | Constraint UNIQUE em nickname |
| V13 | V13__create_vouchers_table.sql | Tabela de vouchers |
| V14 | V14__add_verified_to_users.sql | Campo verified em users |
| V15 | V15__add_target_user_id_to_transactions.sql | Campo target_user_id em transactions |

---

## Segurança

### Autenticação JWT

- **Algoritmo**: RS256 (par de chaves RSA)
- **Tokens**: Access token (curta duração) + Refresh token (longa duração)
- **Chaves**: Configuradas via variáveis `JWT_PRIVATE_KEY_B64` e `JWT_PUBLIC_KEY_B64` (Base64 encoded PEM)
- **Blacklist**: Tokens revogados são armazenados na tabela `revoked_tokens`

### Rotas Públicas

- `/auth/register`, `/auth/confirm-registration`, `/auth/login`, `/auth/test-login`, `/auth/admin-login`
- `/auth/refresh`, `/auth/logout`, `/auth/test-accounts-status`, `/auth/resend-confirmation`
- `/mercadopago/public-key`
- `/voucher/profile/{code}`
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
6. **Confirmação de Registro**: Tokens seguros de 32 bytes (Base64 URL-safe) com expiração de 24h
7. **Token Blacklist**: Access tokens revogados são mantidos em blacklist até expirarem
8. **Rate Limiting Implícito**: Retry automático no frontend para erros 502/503/504

---

## Configuração de Ambiente

Variáveis essenciais em `.env`:

```bash
# Banco de dados
POSTGRES_DB=exchange
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# JWT (Base64 encoded PEM)
JWT_PRIVATE_KEY_B64=...
JWT_PUBLIC_KEY_B64=...
JWT_ISSUER=Trenvus
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_TTL_SECONDS=2592000

# CORS
APP_CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Application URLs
APP_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:8080

# Contas de teste (desenvolvimento)
TEST_ACCOUNT_ENABLED=true
TEST_ACCOUNTS="user1@test.com:123:USER;user2@test.com:123:USER;user3@test.com:123:USER"

# Conta admin
ADMIN_ACCOUNT_ENABLED=true
ADMIN_LOGIN_ENABLED=true
ADMIN_EMAIL=admin@trenvus.com
ADMIN_PASSWORD=admin123

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=TEST-...
MERCADOPAGO_PUBLIC_KEY=TEST-...
MERCADOPAGO_RETURN_URL=http://localhost:3000/mercadopago/return

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=...
SMTP_PASSWORD=...
SMTP_FROM=noreply@trenvus.com

# Market Configuration
MARKET_ASSETS=BTC,ETH,USDT,SOL,ADA,DOT
MARKET_CACHE_TTL_SECONDS=60

# Security
ALLOWED_ORIGINS=*
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
| POST | `/auth/register` | Iniciar registro (envia email de confirmação) |
| GET | `/auth/confirm-registration` | Confirmar registro com token |
| POST | `/auth/login` | Login |
| POST | `/auth/test-login` | Login com conta de teste |
| POST | `/auth/admin-login` | Login como admin |
| POST | `/auth/refresh` | Renovar access token |
| POST | `/auth/logout` | Logout |
| POST | `/auth/revoke` | Revogar access token |
| POST | `/auth/resend-confirmation` | Reenviar email de confirmação |

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
| POST | `/me/delete` | Deletar conta (com confirmação) |
| GET | `/transactions/private` | Extrato |
| POST | `/transactions/send-statement-email` | Enviar extrato por email |

### Admin
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/admin/users` | Listar usuários |
| GET | `/admin/users/{id}/wallet` | Ver carteira |
| PUT | `/admin/users/{id}/wallet` | Ajustar saldo |
| PUT | `/admin/users/{id}/role` | Alterar role |
| GET | `/admin/users/{id}/fees` | Taxas recebidas |
| GET | `/admin/users/{id}/statement` | Extrato do usuário |

### Market
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/market/tickers` | Preços |
| GET | `/market/tickers/crypto` | Preços crypto |
| GET | `/market/tickers/fiat` | Preços fiat |
| GET | `/market/orderbook` | Livro de ofertas |
| GET | `/market/candles` | Candlesticks |

### Invoices (QR Code)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/invoices/generate` | Gerar QR code |
| POST | `/invoices/pay` | Pagar invoice |
| POST | `/invoices/simulate-pay` | Simular pagamento |

### Vouchers
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/voucher/generate` | Gerar voucher |
| GET | `/voucher/my` | Meu voucher atual |
| DELETE | `/voucher/my` | Desativar voucher |
| GET | `/voucher/profile/{code}` | Ver perfil público pelo voucher |

### Mercado Pago
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/mercadopago/public-key` | Chave pública do MP |
| POST | `/mercadopago/create-preference` | Criar preferência de pagamento |
| GET | `/mercadopago/payment/{id}` | Verificar status de pagamento |
| POST | `/mercadopago/webhook` | Webhook para notificações |

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
9. **Proxy Coinext**: O nginx configura proxy para `https://api.coinext.com.br:8443/` no path `/coinext/`
10. **Email**: Se SMTP não configurado, emails são logados no console
11. **Registro**: Novos usuários precisam confirmar email antes de acessar a conta
12. **Token Revogação**: Access tokens podem ser revogados via `/auth/revoke` para logout imediato

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

### Problemas com Mercado Pago
- Verifique se `MERCADOPAGO_ACCESS_TOKEN` e `MERCADOPAGO_PUBLIC_KEY` estão configurados
- Em ambiente de teste, use as credenciais de TEST do Mercado Pago

### Problemas com Email
- Verifique se as variáveis SMTP estão configuradas no docker-compose.yml
- Em desenvolvimento, emails são logados no console se SMTP não configurado

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
