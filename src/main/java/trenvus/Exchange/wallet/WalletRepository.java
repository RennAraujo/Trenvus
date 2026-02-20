package trenvus.Exchange.wallet;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WalletRepository extends JpaRepository<WalletEntity, Long> {
	Optional<WalletEntity> findByUserIdAndCurrency(Long userId, Currency currency);

	List<WalletEntity> findByUserId(Long userId);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select w from WalletEntity w where w.userId = :userId and w.currency in :currencies")
	List<WalletEntity> findForUpdate(@Param("userId") Long userId, @Param("currencies") List<Currency> currencies);
}

