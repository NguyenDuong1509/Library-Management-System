package vn.lms.library.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.lms.library.config.LibraryProperties;
import vn.lms.library.domain.entity.LibrarySettingsEntity;
import vn.lms.library.repository.LibrarySettingsRepository;
import vn.lms.library.web.dto.UpdateLibraryConfigRequest;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LibraryConfigServiceTest {

    private static final LibraryProperties PROPERTIES = new LibraryProperties(
            5, 14, 2, 5000, 2, new LibraryProperties.Jwt("test-secret-key-at-least-32-chars", 8));

    @Mock
    private LibrarySettingsRepository settingsRepository;

    private LibraryConfigService configService;

    @BeforeEach
    void setUp() {
        configService = new LibraryConfigService(settingsRepository, PROPERTIES);
    }

    @Test
    void getSnapshot_fallsBackToPropertiesWhenNoRow() {
        when(settingsRepository.findById(LibrarySettingsEntity.SINGLETON_ID))
                .thenReturn(Optional.empty());

        LibraryConfigSnapshot snapshot = configService.getSnapshot();

        assertThat(snapshot.maxLoanCount()).isEqualTo(5);
        assertThat(snapshot.loanDaysDefault()).isEqualTo(14);
        assertThat(snapshot.finePerDay()).isEqualTo(5000);
    }

    @Test
    void update_persistsAndReturnsSnapshot() {
        LibrarySettingsEntity entity = new LibrarySettingsEntity();
        entity.setMaxLoanCount(5);
        entity.setLoanDaysDefault(14);
        entity.setMaxRenewals(2);
        entity.setFinePerDay(5000);
        entity.setReminderDaysBefore(2);

        when(settingsRepository.findById(LibrarySettingsEntity.SINGLETON_ID))
                .thenReturn(Optional.of(entity));
        when(settingsRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        LibraryConfigSnapshot updated = configService.update(
                new UpdateLibraryConfigRequest(6, 21, 3, 6000, 3));

        assertThat(updated.maxLoanCount()).isEqualTo(6);
        assertThat(updated.loanDaysDefault()).isEqualTo(21);
        assertThat(updated.finePerDay()).isEqualTo(6000);
    }
}
