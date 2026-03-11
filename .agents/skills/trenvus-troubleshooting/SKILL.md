---
name: trenvus-troubleshooting
description: Troubleshooting and maintenance for Trenvus application. Use when user reports issues with git pull breaking local setup, Docker containers not working, test accounts not accessible, or any Trenvus deployment/operation problems.
---

# Trenvus Troubleshooting

This skill helps diagnose and fix common Trenvus deployment and operation issues.

## Common Issues & Solutions

### Issue: git pull breaks local .env

**Symptom:** After `git pull`, the application stops working because `.env` was overwritten or removed.

**Solution:**
1. The `.env` file should be in `.gitignore` and never tracked
2. If `.env` was deleted, restore from backup: `cp .env.local.backup.XXXX .env`
3. If no backup exists, copy from `.env.example` and reconfigure

**Prevention:**
- Always keep `.env.local.backup` files
- Never commit `.env` to git
- Use `start-after-pull-safe.sh` instead of manual steps

### Issue: Test accounts don't work after restart

**Symptom:** Cannot login with user1@test.com / 123 after Docker restart.

**Root Cause:** `start-after-pull.sh` uses `docker-compose down -v` which DELETES the database volume.

**Solution:**
1. Use `start-after-pull-safe.sh` (does NOT use `-v` flag)
2. Or manually: `docker-compose down` (without `-v`) then `docker-compose up -d`

**Verification:**
```bash
# Check if test accounts exist
docker logs exchange-backend | grep -i "test"
```

### Issue: JWT keys not configured or empty / Invalid key format

**Symptom:** Backend fails to start with errors like:
- `JWT_PRIVATE_KEY_B64 está vazio!`
- `Invalid JWT_PRIVATE_KEY_B64`
- `InvalidKeyException: invalid key format`
- Backend in restart loop

**Root Cause:** The Java backend expects keys in specific format:
- **Private Key**: PKCS#8 DER format (binary), Base64-encoded
- **Public Key**: X.509 DER format (binary), Base64-encoded

The old scripts were generating PEM format (text with headers), which Java cannot parse directly.

**Quick Fix (Automatic):**
```bash
# Linux/Mac/Git Bash (NEW fixed script)
./fix-jwt-keys.sh

# Windows CMD (NEW fixed script)
fix-jwt-keys.bat
```

**Manual Fix with Correct Format:**
```bash
# 1. Generate keys with CORRECT format (PKCS#8 DER, not PEM)
./generate-jwt-keys.sh

# 2. Copy output to .env
# The output should be a single long Base64 string (no line breaks)
```

**Verify the format:**
```bash
# Good format (single line, no headers)
JWT_PRIVATE_KEY_B64=MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...

# Bad format (PEM with headers - OLD scripts did this)
JWT_PRIVATE_KEY_B64=LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRRDNxdW9vSmluZ0d0c0EK...
```

**Important:** 
- Keys must be Base64-encoded DER format (PKCS#8 for private, X.509 for public)
- No PEM headers like `-----BEGIN PRIVATE KEY-----`
- Single line, no line breaks in the Base64 string

### Issue: JWT keys exist in .env but NOT in container (Windows)

**Symptom:** 
- `./docker-jwt-debug.sh` shows: "As chaves existem no .env local mas NÃO estão no container!"
- Backend in restart loop with `Invalid JWT_PRIVATE_KEY_B64`
- Docker on Windows not passing long environment variables correctly

**Root Cause:** Docker Desktop on Windows has issues passing very long environment variables (like Base64-encoded keys) through `docker-compose.yml` `environment:` section.

**Solution - Use env_file method (Most Reliable):**

```bash
# Windows CMD - Use this method!
start-with-envfile.bat

# Linux/Mac/Git Bash
./start-with-envfile.sh
```

This creates a `.env.backend` file and uses `env_file:` in docker-compose, which is more reliable than inline environment variables.

**Alternative Solutions:**

1. **Create env_file manually:**
   ```bash
   # Windows
   create-backend-env.bat
   
   # Then use the envfile compose
   docker-compose -f docker-compose.envfile.yml up -d
   ```

2. **Export variables explicitly:**
   ```bash
   # Windows PowerShell
   ./export-env-and-start.bat
   ```

3. **Inject directly into container (emergency):**
   ```bash
   ./docker-jwt-inject.sh
   ```

**Verify the fix:**
```bash
# Should show the keys now
docker exec exchange-backend printenv | findstr JWT

# Or
docker exec exchange-backend env | grep JWT
```

### Issue: Backend in restart loop / crash loop

**Symptom:** Container keeps restarting, `docker ps` shows high restart count.

**Common causes and solutions:**

1. **JWT keys empty, missing, or wrong format**
   ```bash
   # Use the NEW fixed scripts
   ./fix-jwt-keys.sh        # Linux/Mac/Git Bash
   # or
   fix-jwt-keys.bat         # Windows CMD
   
   ./start-after-pull-safe.sh
   ```

2. **JWT keys exist in .env but not in container (Windows specific)**
   ```bash
   # Use the env_file method - MOST RELIABLE
   start-with-envfile.bat   # Windows
   # or
   ./start-with-envfile.sh  # Linux/Mac
   ```

3. **Out of Memory (OOM)** - Exit code 137
   ```bash
   # Check logs
   docker logs exchange-backend | grep -i "memory\|oom\|OutOfMemory"
   
   # Increase memory limit
   export BACKEND_MEMORY_LIMIT=2G
   ./start-after-pull-safe.sh
   ```

3. **Database connection failed**
   ```bash
   # Check if DB is running
   docker ps | grep exchange-db
   
   # Check DB logs
   docker logs exchange-db
   ```

**Debug Mode:**
```bash
# See real-time logs
./debug-backend.sh

# Or build without cache
./start-after-pull-safe.sh --debug
```

### Issue: Frontend visuals not updating / changes not showing

**Symptom:** After git pull, the frontend still shows the old design/pages.

**Root Cause:** Docker is using cached build layers from previous builds.

**Solution - Force frontend rebuild:**

```bash
# Linux/Mac/Git Bash
./rebuild-frontend.sh

# Windows CMD
rebuild-frontend.bat
```

This script will:
1. Stop and remove the old frontend container
2. Remove the old Docker image
3. Clear build cache
4. Rebuild frontend without cache (`--no-cache`)
5. Start the new container

**Also clear browser cache:**
- Chrome/Edge: `Ctrl + F5` or `Ctrl + Shift + R`
- Firefox: `Ctrl + Shift + R`

**Alternative - Manual rebuild:**
```bash
# Stop everything
docker-compose down

# Rebuild frontend only, without cache
docker-compose build --no-cache frontend

# Start again
docker-compose up -d
```

**Note:** Flyway has nothing to do with frontend visuals. Flyway only handles database migrations.

## Quick Health Check

Run the healthcheck script:
```bash
./healthcheck.sh
```

This verifies:
- All containers are running
- Backend responds to health endpoint
- Test accounts can login
- Database connection works

## Safe Restart Procedure

Always use the safe restart script:
```bash
./start-after-pull-safe.sh
```

This script:
1. ✅ Preserves `.env` (backs it up)
2. ✅ Preserves database data (no `-v` flag)
3. ✅ Waits for services to be ready
4. ✅ Verifies test accounts are working

## Environment Variables Checklist

Required in `.env`:
- [ ] `JWT_PRIVATE_KEY_B64` - Base64-encoded private key
- [ ] `JWT_PUBLIC_KEY_B64` - Base64-encoded public key
- [ ] `POSTGRES_PASSWORD` - Database password
- [ ] `TEST_ACCOUNT_ENABLED=true` - Enable test accounts
- [ ] `TEST_ACCOUNTS` - Test account definitions

Optional but recommended:
- [ ] `SMTP_USERNAME` - For email features
- [ ] `SMTP_PASSWORD` - For email features
- [ ] `MERCADOPAGO_ACCESS_TOKEN` - For payments
- [ ] `MERCADOPAGO_PUBLIC_KEY` - For payments

## Log Inspection

View logs for troubleshooting:
```bash
# Backend logs
docker logs -f exchange-backend

# Frontend logs
docker logs -f exchange-frontend

# Database logs
docker logs -f exchange-db

# Filter for test accounts
docker logs exchange-backend | grep -i "testaccount"
```

## Database Reset (WARNING: Destroys all data)

Only if you need a completely fresh start:
```bash
./start-after-pull-safe.sh --reset-data
```

## References

- [Application Structure](references/app-structure.md) - Full application architecture
- [API Endpoints](references/api-endpoints.md) - All available API routes
- [Environment Setup](references/env-setup.md) - Complete environment configuration
