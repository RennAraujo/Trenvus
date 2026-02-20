package trenvus.Exchange.security;

import java.security.KeyFactory;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class JwtKeyMaterial {
	private final RSAPrivateKey privateKey;
	private final RSAPublicKey publicKey;

	public JwtKeyMaterial(
			Environment environment,
			@Value("${JWT_PRIVATE_KEY_B64:}") String privateKeyB64,
			@Value("${JWT_PUBLIC_KEY_B64:}") String publicKeyB64
	) {
		boolean isTestProfile = environment != null && environment.matchesProfiles("test");
		if (isTestProfile && (isBlank(privateKeyB64) || isBlank(publicKeyB64))) {
			var keyPair = generateKeyPair();
			this.privateKey = (RSAPrivateKey) keyPair.getPrivate();
			this.publicKey = (RSAPublicKey) keyPair.getPublic();
			return;
		}

		if (isBlank(privateKeyB64) || isBlank(publicKeyB64)) {
			throw new IllegalStateException("JWT keys are required (JWT_PRIVATE_KEY_B64 and JWT_PUBLIC_KEY_B64)");
		}

		this.privateKey = parsePrivateKey(privateKeyB64);
		this.publicKey = parsePublicKey(publicKeyB64);
	}

	public RSAPrivateKey getPrivateKey() {
		return privateKey;
	}

	public RSAPublicKey getPublicKey() {
		return publicKey;
	}

	private static RSAPrivateKey parsePrivateKey(String privateKeyB64) {
		try {
			var keyBytes = Base64.getDecoder().decode(privateKeyB64);
			var spec = new PKCS8EncodedKeySpec(keyBytes);
			var keyFactory = KeyFactory.getInstance("RSA");
			return (RSAPrivateKey) keyFactory.generatePrivate(spec);
		} catch (Exception e) {
			throw new IllegalStateException("Invalid JWT_PRIVATE_KEY_B64", e);
		}
	}

	private static RSAPublicKey parsePublicKey(String publicKeyB64) {
		try {
			var keyBytes = Base64.getDecoder().decode(publicKeyB64);
			var spec = new X509EncodedKeySpec(keyBytes);
			var keyFactory = KeyFactory.getInstance("RSA");
			return (RSAPublicKey) keyFactory.generatePublic(spec);
		} catch (Exception e) {
			throw new IllegalStateException("Invalid JWT_PUBLIC_KEY_B64", e);
		}
	}

	private static boolean isBlank(String value) {
		return value == null || value.isBlank();
	}

	private static java.security.KeyPair generateKeyPair() {
		try {
			var generator = KeyPairGenerator.getInstance("RSA");
			generator.initialize(2048);
			return generator.generateKeyPair();
		} catch (Exception e) {
			throw new IllegalStateException("Unable to generate RSA keypair", e);
		}
	}
}
