package trenvus.Exchange.auth;

public final class AuthExceptions {
	private AuthExceptions() {}

	public static class EmailAlreadyRegisteredException extends RuntimeException {
		public EmailAlreadyRegisteredException() {
			super("Email já cadastrado");
		}
	}

	public static class NicknameAlreadyRegisteredException extends RuntimeException {
		public NicknameAlreadyRegisteredException() {
			super("Apelido já cadastrado");
		}
	}

	public static class InvalidCredentialsException extends RuntimeException {
		public InvalidCredentialsException() {
			super("Credenciais inválidas");
		}
	}

	public static class InvalidRefreshTokenException extends RuntimeException {
		public InvalidRefreshTokenException() {
			super("Refresh token inválido");
		}
	}

	public static class ExpiredRefreshTokenException extends RuntimeException {
		public ExpiredRefreshTokenException() {
			super("Refresh token expirado");
		}
	}

	public static class InvalidUserException extends RuntimeException {
		public InvalidUserException() {
			super("Usuário inválido");
		}
	}
}
