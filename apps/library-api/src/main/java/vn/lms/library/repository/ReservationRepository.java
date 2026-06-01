package vn.lms.library.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.lms.library.domain.entity.ReservationEntity;
import vn.lms.library.domain.enums.ReservationStatus;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReservationRepository extends JpaRepository<ReservationEntity, UUID> {
    long countByBookIdAndStatus(UUID bookId, ReservationStatus status);

    long countByStatusIn(Collection<ReservationStatus> statuses);

    List<ReservationEntity> findByMemberIdOrderByCreatedAtDesc(UUID memberId);

    List<ReservationEntity> findByBookIdAndStatusOrderByQueuePositionAsc(
            UUID bookId, ReservationStatus status);

    List<ReservationEntity> findByStatusInOrderByCreatedAtDesc(Collection<ReservationStatus> statuses);

    @Query("""
            SELECT r FROM ReservationEntity r
            JOIN FETCH r.member m
            JOIN FETCH m.user
            JOIN FETCH r.book
            WHERE r.status IN :statuses
            ORDER BY r.createdAt DESC
            """)
    List<ReservationEntity> findOpenWithDetails(@Param("statuses") Collection<ReservationStatus> statuses);

    List<ReservationEntity> findByBookIdAndStatusInOrderByQueuePositionAsc(
            UUID bookId, Collection<ReservationStatus> statuses);

    Optional<ReservationEntity> findFirstByBookIdAndStatusOrderByQueuePositionAsc(
            UUID bookId, ReservationStatus status);

    boolean existsByMemberIdAndBookIdAndStatusIn(
            UUID memberId, UUID bookId, Collection<ReservationStatus> statuses);
}
