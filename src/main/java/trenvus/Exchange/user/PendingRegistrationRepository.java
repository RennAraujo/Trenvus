package trenvus.Exchange.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PendingRegistrationRepository extends JpaRepository<PendingRegistration, Long> {
    Optional<PendingRegistration> findByToken(String token);
    
    Optional<PendingRegistration> findByEmail(String email);
    
    void deleteByEmail(String email);
}
