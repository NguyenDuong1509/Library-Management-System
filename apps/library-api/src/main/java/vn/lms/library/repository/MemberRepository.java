package vn.lms.library.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.lms.library.domain.entity.MemberEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MemberRepository extends JpaRepository<MemberEntity, UUID> {

    @Query("SELECT m FROM MemberEntity m JOIN FETCH m.user ORDER BY m.user.name ASC")
    List<MemberEntity> findAllWithUser();

    @Query("SELECT m FROM MemberEntity m JOIN FETCH m.user WHERE m.libraryCardId = :libraryCardId")
    Optional<MemberEntity> findByLibraryCardId(@Param("libraryCardId") String libraryCardId);

    @Query("SELECT m FROM MemberEntity m JOIN FETCH m.user WHERE LOWER(m.user.email) = LOWER(:email)")
    Optional<MemberEntity> findByUser_EmailIgnoreCase(@Param("email") String email);

    @Query("SELECT m FROM MemberEntity m JOIN FETCH m.user WHERE m.user.id = :userId")
    Optional<MemberEntity> findByUser_Id(@Param("userId") UUID userId);

    @Query("SELECT m FROM MemberEntity m JOIN FETCH m.user WHERE m.id = :id")
    Optional<MemberEntity> findByIdWithUser(@Param("id") UUID id);

    boolean existsByLibraryCardId(String libraryCardId);

    @Query(
            value = """
                    SELECT m FROM MemberEntity m JOIN FETCH m.user WHERE
                    :q IS NULL OR :q = '' OR
                    LOWER(m.libraryCardId) LIKE LOWER(CONCAT('%', :q, '%')) OR
                    LOWER(m.user.name) LIKE LOWER(CONCAT('%', :q, '%')) OR
                    LOWER(m.user.email) LIKE LOWER(CONCAT('%', :q, '%'))
                    ORDER BY m.user.name ASC
                    """,
            countQuery = """
                    SELECT COUNT(m) FROM MemberEntity m WHERE
                    :q IS NULL OR :q = '' OR
                    LOWER(m.libraryCardId) LIKE LOWER(CONCAT('%', :q, '%')) OR
                    LOWER(m.user.name) LIKE LOWER(CONCAT('%', :q, '%')) OR
                    LOWER(m.user.email) LIKE LOWER(CONCAT('%', :q, '%'))
                    """)
    Page<MemberEntity> searchPaged(@Param("q") String q, Pageable pageable);

    @Query("""
            SELECT m FROM MemberEntity m JOIN FETCH m.user WHERE
            :q IS NULL OR :q = '' OR
            LOWER(m.libraryCardId) LIKE LOWER(CONCAT('%', :q, '%')) OR
            LOWER(m.user.name) LIKE LOWER(CONCAT('%', :q, '%')) OR
            LOWER(m.user.email) LIKE LOWER(CONCAT('%', :q, '%'))
            ORDER BY m.user.name ASC
            """)
    List<MemberEntity> searchList(@Param("q") String q);

    @Query("""
            SELECT m FROM MemberEntity m JOIN FETCH m.user WHERE
            LOWER(m.libraryCardId) LIKE LOWER(CONCAT('%', :q, '%')) OR
            LOWER(m.user.name) LIKE LOWER(CONCAT('%', :q, '%')) OR
            LOWER(m.user.email) LIKE LOWER(CONCAT('%', :q, '%'))
            ORDER BY m.user.name ASC
            """)
    List<MemberEntity> searchGlobal(@Param("q") String q, Pageable pageable);
}
