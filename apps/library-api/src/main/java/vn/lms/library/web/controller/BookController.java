package vn.lms.library.web.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.lms.library.domain.entity.BookEntity;
import vn.lms.library.service.BookCopyService;
import vn.lms.library.service.BookService;
import vn.lms.library.web.dto.AddCopiesRequest;
import vn.lms.library.web.dto.CreateBookRequest;
import vn.lms.library.web.dto.PageRequest;
import vn.lms.library.web.dto.PageResponse;
import vn.lms.library.web.dto.SetBookActiveRequest;
import vn.lms.library.web.dto.UpdateBookRequest;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/books")
public class BookController {

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(value = "activeOnly", required = false) Boolean activeOnly,
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size) {
        if (page != null) {
            var result = bookService.listPaged(activeOnly, q, category, PageRequest.of(page, size));
            return ResponseEntity.ok(new PageResponse<>(
                    result.content().stream().map(BookResponse::fromSummary).toList(),
                    result.totalElements(),
                    result.totalPages(),
                    result.page(),
                    result.size()));
        }
        return ResponseEntity.ok(bookService.list(activeOnly, q, category).stream()
                .map(BookResponse::fromSummary)
                .toList());
    }

    @GetMapping("/by-slug/{slug}")
    public BookResponse detailBySlug(@PathVariable("slug") String slug) {
        return BookResponse.fromDetail(bookService.getBySlug(slug));
    }

    @GetMapping("/{id}/copies")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public List<BookCopyService.CopyView> listCopies(@PathVariable("id") UUID id) {
        return bookService.listCopies(id);
    }

    @GetMapping("/{id}")
    public BookResponse detail(@PathVariable("id") UUID id) {
        return BookResponse.fromDetail(bookService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public BookResponse create(@Valid @RequestBody CreateBookRequest request) {
        BookEntity created = bookService.create(request);
        return BookResponse.fromDetail(bookService.getById(created.getId()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public BookResponse update(@PathVariable("id") UUID id, @Valid @RequestBody UpdateBookRequest request) {
        return BookResponse.fromDetail(bookService.update(id, request));
    }

    @PatchMapping("/{id}/active")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public BookResponse setActive(@PathVariable("id") UUID id, @Valid @RequestBody SetBookActiveRequest request) {
        return BookResponse.fromDetail(bookService.setActive(id, request.isActive()));
    }

    @PostMapping("/{id}/copies")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public BookResponse addCopies(@PathVariable("id") UUID id, @Valid @RequestBody AddCopiesRequest request) {
        return BookResponse.fromDetail(bookService.addCopies(id, request));
    }

    public record BookResponse(
            UUID id,
            String slug,
            String title,
            String isbn,
            String authors,
            String category,
            boolean isActive,
            int availableCount,
            int totalCopies) {
        static BookResponse fromSummary(BookService.BookSummary b) {
            return new BookResponse(
                    b.id(),
                    b.slug(),
                    b.title(),
                    b.isbn(),
                    b.authors(),
                    b.category(),
                    b.isActive(),
                    b.availableCount(),
                    b.totalCopies());
        }

        static BookResponse fromDetail(BookService.BookDetail b) {
            return new BookResponse(
                    b.id(),
                    b.slug(),
                    b.title(),
                    b.isbn(),
                    b.authors(),
                    b.category(),
                    b.isActive(),
                    b.availableCount(),
                    b.totalCopies());
        }
    }
}
