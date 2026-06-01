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
import vn.lms.library.service.ReservationService;
import vn.lms.library.web.BusinessException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CirculationRenewIntegrationTest {

    @Autowired
    private CirculationService circulationService;

    @Autowired
    private ReservationService reservationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private BookCopyRepository copyRepository;

    private MemberEntity borrower;
    private MemberEntity reserver;
    private BookCopyEntity copy;

    @BeforeEach
    void setUp() {
        borrower = saveMember("borrow@lms.vn", "BR-001");
        reserver = saveMember("reserve@lms.vn", "RS-001");

        BookEntity book = new BookEntity();
        book.setTitle("Sách gia hạn");
        book.setSlug(BookSlugUtils.toSlug("Sách gia hạn"));
        book.setAuthors("TG");
        book.setCategory("Khoa học");
        book = bookRepository.save(book);

        copy = new BookCopyEntity();
        copy.setBook(book);
        copy.setCopyCode("RN-001");
        copy.setStatus(CopyStatus.AVAILABLE);
        copy = copyRepository.save(copy);
    }

    @Test
    void renew_extendsDueDateAndIncrementsCount() {
        LoanEntity loan = circulationService.checkout(borrower.getId(), copy.getId());
        var beforeDue = loan.getDueAt();

        LoanEntity renewed = circulationService.renew(loan.getId());

        assertThat(renewed.getRenewalCount()).isEqualTo(1);
        assertThat(renewed.getDueAt()).isAfter(beforeDue);
        assertThat(renewed.getStatus()).isEqualTo(LoanStatus.ACTIVE);
    }

    @Test
    void renew_blockedWhenPendingReservationExists() {
        LoanEntity loan = circulationService.checkout(borrower.getId(), copy.getId());
        reservationService.create(reserver.getId(), copy.getBook().getId());

        assertThatThrownBy(() -> circulationService.renew(loan.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("đặt trước");
    }

    private MemberEntity saveMember(String email, String cardId) {
        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setPasswordHash("hash");
        user.setName("Member");
        user.setRole(UserRole.MEMBER);
        user = userRepository.save(user);

        MemberEntity member = new MemberEntity();
        member.setUser(user);
        member.setLibraryCardId(cardId);
        member.setStatus(MemberStatus.ACTIVE);
        return memberRepository.save(member);
    }
}
