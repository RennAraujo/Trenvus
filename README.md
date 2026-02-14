# Exchange Platform

Plataforma de câmbio digital segura e moderna, permitindo gestão de carteiras e conversão de moedas (USD -> TRV).

## Tech Stack

### Backend
- **Java 17** & **Spring Boot 3.4.2**
- **Spring Security** (JWT RS256)
- **Spring Data JPA** & **PostgreSQL**
- **Flyway** para migrações de banco de dados
- **Swagger/OpenAPI** para documentação da API

### Frontend
- **React 19**
- **TypeScript**
- **Vite**
- **TailwindCSS** (ou similar, conforme implementado)

### Infraestrutura
- **Docker** & **Docker Compose**
- **Nginx** (Reverse Proxy para o frontend)

## Pré-requisitos

- Docker & Docker Compose
- Java 17+ (para execução local sem Docker)
- Node.js 20+ (para execução local sem Docker)

## Conta de Teste (Desenvolvimento)

Para facilitar o desenvolvimento e testes, contas de teste e uma conta admin podem ser criadas automaticamente na inicialização (via variáveis de ambiente no `docker-compose.yml` / `.env`):

**Contas teste (quando `TEST_ACCOUNT_ENABLED=true`)**
- `user@test.com` / `123` (apelido: `teste1`)
- `user2@test.com` / `123` (apelido: `teste2`)
- `user3@test.com` / `123` (apelido: `teste3`)

**Conta admin (quando `ADMIN_ACCOUNT_ENABLED=true`)**
- `admin@trenvus.local` / `admin123` (apelido: `Administrador`)

> **Nota**: O frontend possui um botão "Entrar com conta de teste" na tela de login que preenche e submete essas credenciais automaticamente.

## Troubleshooting

### Erro "Falha de rede ao acessar a API"
Se você encontrar este erro ao tentar logar:
1. Aguarde alguns segundos. O backend pode estar inicializando (especialmente a conexão com o banco de dados).
2. O frontend possui lógica de retry automático para erros 502/503/504.
3. Se o problema persistir, verifique os logs do backend:
   ```bash
   docker-compose logs -f backend
   ```

### Erro de CORS
Certifique-se de que a variável `APP_CORS_ORIGINS` no `docker-compose.yml` inclua a URL do seu frontend (ex: `http://localhost:3000` ou `http://localhost:5173`).

## Como Executar (Docker)

1. **Configuração de Ambiente**
   Copie o arquivo de exemplo e ajuste as variáveis se necessário (chaves JWT, credenciais de banco):
   ```bash
   cp .env.example .env
   ```

2. **Subir a Aplicação**
   Execute o comando na raiz do projeto:
   ```bash
   docker-compose up --build -d
   ```

3. **Acessar**
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:8080](http://localhost:8080)
   - **Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

## Como Executar (Localmente)

### Backend
```bash
./mvnw clean spring-boot:run
```
A API estará disponível em `http://localhost:8080`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
O frontend estará disponível em `http://localhost:5173`.

## Documentação da API

A documentação interativa está disponível via Swagger UI:
[http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

### Endpoints úteis (resumo)
- `POST /auth/register`: cria conta (email, senha, apelido, telefone)
- `POST /auth/login`: login com email e senha
- `POST /auth/test-login`: login com contas de teste (id 1..3)
- `POST /transfer/trv`: transferência TRV (destinatário por email ou apelido)
- `GET /me`: dados da conta autenticada
- `PUT /me/phone`: atualiza telefone da conta autenticada
- `PUT /me/password`: altera senha (senha atual + nova senha)

## Estrutura do Projeto

- `/src`: Código fonte do Backend (Java/Spring)
- `/frontend`: Código fonte do Frontend (React/Vite)
- `/docker-compose.yml`: Orquestração dos containers
- `/.env`: Variáveis de ambiente sensíveis (não commitado)

## Funcionalidades Principais

### Market Data & Visualization
- **Integração OKX**: Dados de mercado em tempo real (Tickers, Order Books, Candles) via API pública da OKX.
- **Sparklines**: Gráficos minimalistas e elegantes ao lado de cada moeda, permitindo visualização rápida da tendência de preços.
- **Auto-Refresh**: Atualização automática dos dados de mercado a cada 10 segundos para garantir informações sempre recentes.
- **Cache Inteligente**: O backend implementa cache com TTL alinhado ao frontend para otimizar chamadas à API externa.

### Autenticação & Segurança
- Login seguro com JWT.
- Conta de teste pré-configurada para desenvolvimento ágil.
- Proteção contra falhas de rede com retries automáticos.

### Conversão de Moedas
- Suporte a conversão USD <-> TRV.
- Taxa de serviço: **1%** por conversão (cobrada em USD).

- **Autenticação**: Login e Registro com JWT (registro exige apelido e telefone).
- **Carteira**: Depósito de USD e visualização de saldo.
- **Câmbio**: Conversão USD ↔ TRV (1:1 com taxa de 1%).
- **Extrato**: Histórico privado de transações.
- **Transferência**: Envio de TRV para outro usuário por **e-mail ou apelido**.
- **Minha conta**: Alterar telefone e senha (menu no topo ao passar o mouse no usuário).
- **Mercado**: Dados de mercado em tempo real (simulado/integrado).
- **Invoices (demo)**: Geração/leitura de QRCode (simulação).

## Licença

Este projeto é privado e proprietário.

