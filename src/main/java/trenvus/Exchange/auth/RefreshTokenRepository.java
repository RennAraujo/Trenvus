package trenvus.Exchange.auth;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, Long> {
	Optional<RefreshTokenEntity> findByTokenHash(String tokenHash);

	@Modifying
	@Query("update RefreshTokenEntity rt set rt.revokedAt = :revokedAt where rt.tokenHash = :tokenHash and rt.revokedAt is null")
	int revoke(@Param("tokenHash") String tokenHash, @Param("revokedAt") Instant revokedAt);
}
