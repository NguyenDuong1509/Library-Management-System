package vn.lms.library.web.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateUserActiveRequest(@NotNull Boolean active) {
}
