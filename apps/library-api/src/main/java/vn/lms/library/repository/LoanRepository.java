package vn.lms.library.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.lms.library.domain.entity.LoanEntity;
import vn.lms.library.domain.enums.LoanStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface LoanRepository extends JpaRepository<LoanEntity, UUID> {
    long countByMemberIdAndStatus(UUID memberId, LoanStatus status);

    List<LoanEntity> findByStatusAndDueAtBefore(LoanStatus status, Instant dueAt);

    List<LoanEntity> findByStatus(LoanStatus status);

    List<LoanEntity> findByMemberIdAndStatusOrderByDueAtAsc(UUID memberId, LoanStatus status);

    Page<LoanEntity> findByMemberIdAndStatusOrderByReturnedAtDesc(
            UUID memberId, LoanStatus status, Pageable pageable);

    long countByCheckoutAtGreaterThanEqual(Instant checkoutAt);
}
