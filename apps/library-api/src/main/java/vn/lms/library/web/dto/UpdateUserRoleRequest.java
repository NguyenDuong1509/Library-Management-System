package vn.lms.library.web.dto;

import jakarta.validation.constraints.NotNull;
import vn.lms.library.domain.enums.UserRole;

public record UpdateUserRoleRequest(@NotNull UserRole role) {
}
