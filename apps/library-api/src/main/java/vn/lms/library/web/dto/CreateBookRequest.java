package vn.lms.library.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CreateBookRequest(
        @NotBlank String title,
        String isbn,
        @NotBlank String authors,
        @NotBlank String category,
        @Min(1) int copyCount) {
}
