package vn.lms.library;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import vn.lms.library.domain.entity.BookEntity;
import vn.lms.library.repository.BookRepository;
import vn.lms.library.util.BookSlugUtils;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BookUpdateIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private BookRepository bookRepository;

    private BookEntity book;

    @BeforeEach
    @Transactional
    void setUp() {
        book = new BookEntity();
        book.setTitle("Sách PUT test");
        book.setSlug(BookSlugUtils.toSlug("Sách PUT test"));
        book.setAuthors("Tác giả");
        book.setCategory("Khoa học");
        book = bookRepository.save(book);
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    void updateBook_byPathVariableId_returns200() throws Exception {
        mockMvc.perform(put("/api/books/{id}", book.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Tiêu đề cập nhật",
                                  "isbn": "978-0",
                                  "authors": "TG mới",
                                  "category": "Văn học"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Tiêu đề cập nhật"));
    }
}
