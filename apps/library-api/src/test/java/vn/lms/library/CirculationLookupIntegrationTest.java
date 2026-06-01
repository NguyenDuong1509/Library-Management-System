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
import vn.lms.library.domain.entity.BookCopyEntity;
import vn.lms.library.domain.entity.BookEntity;
import vn.lms.library.domain.entity.LoanEntity;
import vn.lms.library.domain.entity.MemberEntity;
import vn.lms.library.domain.entity.UserEntity;
import vn.lms.library.domain.enums.CopyStatus;
import vn.lms.library.domain.enums.LoanStatus;
import vn.lms.library.domain.enums.MemberStatus;
import vn.lms.library.domain.enums.UserRole;
import vn.lms.library.repository.BookCopyRepository;
import vn.lms.library.repository.BookRepository;
import vn.lms.library.repository.LoanRepository;
import vn.lms.library.repository.MemberRepository;
import vn.lms.library.repository.UserRepository;
import vn.lms.library.util.BookSlugUtils;

import java.time.Instant;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CirculationLookupIntegrationTest {

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
    private LoanRepository loanRepository;

    private MemberEntity member;
    private BookCopyEntity availableCopy;
    private BookCopyEntity onLoanCopy;

    @BeforeEach
    void setUp() {
        UserEntity user = new UserEntity();
        user.setEmail("lookup@lms.vn");
        user.setPasswordHash("hash");
        user.setName("Lookup User");
        user.setRole(UserRole.MEMBER);
        user = userRepository.save(user);

        member = new MemberEntity();
        member.setUser(user);
        member.setLibraryCardId("TV-LOOKUP-001");
        member.setStatus(MemberStatus.ACTIVE);
        member = memberRepository.save(member);

        BookEntity book = new BookEntity();
        book.setTitle("Sách tra cứu");
        book.setSlug(BookSlugUtils.toSlug("Sách tra cứu"));
        book.setAuthors("Tác giả");
        book.setCategory("Khoa học");
        book = bookRepository.save(book);

        availableCopy = new BookCopyEntity();
        availableCopy.setBook(book);
        availableCopy.setCopyCode("COPY-AVAIL");
        availableCopy.setStatus(CopyStatus.AVAILABLE);
        availableCopy = copyRepository.save(availableCopy);

        onLoanCopy = new BookCopyEntity();
        onLoanCopy.setBook(book);
        onLoanCopy.setCopyCode("COPY-LOAN");
        onLoanCopy.setStatus(CopyStatus.ON_LOAN);
        onLoanCopy = copyRepository.save(onLoanCopy);
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    void memberLookup_byLibraryCardId() throws Exception {
        mockMvc.perform(get("/api/members/lookup").param("q", "TV-LOOKUP-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.libraryCardId").value("TV-LOOKUP-001"))
                .andExpect(jsonPath("$.name").value("Lookup User"))
                .andExpect(jsonPath("$.maxLoanCount").value(5));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    void memberLookup_notFound() throws Exception {
        mockMvc.perform(get("/api/members/lookup").param("q", "TV-MISSING"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Không tìm thấy độc giả."));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    void copyLookup_available() throws Exception {
        mockMvc.perform(get("/api/book-copies/lookup").param("copyCode", "COPY-AVAIL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("AVAILABLE"))
                .andExpect(jsonPath("$.bookTitle").value("Sách tra cứu"));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    void copyLookup_onLoan() throws Exception {
        mockMvc.perform(get("/api/book-copies/lookup").param("copyCode", "COPY-LOAN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ON_LOAN"));
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    void activeLoans_empty() throws Exception {
        mockMvc.perform(get("/api/loans/active").param("memberId", member.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    void activeLoans_twoLoans() throws Exception {
        saveActiveLoan(availableCopy);
        saveActiveLoan(onLoanCopy);

        mockMvc.perform(get("/api/loans/active").param("memberId", member.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].copyCode").exists())
                .andExpect(jsonPath("$[1].copyCode").exists());
    }

    private void saveActiveLoan(BookCopyEntity copy) {
        LoanEntity loan = new LoanEntity();
        loan.setMember(member);
        loan.setBookCopy(copy);
        loan.setStatus(LoanStatus.ACTIVE);
        loan.setCheckoutAt(Instant.now());
        loan.setDueAt(Instant.now().plusSeconds(86400 * 14));
        loan.setRenewalCount(0);
        loanRepository.save(loan);
    }
}
