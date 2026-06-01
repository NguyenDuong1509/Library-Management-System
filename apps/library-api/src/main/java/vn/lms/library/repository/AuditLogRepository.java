package vn.lms.library.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.lms.library.domain.entity.AuditLogEntity;

import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLogEntity, UUID> {
    Page<AuditLogEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);

    boolean existsByAction(String action);

    long countByAction(String action);
}
