package trenvus.Exchange.web;

import jakarta.validation.ConstraintViolationException;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import trenvus.Exchange.auth.AuthExceptions;

@RestControllerAdvice
public class ApiExceptionHandler {
	@ExceptionHandler(AuthExceptions.EmailAlreadyRegisteredException.class)
	public ResponseEntity<ApiError> handleEmailAlreadyRegistered(AuthExceptions.EmailAlreadyRegisteredException ex) {
		return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError("email_already_registered", ex.getMessage(), Instant.now()));
	}

	@ExceptionHandler(AuthExceptions.InvalidCredentialsException.class)
	public ResponseEntity<ApiError> handleInvalidCredentials(AuthExceptions.InvalidCredentialsException ex) {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiError("invalid_credentials", ex.getMessage(), Instant.now()));
	}

	@ExceptionHandler(AuthExceptions.InvalidRefreshTokenException.class)
	public ResponseEntity<ApiError> handleInvalidRefreshToken(AuthExceptions.InvalidRefreshTokenException ex) {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiError("invalid_refresh_token", ex.getMessage(), Instant.now()));
	}

	@ExceptionHandler(AuthExceptions.ExpiredRefreshTokenException.class)
	public ResponseEntity<ApiError> handleExpiredRefreshToken(AuthExceptions.ExpiredRefreshTokenException ex) {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiError("refresh_token_expired", ex.getMessage(), Instant.now()));
	}

	@ExceptionHandler(AuthExceptions.InvalidUserException.class)
	public ResponseEntity<ApiError> handleInvalidUser(AuthExceptions.InvalidUserException ex) {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiError("invalid_user", ex.getMessage(), Instant.now()));
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<ApiError> handleIllegalArgument(IllegalArgumentException ex) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError("bad_request", ex.getMessage(), Instant.now()));
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ApiError> handleInvalidJson(HttpMessageNotReadableException ex) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError("invalid_json", "JSON inválido", Instant.now()));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError("validation_error", "Requisição inválida", Instant.now()));
	}

	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException ex) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError("validation_error", "Requisição inválida", Instant.now()));
	}

	public record ApiError(String code, String message, Instant timestamp) {}
}
