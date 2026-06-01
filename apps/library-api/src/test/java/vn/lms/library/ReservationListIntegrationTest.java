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
import vn.lms.library.domain.entity.MemberEntity;
import vn.lms.library.domain.entity.ReservationEntity;
import vn.lms.library.domain.entity.UserEntity;
import vn.lms.library.domain.enums.MemberStatus;
import vn.lms.library.domain.enums.ReservationStatus;
import vn.lms.library.domain.enums.UserRole;
import vn.lms.library.repository.BookRepository;
import vn.lms.library.repository.MemberRepository;
import vn.lms.library.repository.ReservationRepository;
import vn.lms.library.repository.UserRepository;
import vn.lms.library.util.BookSlugUtils;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReservationListIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @BeforeEach
    @Transactional
    void seedReservation() {
        UserEntity user = new UserEntity();
        user.setEmail("res-list-" + System.nanoTime() + "@lms.vn");
        user.setPasswordHash("x");
        user.setName("Nguyễn Test");
        user.setRole(UserRole.MEMBER);
        user = userRepository.save(user);

        MemberEntity member = new MemberEntity();
        member.setUser(user);
        member.setLibraryCardId("TV-RL-" + System.nanoTime());
        member.setStatus(MemberStatus.ACTIVE);
        member = memberRepository.save(member);

        BookEntity book = new BookEntity();
        book.setTitle("Sách đặt trước");
        book.setSlug(BookSlugUtils.toSlug("Sách đặt trước"));
        book.setAuthors("TG");
        book.setCategory("Khoa học");
        book = bookRepository.save(book);

        ReservationEntity reservation = new ReservationEntity();
        reservation.setMember(member);
        reservation.setBook(book);
        reservation.setStatus(ReservationStatus.READY);
        reservation.setQueuePosition(1);
        reservationRepository.save(reservation);
    }

    @Test
    @WithMockUser(roles = "LIBRARIAN")
    void listOpen_returnsMemberNameAndBookTitle() throws Exception {
        mockMvc.perform(get("/api/reservations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].memberName").value("Nguyễn Test"))
                .andExpect(jsonPath("$[0].bookTitle").value("Sách đặt trước"));
    }
}
