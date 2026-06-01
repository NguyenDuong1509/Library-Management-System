package vn.lms.library.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import vn.lms.library.domain.enums.UserRole;

public record CreateAdminUserRequest(
        @NotBlank @Email String email,
        @NotBlank String password,
        @NotBlank String name,
        @NotNull UserRole role) {
}
