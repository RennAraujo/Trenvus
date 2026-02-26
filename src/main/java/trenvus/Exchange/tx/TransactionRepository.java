package trenvus.Exchange.tx;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TransactionRepository extends JpaRepository<TransactionEntity, Long> {
	Optional<TransactionEntity> findByUserIdAndIdempotencyKey(Long userId, String idempotencyKey);
	Page<TransactionEntity> findByUserIdOrderByIdDesc(Long userId, Pageable pageable);
	Page<TransactionEntity> findByUserIdAndTypeOrderByIdDesc(Long userId, TransactionType type, Pageable pageable);

	@Query("SELECT COALESCE(SUM(t.usdAmountCents), 0) FROM TransactionEntity t WHERE t.userId = :userId AND t.type = :type")
	long sumUsdAmountCentsByUserIdAndType(@Param("userId") Long userId, @Param("type") TransactionType type);

	List<TransactionEntity> findByUserId(Long userId);

	List<TransactionEntity> findBySourceUserId(Long sourceUserId);
}

