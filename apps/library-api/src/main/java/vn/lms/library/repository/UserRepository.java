package vn.lms.library.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.lms.library.domain.entity.UserEntity;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {
    Optional<UserEntity> findByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);
}
