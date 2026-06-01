package vn.lms.library;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
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
import vn.lms.library.repository.MemberRepository;
import vn.lms.library.repository.UserRepository;
import vn.lms.library.service.CirculationService;
import vn.lms.library.util.BookSlugUtils;
import vn.lms.library.web.BusinessException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CirculationIntegrationTest {

    @Autowired
    private CirculationService circulationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private BookCopyRepository copyRepository;

    private MemberEntity member;
    private BookCopyEntity copy;

    @BeforeEach
    void setUp() {
        UserEntity user = new UserEntity();
        user.setEmail("test@lms.vn");
        user.setPasswordHash("hash");
        user.setName("Test User");
        user.setRole(UserRole.MEMBER);
        user = userRepository.save(user);

        member = new MemberEntity();
        member.setUser(user);
        member.setLibraryCardId("TV-TEST-001");
        member.setStatus(MemberStatus.ACTIVE);
        member = memberRepository.save(member);

        BookEntity book = new BookEntity();
        book.setTitle("Sách test");
        book.setSlug(BookSlugUtils.toSlug("Sách test"));
        book.setAuthors("Tác giả");
        book.setCategory("Khoa học");
        book = bookRepository.save(book);

        copy = new BookCopyEntity();
        copy.setBook(book);
        copy.setCopyCode("COPY-001");
        copy.setStatus(CopyStatus.AVAILABLE);
        copy = copyRepository.save(copy);
    }

    @Test
    void checkoutAndReturn_makesCopyAvailableAgain() {
        LoanEntity loan = circulationService.checkout(member.getId(), copy.getId());
        assertThat(loan.getStatus()).isEqualTo(LoanStatus.ACTIVE);
        assertThat(copyRepository.findById(copy.getId()).orElseThrow().getStatus())
                .isEqualTo(CopyStatus.ON_LOAN);

        circulationService.returnLoan(loan.getId());
        assertThat(copyRepository.findById(copy.getId()).orElseThrow().getStatus())
                .isEqualTo(CopyStatus.AVAILABLE);
    }

    @Test
    void checkout_rejectsCopyNotAvailable() {
        copy.setStatus(CopyStatus.ON_LOAN);
        copyRepository.save(copy);

        assertThatThrownBy(() -> circulationService.checkout(member.getId(), copy.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("không khả dụng");
    }

    @Test
    void checkout_rejectsSuspendedMember() {
        member.setStatus(MemberStatus.SUSPENDED);
        memberRepository.save(member);

        assertThatThrownBy(() -> circulationService.checkout(member.getId(), copy.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("tạm khóa");
    }
}
