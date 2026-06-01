package vn.lms.library;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import vn.lms.library.domain.entity.BookCopyEntity;
import vn.lms.library.domain.entity.BookEntity;
import vn.lms.library.repository.BookCopyRepository;
import vn.lms.library.repository.BookRepository;
import vn.lms.library.service.BookService;
import vn.lms.library.util.BookSlugUtils;
import vn.lms.library.web.dto.UpdateBookRequest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BookCatalogIntegrationTest {

    @Autowired
    private BookService bookService;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private BookCopyRepository copyRepository;

    private BookEntity book;

    @BeforeEach
    void setUp() {
        book = new BookEntity();
        book.setTitle("Sách catalog test");
        book.setSlug(BookSlugUtils.toSlug("Sách catalog test"));
        book.setAuthors("Tác giả");
        book.setCategory("Khoa học");
        book = bookRepository.save(book);

        BookCopyEntity copy = new BookCopyEntity();
        copy.setBook(book);
        copy.setCopyCode("CAT-001");
        copy.setStatus(vn.lms.library.domain.enums.CopyStatus.AVAILABLE);
        copyRepository.save(copy);
    }

    @Test
    void getById_returnsAvailableCount() {
        BookService.BookDetail detail = bookService.getById(book.getId());

        assertThat(detail.title()).isEqualTo("Sách catalog test");
        assertThat(detail.availableCount()).isEqualTo(1);
        assertThat(detail.totalCopies()).isEqualTo(1);
    }

    @Test
    void getBySlug_resolvesBook() {
        BookService.BookDetail detail = bookService.getBySlug("sach-catalog-test");

        assertThat(detail.id()).isEqualTo(book.getId());
        assertThat(detail.slug()).isEqualTo("sach-catalog-test");
    }

    @Test
    void update_changesMetadata() {
        BookService.BookDetail updated = bookService.update(
                book.getId(),
                new UpdateBookRequest("Tiêu đề mới", "978-0", "TG mới", "Văn học"));

        assertThat(updated.title()).isEqualTo("Tiêu đề mới");
        assertThat(updated.isbn()).isEqualTo("978-0");
        assertThat(updated.authors()).isEqualTo("TG mới");
        assertThat(updated.category()).isEqualTo("Văn học");
    }
}
