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
Para facilitar o desenvolvimento e testes, uma conta administrativa é criada automaticamente na inicialização:
- **Email**: `user@test.com`
- **Senha**: `123`
- **libphonenumber-js** para validação de telefones

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
ADMIN_ACCOUNT_ENABLED=true
ADMIN_LOGIN_ENABLED=true
## 📱 Funcionalidades

### 💰 Gestão de Carteira
- **Depósito**: Adicionar fundos em USD (mínimo $10)
- **Saldos**: Visualização de USD e TRV em tempo real
- **Modo Privado**: Ocultar valores sensíveis

### 💱 Câmbio
- **Conversão**: USD ↔ TRV (taxa 1:1)
- **Taxa**: 1% por transação (cobrado em USD)
- **Preview**: Visualização do valor líquido antes de confirmar

### 💸 Transferências
- **Envio**: Transferir TRV para outros usuários
- **Destinatário**: Busca por e-mail ou apelido
- **Gratuito**: Zero taxas para transferências

### 📊 Dados de Mercado
- **Integração OKX**: Preços em tempo real
- **Pares**: BTC-USDT, ETH-USDT, XRP-USDT, USDT-BRL
- **Sparklines**: Gráficos de tendência minimalistas
- **Order Book**: Visualização de bids/asks
- Taxas e taxas de serviço configuráveis.

- **Autenticação**: Login e Registro com JWT.
- **Histórico**: Transações com filtros
- **Câmbio**: Conversão de USD para TRV (1:1 com taxa fixa de $0.50).
- **Categorias**: Depósitos, conversões, transferências
- **Perfil**: Avatar, nickname, telefone
- **Admin**: Gestão de usuários (role ADMIN)

## 📁 Estrutura do Projeto

```
.
├── src/                          # Backend Java
│   └── main/java/trenvus/Exchange/
│       ├── auth/                 # Autenticação JWT
│       ├── exchange/             # Lógica de câmbio
│       ├── market/               # Integração OKX
│       ├── transfer/             # Transferências
│       ├── user/                 # Entidades de usuário
│       └── wallet/               # Carteiras
├── frontend/                     # Frontend React
│   └── src/
│       ├── pages/                # Páginas (Dashboard, Login, etc.)
│       ├── index.css             # Design System
│       └── api.ts                # Cliente HTTP
├── docker-compose.yml            # Orquestração
└── .env                          # Variáveis de ambiente
```

## 🔒 Segurança

- **JWT RS256**: Par de chaves RSA para tokens
- **BCrypt**: Hash de senhas
- **Idempotency Keys**: Prevenção de duplicação
- **Optimistic Locking**: Prevenção de race conditions
- **CORS**: Configurável via `APP_CORS_ORIGINS`

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
