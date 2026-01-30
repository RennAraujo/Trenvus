package trenvus.Exchange.tx;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "transactions")
public class TransactionEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private TransactionType type;

	@Column(name = "usd_amount_cents")
	private Long usdAmountCents;

	@Column(name = "vps_amount_cents")
	private Long vpsAmountCents;

	@Column(name = "fee_usd_cents")
	private Long feeUsdCents;

	@Column(name = "idempotency_key", length = 128)
	private String idempotencyKey;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt = Instant.now();

	public Long getId() {
		return id;
	}

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public TransactionType getType() {
		return type;
	}

	public void setType(TransactionType type) {
		this.type = type;
	}

	public Long getUsdAmountCents() {
		return usdAmountCents;
	}

	public void setUsdAmountCents(Long usdAmountCents) {
		this.usdAmountCents = usdAmountCents;
	}

	public Long getVpsAmountCents() {
		return vpsAmountCents;
	}

	public void setVpsAmountCents(Long vpsAmountCents) {
		this.vpsAmountCents = vpsAmountCents;
	}

	public Long getFeeUsdCents() {
		return feeUsdCents;
	}

	public void setFeeUsdCents(Long feeUsdCents) {
		this.feeUsdCents = feeUsdCents;
	}

	public String getIdempotencyKey() {
		return idempotencyKey;
	}

	public void setIdempotencyKey(String idempotencyKey) {
		this.idempotencyKey = idempotencyKey;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}

