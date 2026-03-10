package trenvus.Exchange.voucher;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<VoucherEntity, Long> {
    Optional<VoucherEntity> findByCode(String code);
    Optional<VoucherEntity> findByUserId(Long userId);
    boolean existsByCode(String code);
    boolean existsByUserId(Long userId);
}
