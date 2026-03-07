package trenvus.Exchange.auth;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RevokedTokenRepository extends JpaRepository<RevokedTokenEntity, Long> {
    Optional<RevokedTokenEntity> findByTokenJti(String tokenJti);
    
    boolean existsByTokenJti(String tokenJti);
    
    @Modifying
    @Query("DELETE FROM RevokedTokenEntity rt WHERE rt.expiresAt < :cutoff")
    int deleteExpiredTokens(@Param("cutoff") Instant cutoff);
}
