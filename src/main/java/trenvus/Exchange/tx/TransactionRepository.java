package trenvus.Exchange.tx;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionRepository extends JpaRepository<TransactionEntity, Long> {
	Optional<TransactionEntity> findByUserIdAndIdempotencyKey(Long userId, String idempotencyKey);
	Page<TransactionEntity> findByUserIdOrderByIdDesc(Long userId, Pageable pageable);
}

