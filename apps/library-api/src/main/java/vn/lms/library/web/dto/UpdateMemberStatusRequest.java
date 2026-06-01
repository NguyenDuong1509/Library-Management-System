package vn.lms.library.web.dto;

import jakarta.validation.constraints.NotNull;
import vn.lms.library.domain.enums.MemberStatus;

public record UpdateMemberStatusRequest(@NotNull MemberStatus status) {
}
