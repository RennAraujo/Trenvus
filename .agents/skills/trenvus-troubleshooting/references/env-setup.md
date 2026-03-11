# Environment Setup Guide

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/RennAraujo/Trenvus.git
cd Trenvus
```

### 2. Create .env File

```bash
cp .env.example .env
```

### 3. Generate JWT Keys (Required)

The JWT keys are **required** for the backend to start. Without them, the container will fail in a loop.

**⚠️ IMPORTANT:** The backend expects keys in a specific format:
- **Private Key**: PKCS#8 DER format, Base64-encoded
- **Public Key**: X.509 DER format, Base64-encoded

#### Option A: Automatic Fix (Recommended)
```bash
./fix-jwt-keys.sh        # Linux/Mac/Git Bash
# ou
fix-jwt-keys.bat         # Windows CMD
```

This script will:
- Check if keys are already configured
- Generate new keys in the CORRECT format if needed
- Update `.env` automatically
- Create a backup of your `.env`

#### Option B: Manual Generation
```bash
./generate-jwt-keys.sh        # Linux/Mac/Git Bash
# ou
generate-jwt-keys.bat         # Windows CMD
```

This will output something like:
```
JWT_PRIVATE_KEY_B64=MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
JWT_PUBLIC_KEY_B64=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
```

**The key format should be:**
- ✅ Single line of Base64 characters
- ✅ No PEM headers like `-----BEGIN PRIVATE KEY-----`
- ✅ Starts with `MII` (PKCS#8) for private key
- ✅ Starts with `MIIB` (X.509) for public key

**❌ Old incorrect format (PEM):**
```
JWT_PRIVATE_KEY_B64=LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRRDNxdW9vSmluZ0d0c0EK...
```

**✅ Correct format (PKCS#8 DER):**
```
JWT_PRIVATE_KEY_B64=MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
```

Copy these lines into your `.env` file.

**⚠️ IMPORTANT:** If you previously used the old scripts, you MUST regenerate the keys with the new scripts!

### 4. Configure Database

Default (works out of box):
```env
POSTGRES_DB=exchange
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

### 5. Configure Test Accounts

Enable test accounts:
```env
TEST_ACCOUNT_ENABLED=true
TEST_ACCOUNTS=user1@test.com:123:USER;user2@test.com:123:USER;user3@test.com:123:USER
```

Format: `email:password:role;email:password:role`

Roles: `USER` or `ADMIN`

### 6. Configure SMTP (Optional - for email features)

For Gmail:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@trenvus.com
```

Get App Password: https://myaccount.google.com/apppasswords

### 7. Configure Mercado Pago (Optional - for payments)

```env
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxx
MERCADOPAGO_PUBLIC_KEY=TEST-yyyyyyyyyyyyyyyy
MERCADOPAGO_RETURN_URL=http://localhost:3000/mercadopago/return
```

Get credentials: https://www.mercadopago.com.br/developers

## Complete .env Example

```env
# Database
POSTGRES_DB=exchange
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# JWT (REQUIRED - generate with ./generate-jwt-keys.sh)
JWT_ISSUER=Trenvus
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_TTL_SECONDS=2592000
JWT_PRIVATE_KEY_B64=your-private-key-here
JWT_PUBLIC_KEY_B64=your-public-key-here

# CORS
APP_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# URLs
APP_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:8080

# SMTP (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM=noreply@trenvus.com

# Mercado Pago (optional)
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_RETURN_URL=http://localhost:3000/mercadopago/return

# Test Accounts
TEST_ACCOUNT_ENABLED=true
TEST_ACCOUNTS=user1@test.com:123:USER;user2@test.com:123:USER;user3@test.com:123:USER

# Admin
ADMIN_ACCOUNT_ENABLED=true
ADMIN_LOGIN_ENABLED=true
ADMIN_EMAIL=admin@trenvus.com
ADMIN_PASSWORD=admin123
```

## Starting the Application

### Safe Start (Recommended)

Preserves database data:
```bash
./start-after-pull-safe.sh
```

### With Data Reset (WARNING)

Deletes all data:
```bash
./start-after-pull-safe.sh --reset-data
```

### Manual Start

```bash
# Build and start
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Verification

Check if everything is working:
```bash
./healthcheck.sh
```

Expected output:
```
✅ PostgreSQL container rodando
✅ Backend container rodando
✅ Frontend container rodando
✅ Backend healthcheck: OK
✅ Login com user1@test.com: OK
✅ Todos os checks passaram!
```

## Troubleshooting

### Port Conflicts

If ports 3000, 8080, or 5432 are in use:

Edit `docker-compose.yml`:
```yaml
ports:
  - "3001:80"  # Change 3000 to 3001
```

### Permission Denied on Scripts

```bash
chmod +x *.sh
```

### Database Connection Failed

1. Check if PostgreSQL is running:
   ```bash
   docker ps | grep exchange-db
   ```

2. Check logs:
   ```bash
   docker logs exchange-db
   ```

3. Reset if needed:
   ```bash
   docker-compose down -v  # WARNING: deletes data
   docker-compose up -d
   ```

### JWT Errors

Regenerate keys:
```bash
./generate-jwt-keys.sh
```

Then update `.env` with the new values.

## Development Mode

### Backend Only

```bash
cd src/main/java/trenvus/Exchange
./mvnw spring-boot:run
```

### Frontend Only

```bash
cd frontend
npm install
npm run dev
```

Frontend will be at http://localhost:5173
