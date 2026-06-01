package vn.lms.library;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import vn.lms.library.domain.entity.BookEntity;
import vn.lms.library.repository.BookRepository;
import vn.lms.library.util.BookSlugUtils;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BookBySlugIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private BookRepository bookRepository;

    private String bookSlug;

    @BeforeEach
    @Transactional
    void setUp() {
        bookSlug = "slug-test-" + System.nanoTime();
        BookEntity book = new BookEntity();
        book.setTitle("Nhà Giả Kim");
        book.setSlug(bookSlug);
        book.setAuthors("Paulo Coelho");
        book.setCategory("Văn học");
        bookRepository.save(book);
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    void getBySlug_returnsBook() throws Exception {
        mockMvc.perform(get("/api/books/by-slug/{slug}", bookSlug))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug").value(bookSlug))
                .andExpect(jsonPath("$.title").value("Nhà Giả Kim"));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    void getBySlug_unknown_returns404() throws Exception {
        mockMvc.perform(get("/api/books/by-slug/khong-ton-tai-xyz"))
                .andExpect(status().isNotFound());
    }
}
