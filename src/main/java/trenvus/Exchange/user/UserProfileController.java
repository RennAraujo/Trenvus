package trenvus.Exchange.user;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Optional;

@RestController
@RequestMapping("/me/profile")
public class UserProfileController {

    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;

    public UserProfileController(UserProfileRepository userProfileRepository, UserRepository userRepository) {
        this.userProfileRepository = userProfileRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.valueOf(jwt.getSubject());
        
        Optional<UserProfileEntity> profile = userProfileRepository.findByUserId(userId);
        
        if (profile.isPresent()) {
            UserProfileEntity p = profile.get();
            return ResponseEntity.ok(new ProfileResponse(
                p.getFullName(),
                p.getAddress(),
                p.getTermsAccepted(),
                p.getTermsAcceptedAt(),
                p.getCreatedAt()
            ));
        }
        
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<ProfileResponse> saveProfile(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ProfileRequest request) {
        
        Long userId = Long.valueOf(jwt.getSubject());
        
        // Verify user exists
        if (!userRepository.existsById(userId)) {
            return ResponseEntity.notFound().build();
        }
        
        // Find existing or create new
        UserProfileEntity profile = userProfileRepository.findByUserId(userId)
            .orElse(new UserProfileEntity());
        
        profile.setUserId(userId);
        profile.setFullName(request.fullName().trim());
        profile.setAddress(request.address().trim());
        profile.setTermsAccepted(request.termsAccepted());
        
        if (request.termsAccepted() && profile.getTermsAcceptedAt() == null) {
            profile.setTermsAcceptedAt(Instant.now());
        }
        
        UserProfileEntity saved = userProfileRepository.save(profile);
        
        return ResponseEntity.ok(new ProfileResponse(
            saved.getFullName(),
            saved.getAddress(),
            saved.getTermsAccepted(),
            saved.getTermsAcceptedAt(),
            saved.getCreatedAt()
        ));
    }

    @GetMapping("/status")
    public ResponseEntity<ProfileStatusResponse> getProfileStatus(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.valueOf(jwt.getSubject());
        
        Optional<UserProfileEntity> profile = userProfileRepository.findByUserId(userId);
        
        boolean isComplete = profile.isPresent() &&
            profile.get().getFullName() != null && !profile.get().getFullName().trim().isEmpty() &&
            profile.get().getAddress() != null && !profile.get().getAddress().trim().isEmpty() &&
            Boolean.TRUE.equals(profile.get().getTermsAccepted());
        
        return ResponseEntity.ok(new ProfileStatusResponse(isComplete));
    }

    // Records for requests and responses
    public record ProfileRequest(
        @NotBlank String fullName,
        @NotBlank String address,
        @NotNull Boolean termsAccepted
    ) {}

    public record ProfileResponse(
        String fullName,
        String address,
        Boolean termsAccepted,
        Instant termsAcceptedAt,
        Instant createdAt
    ) {}

    public record ProfileStatusResponse(Boolean isComplete) {}
}
