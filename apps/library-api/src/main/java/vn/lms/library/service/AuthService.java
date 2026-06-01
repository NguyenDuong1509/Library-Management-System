package vn.lms.library.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vn.lms.library.domain.entity.UserEntity;
import vn.lms.library.repository.UserRepository;
import vn.lms.library.security.JwtService;
import vn.lms.library.web.BusinessException;
import vn.lms.library.web.dto.LoginRequest;
import vn.lms.library.web.dto.LoginResponse;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
        UserEntity user = userRepository.findByEmail(request.email())
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .filter(UserEntity::isActive)
                .orElseThrow(() -> new BusinessException("Email hoặc mật khẩu không đúng."));
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());
        return new LoginResponse(token, user.getId(), user.getEmail(), user.getName(), user.getRole());
    }
}
