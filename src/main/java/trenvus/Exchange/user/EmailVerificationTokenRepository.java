package trenvus.Exchange.user;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
	Optional<EmailVerificationToken> findByToken(String token);

	Optional<EmailVerificationToken> findByUserIdAndEmailAndTokenTypeAndVerifiedAtIsNull(Long userId, String email, String tokenType);

	void deleteByUserIdAndEmailAndTokenTypeAndVerifiedAtIsNull(Long userId, String email, String tokenType);
}
