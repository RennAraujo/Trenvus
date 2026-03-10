# 🔒 Relatório de Auditoria de Segurança

**Data:** 2026-03-10  
**Projeto:** Trenvus Exchange  
**Auditor:** exchange-security-leak-prevention Agent  

---

## 📊 Resumo Executivo

| Categoria | Status | Crítico | Alto | Médio | Baixo |
|-----------|--------|---------|------|-------|-------|
| **Git Secrets** | ⚠️ ATENÇÃO | 1 | 1 | 0 | 0 |
| **Hardcoded Secrets** | ❌ CRÍTICO | 4 | 0 | 0 | 0 |
| **Configuração JWT** | ✅ OK | 0 | 0 | 0 | 0 |
| **Proteções Ativas** | ✅ OK | 0 | 0 | 0 | 0 |

---

## 🚨 Problemas Críticos Encontrados

### 1. JWT Keys Hardcoded no docker-compose.yml ❌ CRÍTICO

**Arquivo:** `docker-compose.yml`  
**Linhas:** 26-27

```yaml
JWT_PRIVATE_KEY_B64: ${JWT_PRIVATE_KEY_B64:-MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDiUnLgarh1OSkXbsY8MDffZ6JJ8fds6m3VVWLCc62J0vGK0FHyZFw3yr06CXO58ZIK2mUoOpYIRtZ/6dve+1EsBJAc0gELeZm6Y+A0qwgNukPJEIBTwwTEaPvnSJ7PINXkiXZ7XegdOKUWKSuEEVblPO3i9Z+sDmOflmAQ9FZfyepSBGed+38aOIxZFmNpDYmPNRoHAefQxyVoRfZH3WXo2c7nZrwOrLzISZXjfpDO2DQU+b8QHW2v2ic98Q9B+ewZXCoMj63hytgCc90L1PSa6oUqbG08UP1EPsozzvJfYHM8Mxe790SouS4oSuJZnESCkUeYLjerJ3jo7qauj3+5AgMBAAECggEAUbWsreM513Ccqk4fGenasjirOgE28EavAr+CGWxEMidLd2+Atn+PX8E9ki+JbY+Ox4ZT0TNdqX1Rwfq/nACmLLs1AIK9R9ROMSIP91PsY3BlOrlPa25UUUkJ8VWhqGxVbN5IPYAI5kvmJlsUz+ims7rMtA0z6Z2EUECtTFG6wXfpypsaEckpefLiseLVyfTLZgkttF2mURLPxvVibJv4rlJN9B502hKnG9SEDWAv/UaBz5pKHPo8NHvE5B6bDNLkwaEg8qAlHqYg23arMgumMyC0bvsnhjMgsjL6t0Uo3YtHXabNybDHfDtUUMGst/kLgmtA3Ltv71M97KBiAg3e5QKBgQD5lYram2SafFaX9j4V6aN1spg+1a8nrXa7wX9n4HEXtYxIE087hNI1tZAyyce2C2xmS76zLao0WY/siiKk8N/e07ikIX5LetDdeSYcqxCZDpOEqatlQuTWRHT/V6cdKz3Cbw2yydfRgk4zJERCukNJZ/Wq801Dv2N1Erj7AzZjtwKBgQDoI9LhS5B8LMsbk6gghfm5YVRFZBLao0vnEAwqLBs4lziTwNFe10L6H1U7ews4kvzZWdUCyFE3Yby9HymqQV7u6u3sKkN4dyYgpaJf2X4an3K3JnK8X+tWKyrHfg9Qe/FjHj9FEPPHynRHhPkB6RiGIR+usO2rWKw7Jb2LtC2YDwKBgH46zgGGejlQDZPJ7Ni0VAHhE/Mjq/TLXLPVR5TIBSrSnWKOsZIOuSqE66tkNmeyG18ZjBefTugvLAWcT61QTkmql0Yb0n5mXWDGNypksn5WyvFbxt3uGULtWKcUM+ciyZefBzSXtVm3J8nh28xL3GAx/iQ57agIEktR7tC1bTq9AoGAQ7qX/1WdrS0ggUY+ambManLkNG6zNYkpTxwWgINn2cX9ItbB/2rMxs83fegzaOkxznRwOqSZVZA1kfQyotL50LlIe3wFPXN9806AJnj9WuUkgh08ootVzUlA7P1xmGjhD6s2iH8esS73aBp60DzjA9dMOBq07SYs8gDb4ZPLLa8CgYEAznEmfaZ0MzLPDIJ4iGOgrBMMjtvH1hEJuF/Kc2noNtXYSm96XTQWDSatM2NqOmn9f6NORmQHtbu2tzip7b5RR/qvOiXEujA5ZkKvmU8Z4JfhpozNms6tGCD8zSZAOluzALWayZPZVbNoStEYQImSrD3BBi3/4NrFXiYqL7QRAB4=}
JWT_PUBLIC_KEY_B64: ${JWT_PUBLIC_KEY_B64:-MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4lJy4Gq4dTkpF27GPDA332eiSfH3bOpt1VViwnOtidLxitBR8mRcN8q9OglzufGSCtplKDqWCEbWf+nb3vtRLASQHNIBC3mZumPgNKsIDbpDyRCAU8MExGj750iezyDV5Il2e13oHTilFikrhBFW5Tzt4vWfrA5jn5ZgEPRWX8nqUgRnnft/GjiMWRZjaQ2JjzUaBwHn0MclaEX2R91l6NnO52a8Dqy8yEmV436Qztg0FPm/EB1tr9onPfEPQfnsGVwqDI+t4crYAnPdC9T0muqFKmxtPFD9RD7KM87yX2BzPDMXu/dEqLkuKEriWZxEgpFHmC43qyd46O6mro9/uQIDAQAB}
```

**Impacto:** Qualquer pessoa com acesso ao repositório pode ver as chaves JWT e forjar tokens válidos.

**Ação Requerida:**
1. Remover valores default das variáveis JWT
2. Gerar novas chaves
3. Usar apenas variáveis de ambiente

---

### 2. SMTP Password Exposto ❌ CRÍTICO

**Arquivo:** `docker-compose.yml`  
**Linha:** 33

```yaml
SMTP_PASSWORD: gyme rbuj myiv lify
```

**Impacto:** Senha de email exposta permite acesso não autorizado à conta.

**Ação Requerida:**
1. Mover para variável de ambiente
2. Revogar/alterar senha no Gmail
3. Usar App Passwords do Google

---

### 3. Endereços IP Internos Expostos ❌ CRÍTICO

**Arquivo:** `docker-compose.yml`  
**Linhas:** 35-36

```yaml
APP_BASE_URL: http://195.200.7.31:3000
API_BASE_URL: http://195.200.7.31:8080
```

**Impacto:** Expõe infraestrutura interna. Facilita ataques direcionados.

**Ação Requerida:**
1. Mover para `.env`
2. Usar variáveis de ambiente

---

### 4. Mercado Pago Credentials em application.properties ⚠️ ALTO

**Arquivo:** `src/main/resources/application.properties`  
**Linhas:** 14-15

```properties
mercadopago.access-token=${MERCADOPAGO_ACCESS_TOKEN:TEST-5056651530336675-022415-5caf868399c3575e91b4ff10f342c54c-131699939}
mercadopago.public-key=${MERCADOPAGO_PUBLIC_KEY:TEST-865f4d5f-fade-4da0-8e8d-c01da8af666d}
```

**Impacto:** Credenciais de TEST expostas (menor risco, mas má prática).

**Ação Requerida:**
1. Remover valores default
2. Usar apenas variáveis de ambiente

---

## ✅ Pontos Positivos

### 1. Proteção do Agente de Segurança ✅

- `.gitattributes` configurado com `merge=ours`
- `git config merge.ours.driver` ativado
- Agente protegido contra sobrescrição

### 2. .gitignore Bem Configurado ✅

Proteções ativas para:
- `.env` e `.env.*`
- `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.jks`
- `secrets/`, `*.secret`
- `application-local.properties`

### 3. Sem Chaves no Git ✅

```bash
$ git ls-files | grep "\.pem$|\.key$"
# (nenhum resultado)
```

### 4. Configuração JWT Robusta ✅

- RS256 (RSA 2048 bits)
- Token blacklist implementada
- Refresh token rotation
- CORS configurado via variável de ambiente

### 5. Senhas Hasheadas com BCrypt ✅

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

---

## 📋 Checklist de Ações Imediatas

### Prioridade CRÍTICA (Faça Agora)

- [ ] **1. Corrigir docker-compose.yml**
  ```yaml
  # ANTES (INSEGURO):
  JWT_PRIVATE_KEY_B64: ${JWT_PRIVATE_KEY_B64:-hardcoded...}
  
  # DEPOIS (SEGURO):
  JWT_PRIVATE_KEY_B64: ${JWT_PRIVATE_KEY_B64}
  ```

- [ ] **2. Mover SMTP_PASSWORD para .env**
  ```yaml
  # docker-compose.yml
  SMTP_PASSWORD: ${SMTP_PASSWORD}
  ```

- [ ] **3. Mover IPs para .env**
  ```yaml
  # docker-compose.yml
  APP_BASE_URL: ${APP_BASE_URL}
  API_BASE_URL: ${API_BASE_URL}
  ```

- [ ] **4. Corrigir application.properties**
  ```properties
  # ANTES:
  mercadopago.access-token=${MERCADOPAGO_ACCESS_TOKEN:TEST-...}
  
  # DEPOIS:
  mercadopago.access-token=${MERCADOPAGO_ACCESS_TOKEN}
  ```

### Prioridade ALTA (Esta Semana)

- [ ] **5. Rotacionar JWT Keys**
  ```bash
  openssl genrsa -out private.pem 2048
  openssl rsa -in private.pem -pubout -out public.pem
  base64 -w 0 private.pem  # Atualizar .env
  ```

- [ ] **6. Alterar Senha SMTP**
  - Acessar Google Account
  - Revogar App Password antigo
  - Gerar novo App Password
  - Atualizar `.env`

- [ ] **7. Commit das Correções**
  ```bash
  git add docker-compose.yml application.properties
  git commit -m "security: remove hardcoded secrets from config files"
  git push
  ```

---

## 🔒 Recomendações Adicionais

### 1. Pre-commit Hooks

Instalar `git-secrets` ou `trufflehog`:

```bash
# Instalar git-secrets
git secrets --install
git secrets --register-aws

# Ou usar trufflehog no CI/CD
docker run --rm -v "$PWD:/code" trufflesecurity/trufflehog:latest filesystem /code
```

### 2. GitHub Secret Scanning

Ativar no repositório:
- Settings → Security → Secret scanning
- Ativar "Secret scanning" e "Push protection"

### 3. Variáveis de Ambiente Obrigatórias

Criar `.env.required`:

```bash
# JWT (obrigatório, sem default)
JWT_PRIVATE_KEY_B64=
JWT_PUBLIC_KEY_B64=

# SMTP (obrigatório)
SMTP_PASSWORD=

# URLs (obrigatório)
APP_BASE_URL=
API_BASE_URL=
```

### 4. Validação no Startup

Adicionar validação no Spring Boot:

```java
@Component
public class SecurityValidation {
    @PostConstruct
    public void validate() {
        // Verificar se JWT keys são válidas e não são as hardcoded
        // Lanchar exceção se configuração for insegura
    }
}
```

---

## 📊 Histórico de Exposições

| Data | Ocorrência | Status |
|------|------------|--------|
| 2026-03-10 | JWT keys commitadas no Git | ✅ Corrigido (removido) |
| 2026-03-10 | JWT keys hardcoded no docker-compose | ⚠️ Pendente |
| 2026-03-10 | SMTP password exposto | ⚠️ Pendente |
| 2026-03-10 | IPs internos expostos | ⚠️ Pendente |

---

## 🎯 Próximos Passos

1. **Executar correções CRÍTICAS imediatamente**
2. **Commitar com prefixo `security:`**
3. **Rotacionar todas as secrets expostas**
4. **Implementar pre-commit hooks**
5. **Agendar auditoria mensal**

---

## 📞 Contato

Em caso de dúvidas sobre segurança, consulte sempre o agente:
> `exchange-security-leak-prevention`

---

*Relatório gerado automaticamente pelo agente de segurança*  
*Data: 2026-03-10*  
*Versão: 1.0*
