package vn.lms.library.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.lms.library.domain.entity.BookCopyEntity;
import vn.lms.library.domain.enums.CopyStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookCopyRepository extends JpaRepository<BookCopyEntity, UUID> {
    List<BookCopyEntity> findByBookId(UUID bookId);

    long countByBookIdAndStatus(UUID bookId, CopyStatus status);

    Optional<BookCopyEntity> findByCopyCode(String copyCode);

    @Query("""
            SELECT c FROM BookCopyEntity c WHERE
            LOWER(c.copyCode) LIKE LOWER(CONCAT('%', :q, '%'))
            ORDER BY c.copyCode ASC
            """)
    List<BookCopyEntity> searchGlobal(@Param("q") String q, Pageable pageable);
}
