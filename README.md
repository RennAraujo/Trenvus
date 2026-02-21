# Exchange Platform

Plataforma de câmbio digital segura e moderna, permitindo gestão de carteiras digitais (USD/TRV), conversão de moedas com taxa de 1%, transferências entre usuários e dados de mercado em tempo real.

![Tech Stack](https://img.shields.io/badge/Java-17-blue)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.2-green)
![React](https://img.shields.io/badge/React-18-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6)

## 🎨 Design System

O frontend foi completamente modernizado com um **Design System** próprio:

- **Paleta de Cores**: Tema dark sofisticado com roxo vibrante (`#a855f7`) como cor primária
- **Tipografia**: Inter para textos, JetBrains Mono para números/monospace
- **Componentes**: Cards, buttons, inputs, badges com estados consistentes
- **Animações**: Transições suaves, fade-ins, micro-interações
- **Responsividade**: Mobile-first com menu hamburguer

### Features de UI
- **Modo Privado**: Oculta valores sensíveis no dashboard
- **Balance Cards**: Cards de saldo elegantes com badges
- **Transaction List**: Lista de transações estilo fintech
- **Stat Cards**: Estatísticas com indicadores de variação
- **Empty States**: Estados vazios bem desenhados

## Tech Stack

### Backend
- **Java 17** & **Spring Boot 3.4.2**
- **Spring Security** (JWT RS256)
- **Spring Data JPA** & **PostgreSQL 16**
- **Flyway** - Migrações de banco
- **H2** - Banco de testes

### Frontend
- **React 18** & **TypeScript 5.4**
- **Vite 5.2** - Build tool
- **React Router DOM 6.22**
- **jsPDF** - Geração de PDFs
- **libphonenumber-js** - Validação de telefones

### Infraestrutura
- **Docker** & **Docker Compose**
- **Nginx** (serving do frontend + proxy reverso)
- **Maven** (build do backend)

## 🚀 Como Executar

### Pré-requisitos
- Docker & Docker Compose
- Java 17+ (execução local)
- Node.js 20+ (execução local)

### Docker (Recomendado)

1. **Configurar Ambiente**
   ```bash
   cp .env.example .env
   # Edite .env com suas configurações (JWT keys, etc.)
   ```

2. **Subir a Stack**
   ```bash
   docker-compose up --build -d
   ```

3. **Acessar**
   | Serviço | URL |
   |---------|-----|
   | Frontend | http://localhost:3000 |
   | Backend API | http://localhost:8080 |
   | Swagger UI | http://localhost:8080/swagger-ui.html |

### Execução Local

**Backend:**
```bash
./mvnw clean spring-boot:run
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Acesse http://localhost:5173
```

## 👤 Contas de Teste

Configure no `.env` ou `docker-compose.yml`:

```bash
TEST_ACCOUNT_ENABLED=true
TEST_ACCOUNTS="user1@test.com:123:ADMIN;user2@test.com:123:USER;user3@test.com:123:USER"
ADMIN_ACCOUNT_ENABLED=true
ADMIN_LOGIN_ENABLED=true
ADMIN_EMAIL=admin@trenvus.com
ADMIN_PASSWORD=admin123
```

| Conta | Email | Senha | Role |
|-------|-------|-------|------|
| Teste 1 | user1@test.com | 123 | ADMIN |
| Teste 2 | user2@test.com | 123 | USER |
| Teste 3 | user3@test.com | 123 | USER |
| Admin | admin@trenvus.com | admin123 | ADMIN |

## 📱 Funcionalidades

### 💰 Gestão de Carteira
- **Depósito**: Adicionar fundos em USD
- **Saldos**: Visualização de USD e TRV em tempo real
- **Modo Privado**: Ocultar valores sensíveis

### 💱 Câmbio
- **Conversão**: USD ↔ TRV
- **Taxa**: 1% por transação
- **Preview**: Visualização do valor líquido antes de confirmar

### 💸 Transferências
- **Envio**: Transferir TRV para outros usuários
- **Destinatário**: Busca por e-mail ou apelido (nickname)
- **Gratuito**: Zero taxas para transferências P2P

### 📱 QR Code Payments
- **Enviar**: Gerar QR code para pagamento
- **Receber**: Escanear QR e confirmar recebimento
- **Simulação**: Modo demo para testar sem segunda conta

### 📊 Dados de Mercado
- **Integração OKX**: Preços em tempo real
- **Pares**: BTC-USDT, ETH-USDT, SOL-USDT
- **Sparklines**: Gráficos de tendência
- **Order Book**: Visualização de bids/asks

### 📄 Extrato
- **Histórico**: Transações com filtros
- **Categorias**: Depósitos, conversões, transferências, QR payments
- **Export PDF**: Extrato em PDF com logo da Trenvus

### 👤 Perfil
- **Avatar**: Upload de imagem
- **Nickname**: Apelido único
- **Telefone**: Validação internacional
- **Senha**: Alteração segura

### 🔐 Admin
- **Gestão de Usuários**: Listar, editar roles
- **Carteiras**: Ajustar saldos
- **Taxas**: Visualizar renda de taxas

## 📁 Estrutura do Projeto

```
.
├── src/                          # Backend Java
│   └── main/java/trenvus/Exchange/
│       ├── auth/                 # Autenticação JWT
│       ├── exchange/             # Lógica de câmbio
│       ├── invoice/              # QR Code payments
│       ├── market/               # Integração OKX
│       ├── transfer/             # Transferências
│       ├── user/                 # Entidades de usuário
│       └── wallet/               # Carteiras
├── frontend/                     # Frontend React
│   └── src/
│       ├── pages/                # Páginas (Dashboard, Login, etc.)
│       ├── index.css             # Design System
│       └── api.ts                # Cliente HTTP
├── .agents/skills/               # Agentes especializados
│   ├── exchange-backend/         # Java/Spring Boot
│   ├── exchange-frontend/        # React/TypeScript
│   ├── exchange-security/        # Security/JWT
│   └── exchange-testing/         # QA/Tests
├── docker-compose.yml            # Orquestração
└── .env                          # Variáveis de ambiente
```

## 🤖 Agentes Especializados

O projeto inclui 4 agentes especializados em `.agents/skills/`:

- **exchange-backend**: Java/Spring Boot senior developer
- **exchange-frontend**: React/TypeScript senior developer
- **exchange-security**: Security engineer (JWT/auth)
- **exchange-testing**: QA/test engineer

Consulte `AGENTS.md` para detalhes completos.

## 🔒 Segurança

- **JWT RS256**: Par de chaves RSA para tokens
- **BCrypt**: Hash de senhas
- **Idempotency Keys**: Prevenção de duplicação
- **Optimistic Locking**: Prevenção de race conditions
- **CORS**: Configurável via `APP_CORS_ORIGINS`
- **SQL Injection**: Protegido por JPA/Hibernate

## 🧪 Testes

```bash
# Backend
./mvnw test

# Frontend
cd frontend
npm test
```

## 🛠️ Troubleshooting

### "Falha de rede ao acessar a API"
- Aguarde o backend inicializar (30s na primeira vez)
- Verifique logs: `docker-compose logs -f backend`
- Confirme CORS configurado corretamente

### Erros de JWT
- Verifique `JWT_PRIVATE_KEY_B64` e `JWT_PUBLIC_KEY_B64`
- Chaves devem ser Base64 de arquivos PEM

### Problemas de Migração Flyway
- Limpe volumes: `docker-compose down -v` (⚠️ perde dados)

## 📄 Licença

Este projeto é privado e proprietário.

---

Para mais detalhes, consulte `AGENTS.md`.
