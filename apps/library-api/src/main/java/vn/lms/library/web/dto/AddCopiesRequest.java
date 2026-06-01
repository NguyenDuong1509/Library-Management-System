package vn.lms.library.web.dto;

import jakarta.validation.constraints.Min;

public record AddCopiesRequest(@Min(1) int count) {
}
