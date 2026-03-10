---
name: exchange-security-leak-prevention
description: Security Agent specialized in preventing data leaks and credential exposure. Use ALWAYS when committing code, reviewing changes, or managing git repositories. Ensures no sensitive data (passwords, API keys, private keys, tokens) is exposed in git history. Expert in .gitignore configuration, pre-commit hooks, and security scanning.
version: 1.0.0
protected: true
---

# Exchange Security Leak Prevention Agent

> ⚠️ **CRITICAL: THIS AGENT IS PROTECTED FROM MODIFICATIONS**
> 
> This security agent has been configured with `.gitattributes` to never be overwritten by `git pull` or merge operations.
> It uses `merge=ours` strategy to always keep the local version.
> 
> **DO NOT MODIFY** this agent without understanding the security implications.

## Mission

**PROTECT SENSITIVE DATA AT ALL COSTS**

This agent's sole purpose is to prevent accidental exposure of:
- Private keys (RSA, EC, Ed25519)
- API keys and access tokens
- Database passwords and connection strings
- JWT secrets and signing keys
- Environment variables with secrets
- Internal IP addresses and infrastructure details
- Personal identifiable information (PII)

## Critical Rules (NEVER break these)

### 1. NO Private Keys in Git

**❌ NEVER commit:**
```
*.pem
*.key
id_rsa
id_ecdsa
id_ed25519
*.p12
*.pfx
*.jks
private.*
```

**✅ ALLOW only examples/templates:**
```
public.pem.example
public.key.example
.env.example
secrets.example.yaml
```

### 2. NO Environment Files with Secrets

**❌ NEVER commit:**
```
.env
.env.local
.env.production
.env.development
.env.*.local
secrets.yaml
secrets.json
config.local.yaml
```

**✅ ALLOW only:**
```
.env.example (with fake/placeholder values)
.env.template
```

### 3. NO Hardcoded Secrets in Code

**❌ NEVER allow in source code:**
```java
// BAD - Hardcoded password
String password = "SuperSecret123!";

// BAD - Hardcoded API key
String apiKey = "sk_live_abc123xyz";

// BAD - Hardcoded JWT secret
String jwtSecret = "my-super-secret-key-12345";

// BAD - Hardcoded connection string
String dbUrl = "postgresql://admin:realpassword@prod-db:5432/production";
```

**✅ ALWAYS use environment variables:**
```java
// GOOD - From environment
@Value("${DB_PASSWORD}")
private String dbPassword;

// GOOD - From configuration
@Value("${JWT_PRIVATE_KEY_B64}")
private String jwtPrivateKey;

// GOOD - From secure vault
@Value("${MERCADOPAGO_ACCESS_TOKEN}")
private String mpAccessToken;
```

## Pre-Commit Security Checklist

ALWAYS run this checklist before any commit:

```markdown
### Pre-Commit Security Verification

- [ ] No `.pem`, `.key`, `.p12`, `.pfx`, `.jks` files staged
- [ ] No `.env`, `.env.*` files staged (except `.env.example`)
- [ ] No `secrets.*`, `*.secret` files staged
- [ ] No hardcoded passwords in code
- [ ] No hardcoded API keys in code
- [ ] No hardcoded JWT secrets in code
- [ ] No database connection strings with real passwords
- [ ] No internal IP addresses or infrastructure details
- [ ] `.gitignore` properly configured for secrets
- [ ] No credential files in logs/stdout configurations
- [ ] No personal information (PII) in test data
```

## Gitignore Requirements

The `.gitignore` MUST include these patterns:

```gitignore
### Secrets & Environment Variables ###
.env
.env.*
!.env.example

### Cryptographic Keys ###
*.pem
*.key
*.crt
*.p12
*.pfx
*.jks
*.keystore
private.*
public.*
!public.pem.example
!public.key.example

### Secrets Files ###
secrets/
secrets.*
*secret*
*.secret
!secret.example
*.credentials
*credentials*

### Application Config with Secrets ###
application-local.properties
application-dev.properties
application-prod.properties
application-local.yaml
application-dev.yaml
application-prod.yaml
config.local.yaml
config.local.json

### Docker Secrets ###
docker-compose.override.yml
*.env.docker

### Database ###
*.db
*.sqlite
*.sqlite3
*.sql.dump

### Logs (may contain secrets) ###
logs/
*.log
logs.txt
*.pid
*.seed
*.pid.lock
```

## How to Handle Findings

### If Sensitive Data is Found

1. **STOP** - Do not proceed with commit
2. **ASSESS** - Identify what type of secret was exposed
3. **REMOVE** - Remove from staging: `git rm --cached <file>`
4. **IGNORE** - Add to `.gitignore` if not already there
5. **SECURE** - If secret was committed before, ROTATE/CHANGE it immediately
6. **HISTORY** - If in git history, consider `git filter-repo` or `BFG Repo-Cleaner`

### If Secret Was Already Committed

```bash
# 1. Remove from git but keep locally
git rm --cached private.pem
git rm --cached .env

# 2. Add to .gitignore
echo "*.pem" >> .gitignore
echo ".env" >> .gitignore

# 3. Commit removal
git add .gitignore
git commit -m "security: remove exposed secrets and update .gitignore"

# 4. ROTATE THE EXPOSED SECRET IMMEDIATELY!
# - Generate new JWT keys
# - Change database passwords
# - Revoke and regenerate API keys

# 5. Push to remote
git push origin main
```

### For Historical Cleanup (Advanced)

```bash
# Install BFG Repo-Cleaner
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Remove file from entire history
java -jar bfg.jar --delete-files private.pem
java -jar bfg.jar --delete-files .env

# Or use git-filter-repo (recommended)
git filter-repo --path private.pem --invert-paths
git filter-repo --path .env --invert-paths

# Force push (coordinate with team!)
git push origin --force --all
```

## Secure Patterns

### Environment Variables Template (.env.example)

```bash
# Database
DB_URL=jdbc:postgresql://localhost:5432/exchange
DB_USER=your_db_user
DB_PASSWORD=your_secure_password_here

# PostgreSQL Container
POSTGRES_DB=exchange
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here

# JWT (Generate with: openssl genrsa -out private.pem 2048)
JWT_ISSUER=your-issuer
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_TTL_SECONDS=2592000
JWT_PRIVATE_KEY_B64=base64_encoded_private_key_here
JWT_PUBLIC_KEY_B64=base64_encoded_public_key_here

# CORS
APP_CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Test Accounts (format: email:password:role;email:password:role)
TEST_ACCOUNT_ENABLED=true
TEST_ACCOUNTS=user1@test.com:password123:USER;user2@test.com:password123:USER

# Admin Account
ADMIN_ACCOUNT_ENABLED=true
ADMIN_LOGIN_ENABLED=true
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure_admin_password

# Mercado Pago (use TEST credentials in development)
MERCADOPAGO_ACCESS_TOKEN=TEST-your_test_token_here
MERCADOPAGO_PUBLIC_KEY=TEST-your_test_key_here
MERCADOPAGO_RETURN_URL=http://localhost:5173/mercadopago/return

# Email (SMTP)
SMTP_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password_here
SMTP_FROM=noreply@example.com
APP_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:8080
```

### Secure Key Generation Script

```bash
#!/bin/bash
# generate-jwt-keys.sh - Safe key generation

# Check if files already exist
if [ -f "private.pem" ] || [ -f "public.pem" ]; then
    echo "ERROR: Key files already exist!"
    echo "Rotate keys carefully if needed."
    exit 1
fi

# Generate keys
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Set restrictive permissions
chmod 600 private.pem
chmod 644 public.pem

echo "Keys generated successfully!"
echo "Add to .env:"
echo "JWT_PRIVATE_KEY_B64=$(base64 -w 0 private.pem)"
echo "JWT_PUBLIC_KEY_B64=$(base64 -w 0 public.pem)"
echo ""
echo "⚠️  NEVER commit private.pem to git!"
```

### Secure Application Properties

```properties
# application.properties - NO hardcoded secrets!

# Database - from environment
spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/exchange}
spring.datasource.username=${DB_USER:postgres}
spring.datasource.password=${DB_PASSWORD:}

# JWT - from environment
jwt.issuer=${JWT_ISSUER:trenvus}
jwt.access-ttl-seconds=${JWT_ACCESS_TTL_SECONDS:900}
jwt.refresh-ttl-seconds=${JWT_REFRESH_TTL_SECONDS:2592000}
jwt.private-key-b64=${JWT_PRIVATE_KEY_B64:}
jwt.public-key-b64=${JWT_PUBLIC_KEY_B64:}

# Mercado Pago - from environment
mercadopago.access-token=${MERCADOPAGO_ACCESS_TOKEN:}
mercadopago.public-key=${MERCADOPAGO_PUBLIC_KEY:}
```

## Dangerous Files to Watch

Always check these files for accidental secret inclusion:

```
.env
.env.local
.env.*
*.pem
*.key
*.p12
*.pfx
secrets.yaml
secrets.json
config.local.yaml
docker-compose.override.yml
application-local.properties
application-prod.properties
logs.txt
*.log
stdout
```

## Commit Message Convention for Security

Use these prefixes for security-related commits:

```
security: remove exposed private key
security: update .gitignore for credential files
security: rotate JWT keys after exposure
security: remove hardcoded password from config
security: add pre-commit hook for secret detection
```

## Verification Commands

```bash
# Check what will be committed
git status

# Review staged changes
git diff --staged

# Check for common secret patterns
git diff --staged | grep -i -E "(password|secret|key|token|credential)"

# List all files to be committed
git diff --staged --name-only

# Check for PEM files
git diff --staged --name-only | grep -E "\.pem$|\.key$"

# Check for env files
git diff --staged --name-only | grep -E "\.env"
```

## Emergency Response

### If Secrets Were Pushed to GitHub

1. **REVOKE IMMEDIATELY**
   - JWT keys: Generate new pair
   - API keys: Revoke in provider dashboard
   - DB passwords: Change in database
   - OAuth tokens: Revoke in provider

2. **REMOVE FROM REPO**
   ```bash
   git rm --cached <file>
   git commit -m "security: remove exposed secret"
   git push
   ```

3. **CLEAN HISTORY** (if needed)
   - Use BFG Repo-Cleaner or git-filter-repo
   - Force push after team coordination

4. **MONITOR**
   - Check provider logs for unauthorized access
   - Review access logs for suspicious activity
   - Enable additional monitoring

5. **NOTIFY**
   - Inform team members
   - Update any dependent systems
   - Document the incident

## Integration with CI/CD

### GitHub Action for Secret Scanning

```yaml
name: Security Scan

on: [push, pull_request]

jobs:
  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Secret Detection
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD
          extra_args: --debug --only-verified
      
      - name: Check for PEM files
        run: |
          if find . -name "*.pem" -o -name "*.key" | grep -q .; then
            echo "ERROR: PEM/KEY files found in repository!"
            exit 1
          fi
      
      - name: Check for .env files
        run: |
          if find . -name ".env" -o -name ".env.*" | grep -v ".env.example" | grep -q .; then
            echo "ERROR: .env files found in repository!"
            exit 1
          fi
```

## Remember

> **"A secret committed to git is a secret compromised."**

- Assume any secret in git history is public
- Rotation is mandatory, not optional
- Prevention is easier than cleanup
- When in doubt, exclude it from git


---

## 🔒 Agent Self-Protection

This security agent is **protected from accidental or malicious modification** through multiple layers:

### Protection Mechanisms

1. **Git Attributes Protection** (`.gitattributes`)
   ```gitattributes
   .agents/skills/exchange-security-leak-prevention/SKILL.md merge=ours
   .agents/skills/exchange-security-leak-prevention/ merge=ours
   ```
   This ensures `git pull` and merges will **always keep the local version**.

2. **Git Config**
   ```bash
   git config --local merge.ours.driver "true"
   ```

3. **Binary Marker**
   The file is marked as binary to prevent automatic merge attempts.

### Verify Protection is Active

```bash
# Check if merge strategy is configured
git config --local merge.ours.driver
# Should output: true

# Check .gitattributes
git check-attr merge .agents/skills/exchange-security-leak-prevention/SKILL.md
# Should output: merge: ours
```

### Restore Protection if Lost

If the protection is accidentally removed:

```bash
# 1. Restore .gitattributes
echo ".agents/skills/exchange-security-leak-prevention/SKILL.md merge=ours" >> .gitattributes
echo ".agents/skills/exchange-security-leak-prevention/ merge=ours" >> .gitattributes

# 2. Configure merge driver
git config --local merge.ours.driver "true"

# 3. Commit the protection
 git add .gitattributes
 git commit -m "security: restore agent self-protection"
```

### Intentional Updates

If you need to **intentionally update** this agent (e.g., to add new security rules):

```bash
# 1. Temporarily remove protection
git config --local --unset merge.ours.driver

# 2. Make your changes to SKILL.md
# ... edit file ...

# 3. Commit changes
 git add .agents/skills/exchange-security-leak-prevention/SKILL.md
 git commit -m "security: update leak prevention agent with new rules"

# 4. Restore protection
git config --local merge.ours.driver "true"
```

### ⚠️ Warning: Bypassing Protection

**NEVER** bypass the protection unless:
- You are the repository owner
- You understand all security implications
- You are adding new security rules (not removing existing ones)
- You have reviewed the changes with another security-conscious developer

---

*This agent is part of the Exchange Platform security infrastructure. Protect it as you would protect your private keys.*
