---
name: trenvus-troubleshooting
description: Troubleshooting and maintenance for Trenvus application. Use when user reports issues with Docker containers not working, test accounts not accessible, or any Trenvus deployment/operation problems.
---

# Trenvus Troubleshooting

This skill helps diagnose and fix common Trenvus deployment and operation issues.

## Commands Reference

All Docker commands are manual (no automation scripts):

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Rebuild
docker-compose up --build -d

# Logs
docker logs -f exchange-backend
docker logs -f exchange-frontend
docker logs -f exchange-db

# Status
docker ps
docker stats
```

## Common Issues & Solutions

### Issue: git pull breaks local .env

**Symptom:** After `git pull`, the application stops working because `.env` was overwritten or removed.

**Solution:**
1. The `.env` file should be in `.gitignore` and never tracked
2. If `.env` was deleted, restore from backup or copy from `.env.example`
3. Regenerate JWT keys if needed

### Issue: Test accounts don't work after restart

**Symptom:** Cannot login with user1@test.com / 123 after Docker restart.

**Root Cause:** Database volume may have been deleted with `docker-compose down -v`.

**Solution:**
```bash
# Normal stop (preserves data)
docker-compose down

# Start again
docker-compose up -d
```

### Issue: JWT keys not configured or empty

**Symptom:** Backend fails to start with errors like:
- `JWT_PRIVATE_KEY_B64 está vazio!`
- `Invalid JWT_PRIVATE_KEY_B64`
- Backend in restart loop

**Solution:**

1. Check if .env has the keys:
   ```bash
   cat .env | grep JWT
   ```

2. If empty, generate new keys:
   ```bash
   # Linux/Mac
   openssl genrsa -out private.pem 2048
   openssl rsa -in private.pem -pubout -out public.pem
   
   # Convert to PKCS#8 DER and Base64
   openssl pkcs8 -topk8 -inform PEM -outform DER -in private.pem -nocrypt | base64 -w 0
   openssl rsa -pubin -in public.pem -outform DER | base64 -w 0
   
   # Add to .env
   # JWT_PRIVATE_KEY_B64=<output1>
   # JWT_PUBLIC_KEY_B64=<output2>
   
   rm private.pem public.pem
   ```

3. Restart:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Issue: Backend in restart loop

**Symptom:** Container keeps restarting.

**Check logs:**
```bash
docker logs exchange-backend | tail -30
```

**Common causes:**
1. **JWT keys empty or wrong format** - See above
2. **Out of Memory** - Exit code 137
3. **Database not ready** - Check exchange-db is running

### Issue: Frontend visuals not updating

**Symptom:** After changes, frontend still shows old design.

**Solution:**
```bash
# Force rebuild without cache
docker-compose build --no-cache frontend
docker-compose up -d frontend

# Clear browser cache: Ctrl+F5
```

## Environment Variables Checklist

Required in `.env`:
- [ ] `JWT_PRIVATE_KEY_B64` - Base64-encoded private key (PKCS#8 DER)
- [ ] `JWT_PUBLIC_KEY_B64` - Base64-encoded public key (X.509 DER)
- [ ] `POSTGRES_PASSWORD` - Database password
- [ ] `TEST_ACCOUNT_ENABLED=true` - Enable test accounts

Optional:
- [ ] `SMTP_USERNAME` - For email features
- [ ] `MERCADOPAGO_ACCESS_TOKEN` - For payments

## References

- [Application Structure](references/app-structure.md) - Full application architecture
- [API Endpoints](references/api-endpoints.md) - All available API routes
- [Environment Setup](references/env-setup.md) - Complete environment configuration
- [DOCKER_README.md](../DOCKER_README.md) - Docker manual commands
