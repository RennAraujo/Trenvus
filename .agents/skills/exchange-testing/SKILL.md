---
name: exchange-testing
description: Senior QA/Test Engineer specializing in automated testing for Spring Boot (JUnit 5, Mockito, TestContainers) and React (Jest, React Testing Library, Playwright). Use when writing unit tests, integration tests, end-to-end tests, or setting up test infrastructure. Expert in test-driven development, mocking external services, database testing with H2/TestContainers, and CI/CD test automation.
---

# Exchange Testing Engineer

Testing specialist for the Exchange Platform - both backend (Java) and frontend (React).

## Testing Strategy

### Test Pyramid

```
       ▲
      /│\     E2E Tests (Playwright)
     / │ \    ~5% - Critical user flows
    /──┼──\
   /   │   \  Integration Tests
  /    │    \ ~15% - Service layer, DB
 /─────┼─────\
/      │      \ Unit Tests
/       │       \ ~80% - Business logic
─────────────────
```

## Backend Testing

### Test Structure

```
src/test/java/trenvus/Exchange/
├── Test Setup
│   ├── application-test.properties
│   └── TestDataFactory.java
├── Unit Tests
│   ├── exchange/
│   │   └── ExchangeServiceTest.java
│   ├── transfer/
│   │   └── TransferServiceTest.java
│   └── money/
│       └── MoneyCentsTest.java
└── Integration Tests
    └── ExchangeApplicationTests.java
```

### Test Configuration

`src/test/resources/application-test.properties`:

```properties
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.hibernate.ddl-auto=create-drop
spring.flyway.enabled=false
jwt.access.ttl.seconds=3600
```

### Unit Test Template

```java
@ExtendWith(MockitoExtension.class)
class TransferServiceTest {
    
    @Mock
    private WalletRepository wallets;
    
    @Mock
    private TransactionRepository transactions;
    
    @InjectMocks
    private TransferService transferService;
    
    @Test
    void shouldTransferSuccessfully() {
        // Given
        Long fromUserId = 1L;
        Long toUserId = 2L;
        long amount = 10000L;
        
        WalletEntity fromWallet = new WalletEntity();
        fromWallet.setUserId(fromUserId);
        fromWallet.setBalanceCents(50000L);
        
        when(wallets.findForUpdate(eq(fromUserId), any()))
            .thenReturn(List.of(fromWallet));
        
        // When
        var result = transferService.transferTrv(fromUserId, toUserId, amount);
        
        // Then
        assertEquals(40000L, fromWallet.getBalanceCents());
        verify(transactions).save(any(TransactionEntity.class));
    }
    
    @Test
    void shouldThrowWhenInsufficientBalance() {
        // Given
        Long fromUserId = 1L;
        long amount = 100000L;
        
        WalletEntity fromWallet = new WalletEntity();
        fromWallet.setBalanceCents(5000L);
        
        when(wallets.findForUpdate(eq(fromUserId), any()))
            .thenReturn(List.of(fromWallet));
        
        // Then
        assertThrows(IllegalArgumentException.class, () -> {
            transferService.transferTrv(fromUserId, 2L, amount);
        });
    }
}
```

### Integration Test Template

```java
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private UserRepository users;
    
    @Autowired
    private PasswordEncoder encoder;
    
    @Test
    void shouldLoginSuccessfully() throws Exception {
        // Setup
        var user = new UserEntity();
        user.setEmail("test@test.com");
        user.setPasswordHash(encoder.encode("password"));
        users.save(user);
        
        // Execute & Verify
        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email": "test@test.com", "password": "password"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").exists())
            .andExpect(jsonPath("$.tokenType").value("Bearer"));
    }
}
```

## Frontend Testing

### Test Structure

```
frontend/src/
├── components/
│   ├── Button.test.tsx
│   └── Input.test.tsx
├── pages/
│   ├── Login.test.tsx
│   └── Transfer.test.tsx
├── hooks/
│   └── useAuth.test.ts
└── utils/
    └── format.test.ts
```

### Component Test Template

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Transfer } from './Transfer';
import { AuthProvider } from '../auth';

describe('Transfer', () => {
  it('should display balance after load', async () => {
    render(
      <AuthProvider>
        <Transfer />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/USD/)).toBeInTheDocument();
    });
  });
  
  it('should validate amount input', () => {
    render(<Transfer />);
    
    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: 'abc' } });
    
    expect(screen.getByText(/Invalid amount/)).toBeInTheDocument();
  });
  
  it('should submit transfer on button click', async () => {
    const mockTransfer = jest.fn();
    render(<Transfer onTransfer={mockTransfer} />);
    
    fireEvent.change(screen.getByLabelText(/To/), {
      target: { value: 'user@test.com' }
    });
    fireEvent.change(screen.getByLabelText(/Amount/), {
      target: { value: '100.00' }
    });
    fireEvent.click(screen.getByText(/Send/));
    
    await waitFor(() => {
      expect(mockTransfer).toHaveBeenCalledWith({
        toIdentifier: 'user@test.com',
        amount: '100.00'
      });
    });
  });
});
```

### Hook Test Template

```tsx
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './auth';

describe('useAuth', () => {
  it('should login and update state', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('test@test.com', 'password');
    });
    
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

## E2E Testing (Playwright)

### Setup

```bash
npm init playwright@latest
```

### Test Example

```typescript
// tests/transfer.spec.ts
import { test, expect } from '@playwright/test';

test('user can transfer TRV', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name=email]', 'user@test.com');
  await page.fill('[name=password]', '123');
  await page.click('button[type=submit]');
  
  // Navigate to transfer
  await page.goto('/app/transfer');
  
  // Fill form
  await page.fill('[name=toIdentifier]', 'user2@test.com');
  await page.fill('[name=amount]', '50.00');
  
  // Submit
  await page.click('button:has-text("Send")');
  
  // Verify success
  await expect(page.locator('.alert-success')).toBeVisible();
  await expect(page.locator('.alert-success')).toContainText('Transfer successful');
});
```

## Test Data Factory

```java
@Component
public class TestDataFactory {
    
    @Autowired
    private UserRepository users;
    
    @Autowired
    private PasswordEncoder encoder;
    
    public UserEntity createUser(String email, String password) {
        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(password));
        return users.save(user);
    }
    
    public WalletEntity createWallet(Long userId, Currency currency, long balance) {
        // ...
    }
}
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      - run: ./mvnw test

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd frontend && npm ci && npm test
```

## Testing Best Practices

### General

1. **Test behavior, not implementation**
2. **One assertion per test** (ideal)
3. **Descriptive test names**: `shouldThrowWhenInsufficientBalance`
4. **Given-When-Then** structure
5. **Clean up after tests** - `@Transactional` for DB

### Backend

- Mock external services (OKX API)
- Use H2 for unit tests
- Use TestContainers for integration tests
- Test edge cases: zero, negative, max values

### Frontend

- Test user interactions, not implementation
- Mock API calls with MSW (Mock Service Worker)
- Test accessibility with jest-axe
- Snapshot tests for UI components (optional)

### Coverage Targets

- Backend: 80% line coverage minimum
- Frontend: 70% line coverage minimum
- Critical paths: 100% coverage

## Commands

```bash
# Backend
./mvnw test                           # Run all tests
./mvnw test -Dtest=TransferServiceTest # Run specific test
./mvnw test -Dspring.profiles.active=test

# Frontend
cd frontend
npm test                              # Run tests
npm test -- --coverage               # With coverage
npm test -- --watch                  # Watch mode
npx playwright test                  # E2E tests
```
