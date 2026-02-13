package trenvus.Exchange.user;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
	Optional<UserEntity> findByEmail(String email);
	boolean existsByEmail(String email);
	boolean existsByNicknameIgnoreCase(String nickname);
	List<UserEntity> findAllByNicknameIgnoreCase(String nickname);
}
