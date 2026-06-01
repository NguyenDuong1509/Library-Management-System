package vn.lms.library;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import vn.lms.library.domain.entity.BookEntity;
import vn.lms.library.domain.entity.MemberEntity;
import vn.lms.library.domain.entity.ReservationEntity;
import vn.lms.library.domain.entity.UserEntity;
import vn.lms.library.domain.enums.MemberStatus;
import vn.lms.library.domain.enums.ReservationStatus;
import vn.lms.library.domain.enums.UserRole;
import vn.lms.library.repository.BookRepository;
import vn.lms.library.repository.MemberRepository;
import vn.lms.library.repository.UserRepository;
import vn.lms.library.service.ReservationService;
import vn.lms.library.util.BookSlugUtils;

import vn.lms.library.web.BusinessException;
import vn.lms.library.web.ConflictException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ReservationIntegrationTest {

    @Autowired
    private ReservationService reservationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private BookRepository bookRepository;

    private MemberEntity member1;
    private MemberEntity member2;
    private BookEntity book;

    @BeforeEach
    void setUp() {
        member1 = saveMember("a@lms.vn", "TV-A");
        member2 = saveMember("b@lms.vn", "TV-B");
        book = new BookEntity();
        book.setTitle("Đặt trước test");
        book.setSlug(BookSlugUtils.toSlug("Đặt trước test"));
        book.setAuthors("TG");
        book.setCategory("Văn học");
        book = bookRepository.save(book);
    }

    @Test
    void secondReservation_hasQueuePositionTwo() {
        ReservationEntity first = reservationService.create(member1.getId(), book.getId());
        ReservationEntity second = reservationService.create(member2.getId(), book.getId());

        assertThat(first.getQueuePosition()).isEqualTo(1);
        assertThat(second.getQueuePosition()).isEqualTo(2);
        assertThat(second.getStatus()).isEqualTo(ReservationStatus.PENDING);
    }

    @Test
    void cancel_pendingReservation_setsCancelled() {
        ReservationEntity created = reservationService.create(member1.getId(), book.getId());

        ReservationEntity cancelled = reservationService.cancel(created.getId(), member1.getId(), false);

        assertThat(cancelled.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
    }

    @Test
    void cancel_alreadyCancelled_throwsConflict() {
        ReservationEntity created = reservationService.create(member1.getId(), book.getId());
        reservationService.cancel(created.getId(), member1.getId(), false);

        assertThatThrownBy(() -> reservationService.cancel(created.getId(), member1.getId(), false))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void duplicateReservation_throwsConflict() {
        reservationService.create(member1.getId(), book.getId());

        assertThatThrownBy(() -> reservationService.create(member1.getId(), book.getId()))
                .isInstanceOf(ConflictException.class)
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
