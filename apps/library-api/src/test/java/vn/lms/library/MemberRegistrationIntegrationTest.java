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
import vn.lms.library.domain.entity.BookCopyEntity;
import vn.lms.library.domain.entity.BookEntity;
import vn.lms.library.domain.entity.MemberEntity;
import vn.lms.library.domain.entity.UserEntity;
import vn.lms.library.domain.enums.CopyStatus;
import vn.lms.library.domain.enums.MemberStatus;
import vn.lms.library.domain.enums.UserRole;
import vn.lms.library.repository.BookCopyRepository;
import vn.lms.library.repository.BookRepository;
import vn.lms.library.repository.MemberRepository;
import vn.lms.library.repository.UserRepository;
import vn.lms.library.service.CirculationService;
import vn.lms.library.util.BookSlugUtils;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class MemberRegistrationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private BookCopyRepository copyRepository;

    @Autowired
    private CirculationService circulationService;

    private BookCopyEntity copy;

    @BeforeEach
    void setUp() {
        BookEntity book = new BookEntity();
        book.setTitle("Sách đăng ký");
        book.setSlug(BookSlugUtils.toSlug("Sách đăng ký"));
        book.setAuthors("Tác giả");
        book.setCategory("Khoa học");
        book = bookRepository.save(book);

        copy = new BookCopyEntity();
        copy.setBook(book);
        copy.setCopyCode("COPY-REG");
        copy.setStatus(CopyStatus.AVAILABLE);
        copy = copyRepository.save(copy);
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    void registerMember_success() throws Exception {
        mockMvc.perform(post("/api/members/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "newmember@lms.vn",
                                  "password": "password123",
                                  "name": "Thành viên mới"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("newmember@lms.vn"))
                .andExpect(jsonPath("$.libraryCardId").exists())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    void registerMember_duplicateEmail() throws Exception {
        UserEntity existing = new UserEntity();
        existing.setEmail("dup@lms.vn");
        existing.setPasswordHash("hash");
        existing.setName("Existing");
        existing.setRole(UserRole.MEMBER);
        userRepository.save(existing);

        mockMvc.perform(post("/api/members/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "dup@lms.vn",
                                  "password": "password123",
                                  "name": "Duplicate"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email đã tồn tại."));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    void suspendedMember_cannotCheckout() throws Exception {
        UserEntity user = new UserEntity();
        user.setEmail("suspend@lms.vn");
        user.setPasswordHash("hash");
        user.setName("Suspended User");
        user.setRole(UserRole.MEMBER);
        user = userRepository.save(user);

        MemberEntity member = new MemberEntity();
        member.setUser(user);
        member.setLibraryCardId("TV-SUSP-001");
        member.setStatus(MemberStatus.ACTIVE);
        member = memberRepository.save(member);

        mockMvc.perform(patch("/api/members/{id}/status", member.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "status": "SUSPENDED" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"));

        UUID memberId = member.getId();
        UUID copyId = copy.getId();
        assertThatThrownBy(() -> circulationService.checkout(memberId, copyId))
                .hasMessageContaining("tạm khóa");
    }
}
