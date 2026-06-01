package vn.lms.library.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.lms.library.domain.entity.BookEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookRepository extends JpaRepository<BookEntity, UUID> {
    Optional<BookEntity> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, UUID id);

    List<BookEntity> findByActiveTrue();

    @Query("""
            SELECT b FROM BookEntity b WHERE
            (:activeOnly = false OR b.active = true) AND
            (:q IS NULL OR :q = '' OR
                LOWER(b.title) LIKE LOWER(CONCAT('%', :q, '%')) OR
                LOWER(b.authors) LIKE LOWER(CONCAT('%', :q, '%')) OR
                LOWER(b.isbn) LIKE LOWER(CONCAT('%', :q, '%'))) AND
            (:category IS NULL OR :category = '' OR b.category = :category)
            ORDER BY b.title ASC
            """)
    Page<BookEntity> searchPaged(
            @Param("activeOnly") boolean activeOnly,
            @Param("q") String q,
            @Param("category") String category,
            Pageable pageable);

    @Query("""
            SELECT b FROM BookEntity b WHERE
            (:activeOnly = false OR b.active = true) AND
            (:q IS NULL OR :q = '' OR
                LOWER(b.title) LIKE LOWER(CONCAT('%', :q, '%')) OR
                LOWER(b.authors) LIKE LOWER(CONCAT('%', :q, '%')) OR
                LOWER(b.isbn) LIKE LOWER(CONCAT('%', :q, '%'))) AND
            (:category IS NULL OR :category = '' OR b.category = :category)
            ORDER BY b.title ASC
            """)
    List<BookEntity> searchList(
            @Param("activeOnly") boolean activeOnly,
            @Param("q") String q,
            @Param("category") String category);

    @Query("""
            SELECT b FROM BookEntity b WHERE
            LOWER(b.title) LIKE LOWER(CONCAT('%', :q, '%')) OR
            LOWER(b.authors) LIKE LOWER(CONCAT('%', :q, '%')) OR
            LOWER(b.isbn) LIKE LOWER(CONCAT('%', :q, '%'))
            ORDER BY b.title ASC
            """)
    List<BookEntity> searchGlobal(@Param("q") String q, Pageable pageable);
}
