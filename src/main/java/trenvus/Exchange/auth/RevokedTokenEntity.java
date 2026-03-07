package trenvus.Exchange.auth;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "revoked_tokens")
public class RevokedTokenEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "token_jti", nullable = false, unique = true, length = 64)
    private String tokenJti;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "revoked_at", nullable = false)
    private Instant revokedAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTokenJti() { return tokenJti; }
    public void setTokenJti(String tokenJti) { this.tokenJti = tokenJti; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Instant getRevokedAt() { return revokedAt; }
    public void setRevokedAt(Instant revokedAt) { this.revokedAt = revokedAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
}
