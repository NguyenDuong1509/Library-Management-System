package vn.lms.library.service;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.lms.library.config.LibraryProperties;
import vn.lms.library.domain.entity.LibrarySettingsEntity;
import vn.lms.library.repository.LibrarySettingsRepository;
import vn.lms.library.web.dto.UpdateLibraryConfigRequest;

import java.time.Instant;

@Service
public class LibraryConfigService {

    private final LibrarySettingsRepository settingsRepository;
    private final LibraryProperties properties;

    public LibraryConfigService(
            LibrarySettingsRepository settingsRepository,
            LibraryProperties properties) {
        this.settingsRepository = settingsRepository;
        this.properties = properties;
    }

    @Cacheable("libraryConfig")
    public LibraryConfigSnapshot getSnapshot() {
        return settingsRepository.findById(LibrarySettingsEntity.SINGLETON_ID)
                .map(LibraryConfigSnapshot::fromEntity)
                .orElseGet(this::fallbackFromProperties);
    }

    @CacheEvict(value = "libraryConfig", allEntries = true)
    @Transactional
    public LibraryConfigSnapshot update(UpdateLibraryConfigRequest request) {
        LibrarySettingsEntity settings = settingsRepository
                .findById(LibrarySettingsEntity.SINGLETON_ID)
                .orElseGet(this::newSettingsFromProperties);

        settings.setMaxLoanCount(request.maxLoanCount());
        settings.setLoanDaysDefault(request.loanDaysDefault());
        settings.setMaxRenewals(request.maxRenewals());
        settings.setFinePerDay(request.finePerDay());
        settings.setReminderDaysBefore(request.reminderDaysBefore());
        settings.setUpdatedAt(Instant.now());

        return LibraryConfigSnapshot.fromEntity(settingsRepository.save(settings));
    }

    private LibrarySettingsEntity newSettingsFromProperties() {
        LibrarySettingsEntity entity = new LibrarySettingsEntity();
        entity.setMaxLoanCount(properties.maxLoanCount());
        entity.setLoanDaysDefault(properties.loanDaysDefault());
        entity.setMaxRenewals(properties.maxRenewals());
        entity.setFinePerDay(properties.finePerDay());
        entity.setReminderDaysBefore(properties.reminderDaysBefore());
        return entity;
    }

    private LibraryConfigSnapshot fallbackFromProperties() {
        return new LibraryConfigSnapshot(
                properties.maxLoanCount(),
                properties.loanDaysDefault(),
                properties.maxRenewals(),
                properties.finePerDay(),
                properties.reminderDaysBefore());
    }
}
