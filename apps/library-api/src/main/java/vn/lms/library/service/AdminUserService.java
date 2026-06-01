package vn.lms.library.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.lms.library.domain.entity.UserEntity;
import vn.lms.library.domain.enums.UserRole;
import vn.lms.library.repository.UserRepository;
import vn.lms.library.web.BusinessException;
import vn.lms.library.web.ConflictException;
import vn.lms.library.web.dto.CreateAdminUserRequest;
import vn.lms.library.web.dto.UpdateUserRoleRequest;

import java.util.List;
import java.util.UUID;

@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public AdminUserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<UserView> list() {
        return userRepository.findAll().stream().map(UserView::from).toList();
    }

    @Transactional
    public UserView create(UUID actorId, CreateAdminUserRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Email đã tồn tại.");
        }
        if (request.role() == UserRole.MEMBER) {
            throw new BusinessException("Admin chỉ tạo tài khoản LIBRARIAN hoặc ADMIN.");
        }

        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setName(request.name().trim());
        user.setRole(request.role());
        user.setActive(true);
        UserEntity saved = userRepository.save(user);

        auditLogService.log(actorId, "USER_CREATE", "USER", saved.getId().toString(), email);
        return UserView.from(saved);
    }

    @Transactional
    public UserView setActive(UUID actorId, UUID userId, boolean active) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy user."));
        user.setActive(active);
        UserEntity saved = userRepository.save(user);
        String action = active ? "USER_ACTIVATE" : "USER_DEACTIVATE";
        auditLogService.log(actorId, action, "USER", userId.toString(), user.getEmail());
        return UserView.from(saved);
    }

    @Transactional
    public UserView deactivate(UUID actorId, UUID userId) {
        return setActive(actorId, userId, false);
    }

    @Transactional
    public UserView updateRole(UUID actorId, UUID userId, UpdateUserRoleRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy user."));
        if (request.role() == UserRole.MEMBER) {
            throw new BusinessException("Không thể gán role MEMBER qua admin UI.");
        }
        user.setRole(request.role());
        UserEntity saved = userRepository.save(user);
        auditLogService.log(
                actorId,
                "USER_ROLE_UPDATE",
                "USER",
                userId.toString(),
                request.role().name());
        return UserView.from(saved);
    }

    public record UserView(UUID id, String email, String name, String role, boolean active) {
        static UserView from(UserEntity u) {
            return new UserView(u.getId(), u.getEmail(), u.getName(), u.getRole().name(), u.isActive());
        }
    }
}
