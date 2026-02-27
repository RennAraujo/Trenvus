package trenvus.Exchange.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Enumerated;
import java.time.Instant;

@Entity
@Table(name = "users")
public class UserEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 255)
	private String email;

	@Column(name = "password_hash", nullable = false, length = 255)
	private String passwordHash;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt = Instant.now();

	@Column(nullable = false, length = 16)
	@Enumerated(EnumType.STRING)
	private UserRole role = UserRole.USER;

	@Column(length = 64, unique = true)
	private String nickname;

	@Column(length = 32)
	private String phone;

	@Column(name = "avatar_data_url", length = 1024)
	private String avatarDataUrl;

	@Column(name = "email_verified", nullable = false)
	private boolean emailVerified = false;

	public Long getId() {
		return id;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public void setPasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public UserRole getRole() {
		return role;
	}

	public void setRole(UserRole role) {
		this.role = role;
	}

	public String getNickname() {
		return nickname;
	}

	public void setNickname(String nickname) {
		this.nickname = nickname;
	}

	public String getPhone() {
		return phone;
	}

	public void setPhone(String phone) {
		this.phone = phone;
	}

	public String getAvatarDataUrl() {
		return avatarDataUrl;
	}

	public void setAvatarDataUrl(String avatarDataUrl) {
		this.avatarDataUrl = avatarDataUrl;
	}

	public boolean isEmailVerified() {
		return emailVerified;
	}

	public void setEmailVerified(boolean emailVerified) {
		this.emailVerified = emailVerified;
	}
}
