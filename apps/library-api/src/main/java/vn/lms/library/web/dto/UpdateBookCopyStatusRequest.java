package vn.lms.library.web.dto;

import jakarta.validation.constraints.NotNull;
import vn.lms.library.domain.enums.CopyStatus;

public record UpdateBookCopyStatusRequest(@NotNull CopyStatus status) {
}
