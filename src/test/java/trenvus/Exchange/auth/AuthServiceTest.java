package trenvus.Exchange.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import trenvus.Exchange.user.EmailVerificationService;
import trenvus.Exchange.user.UserEntity;
import trenvus.Exchange.user.UserRepository;
import trenvus.Exchange.wallet.WalletService;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository users;

    @Mock
    private RefreshTokenRepository refreshTokens;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private TokenService tokenService;

    @Mock
    private WalletService walletService;

    @Mock
    private EmailVerificationService emailVerificationService;

    @InjectMocks
    private AuthService authService;

    private UserEntity testUser;

    @BeforeEach
    void setUp() {
        testUser = new UserEntity();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setPasswordHash("encoded_password");
    }

    @Test
    void register_ShouldCreateNewUser() {
        // Given
        String email = "test@example.com";
        String password = "password123";
        String nickname = "testuser";
        String phone = "+1234567890";

        when(users.existsByEmail(email)).thenReturn(false);
        when(passwordEncoder.encode(password)).thenReturn("encoded_password");
        when(users.save(any(UserEntity.class))).thenReturn(testUser);
        when(tokenService.createAccessToken(any(UserEntity.class), any(Instant.class)))
                .thenReturn(new TokenService.AccessTokenResult("access_token", Instant.now().plusSeconds(900)));
        when(tokenService.createRefreshToken(any(Instant.class)))
                .thenReturn(new TokenService.RefreshTokenResult("refresh_token", "token_hash", Instant.now().plusSeconds(2592000)));

        // When
        AuthService.AuthResult result = authService.register(email, password, nickname, phone);

        // Then
        assertNotNull(result);
        assertEquals("access_token", result.accessToken());
        assertEquals("refresh_token", result.refreshToken());
        verify(users).save(any(UserEntity.class));
        verify(walletService).ensureUserWallets(1L);
        verify(emailVerificationService).createVerificationToken(1L, email, "REGISTRATION");
    }

    @Test
    void register_ShouldThrowException_WhenEmailAlreadyExists() {
        // Given
        String email = "test@example.com";
        when(users.existsByEmail(email)).thenReturn(true);

        // When & Then
        assertThrows(AuthExceptions.EmailAlreadyRegisteredException.class, () -> {
            authService.register(email, "password", null, null);
        });
    }

    @Test
    void register_ShouldNotFail_WhenEmailServiceThrowsException() {
        // Given
        String email = "test@example.com";
        when(users.existsByEmail(email)).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("encoded");
        when(users.save(any())).thenReturn(testUser);
        when(tokenService.createAccessToken(any(), any())).thenReturn(new TokenService.AccessTokenResult("token", Instant.now()));
        when(tokenService.createRefreshToken(any())).thenReturn(new TokenService.RefreshTokenResult("refresh", "hash", Instant.now()));
        doThrow(new RuntimeException("Email service failed")).when(emailVerificationService).createVerificationToken(anyLong(), any(), any());

        // When
        AuthService.AuthResult result = authService.register(email, "password", null, null);

        // Then
        assertNotNull(result);  // Should not fail even if email service fails
    }

    @Test
    void login_ShouldAuthenticateUser() {
        // Given
        String email = "test@example.com";
        String password = "password123";

        when(users.findByEmail(email)).thenReturn(Optional.of(testUser));
        when(tokenService.createAccessToken(any(), any())).thenReturn(new TokenService.AccessTokenResult("access_token", Instant.now()));
        when(tokenService.createRefreshToken(any())).thenReturn(new TokenService.RefreshTokenResult("refresh_token", "hash", Instant.now()));

        // When
        AuthService.AuthResult result = authService.login(email, password);

        // Then
        assertNotNull(result);
        verify(authenticationManager).authenticate(any());
    }

    @Test
    void login_ShouldThrowException_WhenUserNotFound() {
        // Given
        String email = "nonexistent@example.com";
        when(users.findByEmail(email)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(AuthExceptions.InvalidCredentialsException.class, () -> {
            authService.login(email, "password");
        });
    }
}
