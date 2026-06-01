package vn.lms.library.web.controller;

import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.lms.library.service.BookCopyService;
import vn.lms.library.web.dto.UpdateBookCopyStatusRequest;

import java.util.UUID;

@RestController
@RequestMapping("/api/book-copies")
public class BookCopyController {

    private final BookCopyService bookCopyService;

    public BookCopyController(BookCopyService bookCopyService) {
        this.bookCopyService = bookCopyService;
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public BookCopyService.CopyView updateStatus(
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateBookCopyStatusRequest request) {
        return bookCopyService.updateStatus(id, request.status());
    }
}
