package trenvus.Exchange.user;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import trenvus.Exchange.email.EmailService;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    @Mock
    private EmailVerificationTokenRepository tokenRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private EmailVerificationService verificationService;

    private UserEntity testUser;

    @BeforeEach
    void setUp() {
        testUser = new UserEntity();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
    }

    @Test
    void createVerificationToken_ShouldCreateAndSendEmail() {
        // Given
        Long userId = 1L;
        String email = "test@example.com";
        String tokenType = "REGISTRATION";

        when(tokenRepository.save(any(EmailVerificationToken.class))).thenAnswer(invocation -> {
            EmailVerificationToken token = invocation.getArgument(0);
            token.setId(1L);
            return token;
        });

        // When
        String token = verificationService.createVerificationToken(userId, email, tokenType);

        // Then
        assertNotNull(token);
        assertFalse(token.isEmpty());
        verify(tokenRepository).deleteByUserIdAndEmailAndTokenTypeAndVerifiedAtIsNull(userId, email, tokenType);
        verify(tokenRepository).save(any(EmailVerificationToken.class));
        verify(emailService).sendVerificationEmail(email, token, tokenType);
    }

    @Test
    void verifyToken_ShouldMarkTokenAsVerified() {
        // Given
        String tokenValue = "test_token";
        EmailVerificationToken token = new EmailVerificationToken();
        token.setId(1L);
        token.setUserId(1L);
        token.setEmail("test@example.com");
        token.setToken(tokenValue);
        token.setTokenType("REGISTRATION");
        token.setExpiresAt(Instant.now().plusSeconds(3600));
        token.setVerifiedAt(null);

        when(tokenRepository.findByToken(tokenValue)).thenReturn(Optional.of(token));
        when(tokenRepository.save(any(EmailVerificationToken.class))).thenReturn(token);

        // When
        EmailVerificationService.VerificationResult result = verificationService.verifyToken(tokenValue);

        // Then
        assertNotNull(result);
        assertEquals(1L, result.userId());
        assertEquals("test@example.com", result.email());
        assertNotNull(token.getVerifiedAt());
    }

    @Test
    void verifyToken_ShouldThrowException_WhenTokenNotFound() {
        // Given
        String tokenValue = "invalid_token";
        when(tokenRepository.findByToken(tokenValue)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            verificationService.verifyToken(tokenValue);
        });
    }

    @Test
    void verifyToken_ShouldThrowException_WhenTokenExpired() {
        // Given
        String tokenValue = "expired_token";
        EmailVerificationToken token = new EmailVerificationToken();
        token.setExpiresAt(Instant.now().minusSeconds(3600));  // Expired

        when(tokenRepository.findByToken(tokenValue)).thenReturn(Optional.of(token));

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            verificationService.verifyToken(tokenValue);
        });
    }

    @Test
    void verifyToken_ShouldThrowException_WhenTokenAlreadyUsed() {
        // Given
        String tokenValue = "used_token";
        EmailVerificationToken token = new EmailVerificationToken();
        token.setExpiresAt(Instant.now().plusSeconds(3600));
        token.setVerifiedAt(Instant.now());  // Already verified

        when(tokenRepository.findByToken(tokenValue)).thenReturn(Optional.of(token));

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            verificationService.verifyToken(tokenValue);
        });
    }

    @Test
    void completeEmailVerification_ShouldUpdateUserEmail() {
        // Given
        Long userId = 1L;
        String newEmail = "newemail@example.com";

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(UserEntity.class))).thenReturn(testUser);

        // When
        verificationService.completeEmailVerification(userId, newEmail);

        // Then
        assertEquals(newEmail, testUser.getEmail());
        verify(userRepository).save(testUser);
    }

    @Test
    void markEmailAsVerified_ShouldSetEmailVerifiedFlag() {
        // Given
        Long userId = 1L;
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(UserEntity.class))).thenReturn(testUser);

        // When
        verificationService.markEmailAsVerified(userId);

        // Then
        assertTrue(testUser.isEmailVerified());
        verify(userRepository).save(testUser);
    }
}
