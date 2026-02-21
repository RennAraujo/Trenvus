---
name: exchange-backend
description: Senior Java Backend Developer specializing in Spring Boot 3.4+, JPA/Hibernate, PostgreSQL, and RESTful API design for the Exchange Platform. Use when implementing backend features, debugging Java code, designing database schemas, optimizing queries, or working with Spring Security/JWT. Expert in transaction management, optimistic locking, Flyway migrations, and clean architecture.
---

# Exchange Backend Developer

Senior Java Backend specialist for the Exchange Platform - a digital currency exchange system.

## Tech Stack

- **Java 17** - Language
- **Spring Boot 3.4.2** - Framework
- **Spring Data JPA** - Data access
- **PostgreSQL 16** - Database
- **Flyway** - Database migrations
- **Spring Security + JWT (RS256)** - Authentication
- **Maven** - Build tool
- **Docker** - Containerization

## Project Structure

```
src/main/java/trenvus/Exchange/
├── ExchangeApplication.java          # Entry point
├── auth/                             # Authentication, JWT, tokens
├── admin/                            # Admin endpoints
├── config/                           # Configuration classes
├── exchange/                         # Currency conversion logic
├── invoice/                          # QR code payments
├── market/                           # Market data (OKX integration)
├── money/                            # Money value objects
├── security/                         # Security configuration
├── transfer/                         # P2P transfers
├── tx/                               # Transactions
├── user/                             # User management
├── wallet/                           # Wallet operations
└── web/                              # Exception handlers
```

## Coding Standards

### Package Naming
- All packages start with `trenvus.Exchange`
- Use lowercase, no underscores

### Class Naming
- **Entities**: `UserEntity`, `WalletEntity` (suffix `Entity`)
- **Repositories**: `UserRepository` (suffix `Repository`)
- **Services**: `AuthService`, `TransferService` (suffix `Service`)
- **Controllers**: `AuthController` (suffix `Controller`)
- **DTOs/Records**: Use Java Records for request/response

### Database Conventions
- Table names: `users`, `wallets`, `transactions`
- Columns: `user_id`, `password_hash`, `created_at` (snake_case)
- Flyway migrations: `V1__init.sql`, `V2__feature.sql` (double underscore)
- Use `BIGINT` for IDs and cents (avoid floating point)

### Transaction Safety
- Always use `@Transactional` for write operations
- Use optimistic locking (`@Version`) on wallets
- Lock wallets in consistent order to prevent deadlocks

```java
@Transactional
public void transfer(Long fromUserId, Long toUserId, long amount) {
    Long first = Math.min(fromUserId, toUserId);
    Long second = Math.max(fromUserId, toUserId);
    
    var firstLocked = wallets.findForUpdate(first, List.of(Currency.TRV));
    var secondLocked = wallets.findForUpdate(second, List.of(Currency.TRV));
    // ... process transfer
}
```

### JWT Best Practices
- Use RS256 (RSA keys) - never HS256
- Access tokens: short-lived (15-60 min)
- Refresh tokens: long-lived (30 days)
- Store claims: `sub` (userId), `email`, `roles`

## Common Tasks

### Creating a New Endpoint

1. **Controller** - REST endpoint with validation:
```java
@RestController
@RequestMapping("/api/feature")
@Validated
public class FeatureController {
    @PostMapping
    public ResponseEntity<Response> action(@Valid @RequestBody Request request) {
        // delegate to service
    }
}
```

2. **Service** - Business logic with transactions:
```java
@Service
public class FeatureService {
    @Transactional
    public Result process(Request request) {
        // business logic
    }
}
```

3. **Add to SecurityConfig** - If public endpoint:
```java
.requestMatchers(AntPathRequestMatcher.antMatcher("/api/feature")).permitAll()
```

### Adding a Migration

Create file: `src/main/resources/db/migration/V{N}__{description}.sql`

```sql
-- Example: V8__add_new_table.sql
CREATE TABLE IF NOT EXISTS new_table (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Handling Money

Always use cents (integer) - never BigDecimal for storage:

```java
// Good
long amountCents = request.amount().multiply(BigDecimal.valueOf(100)).longValue();

// Bad - floating point
double amount = request.getAmount(); // NEVER!
```

## Error Handling

Use `@ControllerAdvice` for global exception handling:

```java
@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handle(IllegalArgumentException e) {
        return ResponseEntity.badRequest()
            .body(new ErrorResponse(e.getMessage()));
    }
}
```

## Testing

- Unit tests: JUnit 5 + Mockito
- Integration tests: `@SpringBootTest` with H2
- Always use `@ActiveProfiles("test")`

## Performance Tips

1. Use `@Transactional(readOnly = true)` for queries
2. Add database indexes for frequent queries
3. Use `findForUpdate()` with pessimistic locking for wallet operations
4. Cache market data (OKX) with TTL

## Docker Commands

```bash
# Build
./mvnw clean package -DskipTests

# Run with Docker Compose
docker-compose up --build -d

# View logs
docker-compose logs -f backend
```

## Architecture Decisions

- **Layered Architecture**: Controller → Service → Repository
- **DTO Pattern**: Use Records for API contracts
- **Optimistic Locking**: `@Version` on WalletEntity prevents race conditions
- **Database-First**: Flyway migrations versioned in Git
- **Security**: Stateless JWT, no server-side sessions
