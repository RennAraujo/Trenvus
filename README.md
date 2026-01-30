# Exchange Platform

Plataforma de câmbio digital segura e moderna, permitindo gestão de carteiras e conversão de moedas (USD -> VPS).

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
   - **Frontend**: [http://localhost](http://localhost)
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

- **Autenticação**: Login e Registro com JWT.
- **Carteira**: Depósito de USD e visualização de saldo.
- **Câmbio**: Conversão de USD para VPS (1:1 com taxa fixa de $0.50).
- **Extrato**: Histórico privado de transações.
- **Mercado**: Dados de mercado em tempo real (simulado/integrado).

## Licença

Este projeto é privado e proprietário.
