package vn.lms.library.web.dto;

import vn.lms.library.domain.enums.UserRole;

import java.util.UUID;

public record LoginResponse(
        String token,
        UUID userId,
        String email,
        String name,
        UserRole role) {
}
