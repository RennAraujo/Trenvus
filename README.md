# Trenvus Exchange

Aplicação de exchange de criptomoedas com suporte a múltiplas moedas, carteiras digitais e sistema de pagamentos integrado.

## 🚀 Tecnologias

### Backend
- Java 17
- Spring Boot 3.4.2
- Spring Security com JWT
- PostgreSQL 16
- Flyway (migrations)
- Mercado Pago (pagamentos)

### Frontend
- React + TypeScript
- Vite
- Docker + Nginx

## 📋 Pré-requisitos

- Docker e Docker Compose
- Java 17 (para desenvolvimento local)
- Node.js 18+ (para desenvolvimento frontend)

## 🛠️ Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/RennAraujo/Trenvus.git
cd Trenvus
```

### 2. Configure as variáveis de ambiente

O projeto já vem com configurações padrão no `docker-compose.yml`, mas você pode personalizar criando um arquivo `.env`:

```bash
# Database
POSTGRES_DB=exchange
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# JWT (chaves já configuradas no docker-compose)
# SMTP (já configurado no docker-compose)
# Test Accounts (já configurado no docker-compose)
```

### 3. Inicie a aplicação

```bash
docker-compose up --build -d
```

A aplicação estará disponível em:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

## 👥 Contas de Teste

O sistema já vem configurado com contas de teste:

| Email | Senha | Role |
|-------|-------|------|
| user1@test.com | 123 | ADMIN |
| user2@test.com | 123 | USER |
| user3@test.com | 123 | USER |
| admin@trenvus.com | admin123 | ADMIN |

## 📧 Fluxo de Registro com Confirmação por Email

1. Usuário preenche o formulário de cadastro
2. Sistema envia email de confirmação
3. Usuário clica no link do email
4. Conta é criada após confirmação

### Configuração de Email

O email está configurado para usar Gmail SMTP:
- Email: testguide047@gmail.com
- Senha: App Password do Gmail

## 🔒 Segurança

- Autenticação JWT com chaves RSA
- CORS configurado para origens específicas
- Senhas criptografadas com BCrypt
- Tokens de confirmação com expiração (24h para registro, 1h para exclusão)

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais
- `users` - Usuários do sistema
- `wallets` - Carteiras digitais
- `transactions` - Transações financeiras
- `refresh_tokens` - Tokens de refresh JWT
- `pending_registrations` - Registros pendentes de confirmação
- `confirmation_tokens` - Tokens de confirmação de exclusão

## 🧪 Testes

```bash
# Backend
./mvnw test

# Frontend
cd frontend
npm test
```

## 📦 Estrutura do Projeto

```
Trenvus/
├── src/main/java/trenvus/Exchange/    # Código fonte Java
│   ├── auth/                          # Autenticação e autorização
│   ├── config/                        # Configurações
│   ├── email/                         # Serviço de email
│   ├── user/                          # Usuários e registro
│   ├── wallet/                        # Carteiras
│   └── ...
├── src/main/resources/                # Recursos e migrations
├── frontend/                          # Aplicação React
├── docker-compose.yml                 # Configuração Docker
└── README.md                          # Este arquivo
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é privado e de uso exclusivo.

## 📞 Suporte

Para suporte, entre em contato através do email: suporte@trenvus.com

---

**Nota**: Este projeto está em desenvolvimento ativo. Funcionalidades podem mudar sem aviso prévio.
