package trenvus.Exchange.security;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import com.fasterxml.jackson.databind.ObjectMapper;
import trenvus.Exchange.auth.TokenBlacklistService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Instant;
import java.util.Map;

@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {
	private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);
	
	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtKeyMaterial keys, TokenBlacklistService tokenBlacklistService) throws Exception {
		logger.info("Configuring SecurityFilterChain");
		return http
				.csrf(csrf -> csrf.disable())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.cors(Customizer.withDefaults())
				.authorizeHttpRequests(auth -> {
					logger.info("Configuring authorizeHttpRequests");
					auth.requestMatchers(AntPathRequestMatcher.antMatcher("/error")).permitAll()
						.requestMatchers(AntPathRequestMatcher.antMatcher("/actuator/health")).permitAll()
						.requestMatchers(AntPathRequestMatcher.antMatcher("/actuator/info")).permitAll()
						.requestMatchers(AntPathRequestMatcher.antMatcher("/auth/register")).permitAll()
						.requestMatchers(AntPathRequestMatcher.antMatcher("/auth/confirm-registration")).permitAll()
						.requestMatchers(AntPathRequestMatcher.antMatcher("/auth/login")).permitAll()
						.requestMatchers(AntPathRequestMatcher.antMatcher("/auth/test-login")).permitAll()
						.requestMatchers(AntPathRequestMatcher.antMatcher("/auth/admin-login")).permitAll()
						.requestMatchers(AntPathRequestMatcher.antMatcher("/auth/test-accounts-status")).permitAll()
						.requestMatchers(AntPathRequestMatcher.antMatcher("/auth/refresh")).permitAll()
						.requestMatchers(AntPathRequestMatcher.antMatcher("/auth/logout")).permitAll()
						.requestMatchers(AntPathRequestMatcher.antMatcher("/voucher/profile/**")).permitAll()
						.requestMatchers(AntPathRequestMatcher.antMatcher("/swagger-ui.html")).permitAll()
						.requestMatchers(AntPathRequestMatcher.antMatcher("/swagger-ui")).permitAll()
						.requestMatchers(AntPathRequestMatcher.antMatcher("/swagger-ui/**")).permitAll()
						.requestMatchers(AntPathRequestMatcher.antMatcher("/v3/api-docs")).permitAll()
						.requestMatchers(AntPathRequestMatcher.antMatcher("/v3/api-docs/**")).permitAll()
						.anyRequest().authenticated();
					logger.info("authorizeHttpRequests configured successfully");
				})
				.oauth2ResourceServer(oauth2 -> {
					oauth2.jwt(jwt -> {
						jwt.decoder(jwtDecoder(keys, tokenBlacklistService));
						jwt.jwtAuthenticationConverter(jwtAuthenticationConverter());
					});
					oauth2.bearerTokenResolver(request -> {
						// Para endpoints públicos, não exigir token
						String path = request.getRequestURI();
						logger.debug("BearerTokenResolver - path: {}", path);
						if (path.startsWith("/auth/register") || 
						    path.startsWith("/auth/confirm-registration") ||
						    path.startsWith("/auth/login") ||
						    path.startsWith("/auth/test-login") ||
						    path.startsWith("/auth/admin-login") ||
						    path.startsWith("/auth/test-accounts-status") ||
						    path.startsWith("/swagger-ui") ||
						    path.startsWith("/v3/api-docs")) {
							logger.debug("Public endpoint, allowing without token: {}", path);
							return null;
						}
						String authHeader = request.getHeader("Authorization");
						if (authHeader != null && authHeader.startsWith("Bearer ")) {
							return authHeader.substring(7);
						}
						return null;
					});
				})
				.exceptionHandling(ex -> {
					ex.authenticationEntryPoint(authenticationEntryPoint());
					ex.accessDeniedHandler(accessDeniedHandler());
				})
				.build();
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public AuthenticationManager authenticationManager(SecurityUserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
		var provider = new DaoAuthenticationProvider();
		provider.setUserDetailsService(userDetailsService);
		provider.setPasswordEncoder(passwordEncoder);
		return new ProviderManager(provider);
	}

	@Bean
	public JwtDecoder jwtDecoder(JwtKeyMaterial keys, TokenBlacklistService blacklistService) {
		JwtDecoder delegate = NimbusJwtDecoder.withPublicKey(keys.getPublicKey()).build();
		return new BlacklistAwareJwtDecoder(delegate, blacklistService);
	}

	@Bean
	public JwtEncoder jwtEncoder(JwtKeyMaterial keys) {
		var jwk = new RSAKey.Builder(keys.getPublicKey()).privateKey(keys.getPrivateKey()).build();
		return new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(jwk)));
	}

	@Bean
	public JwtAuthenticationConverter jwtAuthenticationConverter() {
		var authorities = new JwtGrantedAuthoritiesConverter();
		authorities.setAuthoritiesClaimName("roles");
		authorities.setAuthorityPrefix("ROLE_");

		var converter = new JwtAuthenticationConverter();
		converter.setJwtGrantedAuthoritiesConverter(jwt -> {
			var grantedAuthorities = authorities.convert(jwt);
			logger.info("JWT authorities extracted: {} from claim 'roles'", grantedAuthorities);
			return grantedAuthorities;
		});
		return converter;
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource(@Value("${APP_CORS_ORIGINS:}") String originsRaw) {
		var config = new CorsConfiguration();
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		config.setAllowedHeaders(List.of("*"));
		config.setAllowCredentials(true);

		if (originsRaw != null && !originsRaw.isBlank()) {
			config.setAllowedOrigins(Arrays.stream(originsRaw.split(","))
					.map(String::trim)
					.filter(s -> !s.isBlank())
					.toList());
		} else {
			config.setAllowedOrigins(List.of());
		}

		var source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);
		return source;
	}

	@Bean
	public AuthenticationEntryPoint authenticationEntryPoint() {
		return (request, response, authException) -> {
			logger.warn("Authentication failed for path: {} - {}", request.getRequestURI(), authException.getMessage());
			response.setStatus(HttpStatus.UNAUTHORIZED.value());
			response.setContentType(MediaType.APPLICATION_JSON_VALUE);
			var errorBody = Map.of(
					"status", HttpStatus.UNAUTHORIZED.value(),
					"message", "Authentication required",
					"path", request.getRequestURI(),
					"timestamp", Instant.now().toString()
			);
			new ObjectMapper().writeValue(response.getOutputStream(), errorBody);
		};
	}

	@Bean
	public AccessDeniedHandler accessDeniedHandler() {
		return (request, response, accessDeniedException) -> {
			logger.warn("Access denied for path: {} - user: {} - {}", 
					request.getRequestURI(), 
					request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : "anonymous",
					accessDeniedException.getMessage());
			response.setStatus(HttpStatus.FORBIDDEN.value());
			response.setContentType(MediaType.APPLICATION_JSON_VALUE);
			var errorBody = Map.of(
					"status", HttpStatus.FORBIDDEN.value(),
					"message", "Access denied - insufficient privileges",
					"path", request.getRequestURI(),
					"timestamp", Instant.now().toString()
			);
			new ObjectMapper().writeValue(response.getOutputStream(), errorBody);
		};
	}
}
