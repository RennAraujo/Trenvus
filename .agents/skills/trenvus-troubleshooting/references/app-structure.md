# Trenvus Application Structure

## Overview

Trenvus is a digital wallet and exchange application with:
- Java/Spring Boot backend
- React/TypeScript frontend
- PostgreSQL database
- Docker containerization

## Backend Architecture

### Controllers (API Endpoints)

| Controller | Path | Description |
|------------|------|-------------|
| AuthController | `/auth/**` | Login, register, refresh tokens |
| TokenRevocationController | `/auth/revoke` | Logout, token blacklist |
| WalletController | `/wallet/**` | Balance, deposit, operations |
| TransferController | `/transfer/**` | Send money to users |
| ExchangeController | `/exchange/**` | Convert USD <-> TRV |
| TransactionController | `/transactions/**` | Statement, history |
| StatementEmailController | `/transactions/send-statement-email` | Email PDF exports |
| MarketController | `/market/**` | Crypto/fiat prices and charts |
| InvoiceController | `/invoices/**` | Create/pay invoice QR codes |
| VoucherController | `/vouchers/**` | User profile QR codes |
| MeController | `/me/**` | User profile, delete account |
| AdminUserController | `/admin/**` | Admin operations |
| MercadoPagoController | `/mercadopago/**` | Payment integration |
| MercadoPagoPaymentController | `/mercadopago/payment` | Payment callbacks |
| ConfirmationController | `/confirm/**` | Email verification |

### Security

- JWT-based authentication
- Token blacklist for logout
- `@PreAuthorize` on admin endpoints
- Passwords hashed with BCrypt

### Database Entities

- UserEntity - User accounts
- WalletEntity - USD/TRV balances
- TransactionEntity - All transactions
- RevokedTokenEntity - Blacklisted tokens
- PendingRegistrationEntity - Email verification
- ConfirmationTokenEntity - Email tokens
- VoucherEntity - User vouchers
- InvoiceEntity - Payment invoices

## Frontend Architecture

### Pages

| Route | Component | Access |
|-------|-----------|--------|
| `/` | Landing | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/confirm-registration` | ConfirmRegistration | Public |
| `/pay` | PayInvoice | Public (with redirect) |
| `/voucher/view/:code` | VoucherView | Public |
| `/mercadopago/return` | MercadoPagoReturnHandler | Public |
| `/app` | Shell + Dashboard | Protected |
| `/app/statement` | Statement | Protected |
| `/app/market` | Market | Protected |
| `/app/transfer` | Transfer | Protected |
| `/app/account` | Account | Protected |
| `/app/voucher` | VoucherCard | Protected |
| `/app/invoices/send` | InvoicesSend | Protected |
| `/app/invoices/receive` | InvoicesReceive | Protected |
| `/app/admin/users` | AdminUsers | Admin only |

### Components

- `MercadoPagoModal` - Payment modal
- `ConvertConfirmationModal` - Confirm conversions
- `TransferConfirmationModal` - Confirm transfers
- `ExportPdfModal` - PDF export options
- `InvoiceModal` - Create invoice from dashboard
- `ProtectedRoute` - Auth guard
- `AdminRoute` - Admin guard
- `Shell` - App layout with sidebar

### State Management

- Auth context: `auth.tsx` - Tokens, login/logout
- i18n context: `i18n.tsx` - Translations (PT/EN)

## Docker Services

### Database (PostgreSQL)
- Image: postgres:16-alpine
- Port: 5432
- Volume: pgdata (persistent)

### Backend (Spring Boot)
- Build: Dockerfile (multi-stage)
- Port: 8080
- Healthcheck: `/actuator/health`
- Memory limit: 1GB

### Frontend (Nginx)
- Build: frontend/Dockerfile
- Port: 3000 (mapped to 80 in container)
- Memory limit: 128MB

## Key Files

### Configuration
- `.env` - Environment variables (local, not committed)
- `.env.example` - Template for .env
- `docker-compose.yml` - Service definitions
- `application.properties` - Spring Boot config

### Scripts
- `start-after-pull-safe.sh` - Safe restart (preserves data)
- `start-after-pull.sh` - DANGEROUS: deletes data with -v
- `healthcheck.sh` - Verify application health
- `generate-jwt-keys.sh` - Generate JWT key pair
- `diagnose.sh` - Troubleshooting script

## Data Flow

### Registration
1. User fills form → POST `/auth/register-initiate`
2. Email sent with confirmation link
3. User clicks link → GET `/confirm/registration?token=XXX`
4. Account created → Wallets created → Redirect to login

### Login
1. POST `/auth/login` → Returns access + refresh tokens
2. Tokens stored in sessionStorage
3. Access token used for authenticated requests

### Transfer
1. User enters recipient + amount
2. POST `/transfer` with idempotency key
3. Backend validates balance → Updates wallets
4. Transaction recorded

### Invoice Payment
1. Receiver creates invoice → GET `/invoices/qr?amount=X`
2. QR code generated with encoded payload
3. Payer scans → Opens `/pay?r=XXX`
4. If not logged in → Login → Back to `/pay`
5. Confirm → POST `/invoices/pay` → Transfer executed

### Mercado Pago Deposit
1. User enters amount → Clicks deposit
2. POST `/mercadopago/create-preference`
3. Modal opens with Mercado Pago URL
4. User clicks → Deposited immediately (test mode)
5. Wallet updated
