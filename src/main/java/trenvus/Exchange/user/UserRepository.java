package trenvus.Exchange.user;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
	Optional<UserEntity> findByEmail(String email);
	Optional<UserEntity> findByEmailIgnoreCase(String email);
	Optional<UserEntity> findByNickname(String nickname);
	Optional<UserEntity> findByNicknameIgnoreCase(String nickname);
	boolean existsByEmail(String email);
	boolean existsByNicknameIgnoreCase(String nickname);
}

