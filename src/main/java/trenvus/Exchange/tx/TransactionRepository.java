package trenvus.Exchange.tx;

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

	@Query("select coalesce(sum(t.usdAmountCents), 0) from TransactionEntity t where t.userId = :userId and t.type = :type")
	Long sumUsdAmountCentsByUserIdAndType(@Param("userId") Long userId, @Param("type") TransactionType type);
}
