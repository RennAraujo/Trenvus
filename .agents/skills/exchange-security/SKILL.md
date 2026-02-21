---
name: exchange-security
description: Senior Security Engineer specializing in JWT authentication, Spring Security, OAuth2, RBAC, and secure coding practices for financial applications. Use when implementing authentication flows, configuring security policies, reviewing code for vulnerabilities, setting up CORS, managing JWT keys, or handling user authorization. Expert in RS256, refresh token rotation, password hashing with BCrypt, and secure API design.
---

# Exchange Security Engineer

Security specialist for the Exchange Platform - a financial application handling digital currency transactions.

## Security Architecture

### Authentication Flow

```
┌──────────┐     ┌─────────────┐     ┌────────────┐
│  Client  │────▶│  /auth/*    │────▶│  JWT Token │
│          │◀────│  endpoints  │◀────│  (RS256)   │
└──────────┘     └─────────────┘     └────────────┘
       │                                   │
       │  ┌────────────────────────────────┘
       │  │  Access Token (short-lived)
       │  │  Refresh Token (long-lived)
       ▼  ▼
┌─────────────────────────────────────────────┐
│         Protected Endpoints (/api/*)        │
│         JWT Validation + Role Checks        │
└─────────────────────────────────────────────┘
```

### JWT Configuration

- **Algorithm**: RS256 (RSA asymmetric)
- **Key Size**: 2048 bits minimum
- **Access Token TTL**: 15-60 minutes
- **Refresh Token TTL**: 30 days
- **Token Type**: Bearer

### Claims Structure

```json
{
  "sub": "123",           // User ID
  "email": "user@test.com",
  "nickname": "user1",    // Optional
  "roles": ["USER"],
  "iat": 1708450000,
  "exp": 1708453600,
  "iss": "trenvus"
}
```

## JWT Key Management

### Generating Keys

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem

# Base64 encode for env vars
base64 -w 0 private.pem  # JWT_PRIVATE_KEY_B64
base64 -w 0 public.pem   # JWT_PUBLIC_KEY_B64
```

### Environment Variables

```bash
JWT_PRIVATE_KEY_B64=<base64-encoded-private-key>
JWT_PUBLIC_KEY_B64=<base64-encoded-public-key>
JWT_ISSUER=trenvus
JWT_ACCESS_TTL_SECONDS=3600
JWT_REFRESH_TTL_SECONDS=2592000
```

## Security Configuration

### Public Endpoints (permitAll)

```java
/auth/register          // User registration
/auth/login             // User login
/auth/test-login        // Test account login
/auth/admin-login       // Admin login
/auth/refresh           // Token refresh
/auth/logout            // Logout
/swagger-ui/**          // API docs
/v3/api-docs/**         // OpenAPI spec
```

### Protected Endpoints (authenticated)

```java
/wallet                 // View wallet
/wallet/deposit         // Deposit funds
/exchange/convert       // Currency conversion
/transfer/trv          // P2P transfers
/invoices/**            // QR code payments
/transactions/**        // Transaction history
/me/**                  // User profile
```

### Admin Endpoints (ROLE_ADMIN)

```java
/admin/users            // List users
/admin/users/{id}/wallet // Manage user wallets
/admin/users/{id}/role   // Change user roles
```

## CORS Configuration

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    var config = new CorsConfiguration();
    config.setAllowedOrigins(List.of(
        "http://localhost:3000",
        "http://localhost:5173",
        "https://yourdomain.com"
    ));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);
    return new UrlBasedCorsConfigurationSource();
}
```

## Password Security

### Hashing

- **Algorithm**: BCrypt
- **Strength**: 10 (default)
- **Library**: `BCryptPasswordEncoder`

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

### Storage

- Never store plaintext passwords
- Never store passwords in logs
- Password hash stored in `users.password_hash`

## Token Security

### Refresh Token Best Practices

1. **Hash before storage** - SHA-256
2. **One-time use** - Rotate on refresh
3. **Revocation support** - Store revocation timestamp
4. **Device binding** - Optional IP/user-agent

### Token Rotation

```
Client              Server
  │  Access (expired) │
  │──────────────────▶│ 401 Unauthorized
  │                   │
  │ Refresh Token     │
  │──────────────────▶│ Validate
  │                   │ Revoke old
  │ New Access+Refresh│ Issue new
  │◀──────────────────│
```

## Authorization

### Role-Based Access Control (RBAC)

```java
public enum UserRole {
    USER,   // Standard user
    ADMIN   // Full admin access
}
```

### Method-Level Security

```java
@PreAuthorize("hasRole('ADMIN')")
@GetMapping("/admin/users")
public List<User> listUsers() { ... }
```

## Security Headers

Enable in Spring Security:

```java
http.headers(headers -> headers
    .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
    .xssProtection(HeadersConfigurer.XXssConfig::disable)
    .contentSecurityPolicy(csp -> 
        csp.policyDirectives("default-src 'self'")
    )
);
```

## Common Vulnerabilities

### Preventing

1. **SQL Injection** - Use JPA/Hibernate (parameterized queries)
2. **XSS** - Validate input, escape output
3. **CSRF** - Disabled (stateless JWT)
4. **IDOR** - Verify resource ownership
5. **Race Conditions** - Optimistic locking on wallets

### Input Validation

```java
@NotBlank @Email String email,
@NotBlank @Size(min=6) String password,
@Positive BigDecimal amount
```

## Security Checklist

- [ ] JWT keys are RSA 2048+ bits
- [ ] Keys rotated regularly
- [ ] Passwords hashed with BCrypt
- [ ] CORS origins restricted
- [ ] No sensitive data in logs
- [ ] Rate limiting enabled
- [ ] HTTPS in production
- [ ] Security headers configured
- [ ] Input validation on all endpoints
- [ ] Authorization checks on admin endpoints

## Testing Security

```bash
# Check JWT signature
curl -H "Authorization: Bearer TOKEN" http://localhost:8080/me

# Test CORS
curl -H "Origin: http://evil.com" http://localhost:8080/auth/login

# SQL injection attempt
curl -X POST http://localhost:8080/auth/login \
  -d '{"email":"test@test.com\' OR 1=1--","password":"test"}'
```
