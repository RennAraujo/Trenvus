package trenvus.Exchange.auth;

public final class AuthExceptions {
	private AuthExceptions() {}

	public static class EmailAlreadyRegisteredException extends RuntimeException {
		public EmailAlreadyRegisteredException() {
			super("Email already registered");
		}
	}

	public static class InvalidCredentialsException extends RuntimeException {
		public InvalidCredentialsException() {
			super("Invalid credentials");
		}
	}

	public static class InvalidRefreshTokenException extends RuntimeException {
		public InvalidRefreshTokenException() {
			super("Invalid refresh token");
		}
	}

	public static class ExpiredRefreshTokenException extends RuntimeException {
		public ExpiredRefreshTokenException() {
			super("Refresh token expired");
		}
	}

	public static class InvalidUserException extends RuntimeException {
		public InvalidUserException() {
			super("Invalid user");
		}
	}
}
