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

Para facilitar o desenvolvimento e testes, uma conta administrativa é criada automaticamente na inicialização:
- **Email**: `user@test.com`
- **Senha**: `123`

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
- Taxas e taxas de serviço configuráveis.

- **Autenticação**: Login e Registro com JWT.
- **Carteira**: Depósito de USD e visualização de saldo.
- **Câmbio**: Conversão de USD para TRV (1:1 com taxa fixa de $0.50).
- **Extrato**: Histórico privado de transações.
- **Mercado**: Dados de mercado em tempo real (simulado/integrado).

## Licença

Este projeto é privado e proprietário.

