package vn.lms.library.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.lms.library.domain.entity.LibrarySettingsEntity;

public interface LibrarySettingsRepository extends JpaRepository<LibrarySettingsEntity, Short> {
}
