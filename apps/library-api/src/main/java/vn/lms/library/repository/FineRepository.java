package vn.lms.library.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.lms.library.domain.entity.FineEntity;
import vn.lms.library.domain.enums.FineStatus;

import java.util.List;
import java.util.UUID;

public interface FineRepository extends JpaRepository<FineEntity, UUID> {
    List<FineEntity> findByStatus(FineStatus status);

    List<FineEntity> findByStatusAndLoan_Member_Id(FineStatus status, UUID memberId);
}
