package trenvus.Exchange.security;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import trenvus.Exchange.user.UserRole;
import trenvus.Exchange.user.UserRepository;

@Service
public class SecurityUserDetailsService implements UserDetailsService {
	private static final Logger logger = LoggerFactory.getLogger(SecurityUserDetailsService.class);
	
	private final UserRepository users;

	public SecurityUserDetailsService(UserRepository users) {
		this.users = users;
	}

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		logger.info("Loading user by username: {}", username);
		var user = users.findByEmail(username).orElseThrow(() -> {
			logger.warn("User not found: {}", username);
			return new UsernameNotFoundException("User not found: " + username);
		});
		
		logger.info("User found: {} (id: {}, role: {}, passwordHash is null: {})", 
			user.getEmail(), user.getId(), user.getRole(), user.getPasswordHash() == null);
		
		if (user.getPasswordHash() == null) {
			logger.error("Password hash is null for user: {}", username);
			throw new IllegalStateException("User has no password: " + username);
		}
		
		var role = user.getRole() == null ? UserRole.USER : user.getRole();
		return new User(user.getEmail(), user.getPasswordHash(), List.of(new SimpleGrantedAuthority("ROLE_" + role.name())));
	}
}
