package trenvus.Exchange.security;

import java.util.List;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import trenvus.Exchange.user.UserRepository;

@Service
public class SecurityUserDetailsService implements UserDetailsService {
	private final UserRepository users;

	public SecurityUserDetailsService(UserRepository users) {
		this.users = users;
	}

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		var user = users.findByEmail(username).orElseThrow(() -> new UsernameNotFoundException("User not found"));
		return new User(user.getEmail(), user.getPasswordHash(), List.of(new SimpleGrantedAuthority("ROLE_USER")));
	}
}

