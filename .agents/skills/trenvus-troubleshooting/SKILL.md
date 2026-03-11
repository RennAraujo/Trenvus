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

### Issue: JWT keys not configured or empty

**Symptom:** Backend fails to start with errors like:
- `JWT_PRIVATE_KEY_B64 está vazio!`
- `IllegalArgumentException: JWT private key cannot be empty`
- Backend in restart loop

**Quick Fix (Automatic):**
```bash
./fix-jwt-keys.sh        # Linux/Mac/Git Bash
# ou
fix-jwt-keys.bat         # Windows CMD
```

**Manual Fix:**
1. Generate keys: `./generate-jwt-keys.sh`
2. Copy the output lines to `.env`
3. The output will look like:
   ```
   JWT_PRIVATE_KEY_B64=LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0t...
   JWT_PUBLIC_KEY_B64=LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0...
   ```

**Important:** The keys must be Base64-encoded and on a single line (no line breaks).

### Issue: Backend in restart loop / crash loop

**Symptom:** Container keeps restarting, `docker ps` shows high restart count.

**Common causes and solutions:**

1. **JWT keys empty or missing**
   ```bash
   ./fix-jwt-keys.sh
   ./start-after-pull-safe.sh
   ```

2. **Out of Memory (OOM)** - Exit code 137
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

### Issue: Frontend shows blank page or errors

**Symptom:** After pull, frontend doesn't load or shows TypeScript errors.

**Solution:**
1. Clear Docker build cache: `docker-compose build --no-cache frontend`
2. Check for TypeScript errors: `cd frontend && npm run build`
3. Verify all env vars are set in `.env`

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
