package vn.lms.library.service;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import vn.lms.library.domain.entity.BookCopyEntity;
import vn.lms.library.domain.entity.BookEntity;
import vn.lms.library.domain.enums.CopyStatus;
import vn.lms.library.repository.BookCopyRepository;
import vn.lms.library.repository.BookRepository;
import vn.lms.library.service.BookCopyService;
import vn.lms.library.web.BusinessException;
import vn.lms.library.web.dto.AddCopiesRequest;
import vn.lms.library.web.dto.CreateBookRequest;
import vn.lms.library.web.dto.PageRequest;
import vn.lms.library.web.dto.PageResponse;
import vn.lms.library.util.BookSlugUtils;
import vn.lms.library.web.dto.UpdateBookRequest;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class BookService {

    private final BookRepository bookRepository;
    private final BookCopyRepository copyRepository;

    public BookService(BookRepository bookRepository, BookCopyRepository copyRepository) {
        this.bookRepository = bookRepository;
        this.copyRepository = copyRepository;
    }

    public List<BookSummary> list(Boolean activeOnly, String q, String category) {
        boolean active = Boolean.TRUE.equals(activeOnly);
        return bookRepository.searchList(active, normalize(q), normalize(category)).stream()
                .map(this::toSummary)
                .toList();
    }

    public PageResponse<BookSummary> listPaged(Boolean activeOnly, String q, String category, PageRequest page) {
        boolean active = Boolean.TRUE.equals(activeOnly);
        Page<BookEntity> result = bookRepository.searchPaged(
                active,
                normalize(q),
                normalize(category),
                org.springframework.data.domain.PageRequest.of(page.page(), page.size()));
        return PageResponse.from(result, this::toSummary);
    }

    public List<BookCopyService.CopyView> listCopies(UUID bookId) {
        bookRepository.findById(bookId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy sách."));
        return copyRepository.findByBookId(bookId).stream()
                .map(c -> new BookCopyService.CopyView(
                        c.getId(),
                        c.getCopyCode(),
                        c.getStatus().name(),
                        c.getBook().getId(),
                        c.getBook().getTitle()))
                .toList();
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public List<BookSummary> list(Boolean activeOnly) {
        return list(activeOnly, null, null);
    }

    public BookDetail getById(UUID id) {
        BookEntity book = bookRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy sách."));
        return toDetail(book);
    }

    public BookDetail getBySlug(String slug) {
        BookEntity book = bookRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sách."));
        return toDetail(book);
    }

    @Transactional
    public BookEntity create(CreateBookRequest request) {
        BookEntity book = new BookEntity();
        book.setTitle(request.title());
        book.setSlug(allocateSlug(request.title(), null));
        book.setIsbn(request.isbn());
        book.setAuthors(request.authors());
        book.setCategory(request.category());
        BookEntity saved = bookRepository.save(book);

        List<BookCopyEntity> copies = new ArrayList<>();
        for (int i = 1; i <= request.copyCount(); i++) {
            BookCopyEntity copy = new BookCopyEntity();
            copy.setBook(saved);
            copy.setCopyCode(generateCopyCode(saved.getId(), i));
            copy.setStatus(CopyStatus.AVAILABLE);
            copies.add(copyRepository.save(copy));
        }
        return saved;
    }

    @Transactional
    public BookDetail update(UUID id, UpdateBookRequest request) {
        BookEntity book = bookRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy sách."));
        boolean titleChanged = !book.getTitle().equals(request.title());
        book.setTitle(request.title());
        if (titleChanged) {
            book.setSlug(allocateSlug(request.title(), id));
        }
        book.setIsbn(request.isbn());
        book.setAuthors(request.authors());
        book.setCategory(request.category());
        return toDetail(bookRepository.save(book));
    }

    @Transactional
    public BookDetail setActive(UUID id, boolean isActive) {
        BookEntity book = bookRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy sách."));
        book.setActive(isActive);
        return toDetail(bookRepository.save(book));
    }

    @Transactional
    public BookDetail addCopies(UUID id, AddCopiesRequest request) {
        BookEntity book = bookRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy sách."));
        List<BookCopyEntity> existing = copyRepository.findByBookId(id);
        int startIndex = existing.size() + 1;
        for (int i = 0; i < request.count(); i++) {
            BookCopyEntity copy = new BookCopyEntity();
            copy.setBook(book);
            copy.setCopyCode(generateCopyCode(book.getId(), startIndex + i));
            copy.setStatus(CopyStatus.AVAILABLE);
            copyRepository.save(copy);
        }
        return toDetail(book);
    }

    private String allocateSlug(String title, UUID excludeId) {
        String base = BookSlugUtils.toSlug(title);
        String candidate = base;
        int suffix = 2;
        while (excludeId == null
                ? bookRepository.existsBySlug(candidate)
                : bookRepository.existsBySlugAndIdNot(candidate, excludeId)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    private BookSummary toSummary(BookEntity book) {
        long available = copyRepository.countByBookIdAndStatus(book.getId(), CopyStatus.AVAILABLE);
        long total = copyRepository.findByBookId(book.getId()).size();
        return new BookSummary(
                book.getId(),
                book.getSlug(),
                book.getTitle(),
                book.getIsbn(),
                book.getAuthors(),
                book.getCategory(),
                book.isActive(),
                (int) available,
                (int) total);
    }

    private BookDetail toDetail(BookEntity book) {
        long available = copyRepository.countByBookIdAndStatus(book.getId(), CopyStatus.AVAILABLE);
        long total = copyRepository.findByBookId(book.getId()).size();
        return new BookDetail(
                book.getId(),
                book.getSlug(),
                book.getTitle(),
                book.getIsbn(),
                book.getAuthors(),
                book.getCategory(),
                book.isActive(),
                (int) available,
                (int) total);
    }

    private String generateCopyCode(UUID bookId, int index) {
        return "BK-" + bookId.toString().substring(0, 8).toUpperCase() + "-" + index;
    }

    public record BookSummary(
            UUID id,
            String slug,
            String title,
            String isbn,
            String authors,
            String category,
            boolean isActive,
            int availableCount,
            int totalCopies) {
    }

    public record BookDetail(
            UUID id,
            String slug,
            String title,
            String isbn,
            String authors,
            String category,
            boolean isActive,
            int availableCount,
            int totalCopies) {
    }
}
