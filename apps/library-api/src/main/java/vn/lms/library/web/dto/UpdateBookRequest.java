package vn.lms.library.web.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateBookRequest(
        @NotBlank String title,
        String isbn,
        @NotBlank String authors,
        @NotBlank String category) {
}
