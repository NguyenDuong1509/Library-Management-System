package vn.lms.library.web.controller;

import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.lms.library.security.UserPrincipal;
import vn.lms.library.service.AuditLogService;
import vn.lms.library.service.LibraryConfigService;
import vn.lms.library.service.LibraryConfigSnapshot;
import vn.lms.library.web.dto.UpdateLibraryConfigRequest;

@RestController
@RequestMapping("/api/admin/config")
public class AdminConfigController {

    private final LibraryConfigService configService;
    private final AuditLogService auditLogService;

    public AdminConfigController(LibraryConfigService configService, AuditLogService auditLogService) {
        this.configService = configService;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public LibraryConfigResponse get() {
        return LibraryConfigResponse.from(configService.getSnapshot());
    }

    @PutMapping
    public LibraryConfigResponse update(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateLibraryConfigRequest request) {
        LibraryConfigSnapshot updated = configService.update(request);
        auditLogService.log(
                principal.getId(),
                "CONFIG_UPDATE",
                "CONFIG",
                "library_settings",
                "maxLoanCount=" + updated.maxLoanCount());
        return LibraryConfigResponse.from(updated);
    }

    public record LibraryConfigResponse(
            int maxLoanCount,
            int loanDaysDefault,
            int maxRenewals,
            int finePerDay,
            int reminderDaysBefore) {

        static LibraryConfigResponse from(LibraryConfigSnapshot snapshot) {
            return new LibraryConfigResponse(
                    snapshot.maxLoanCount(),
                    snapshot.loanDaysDefault(),
                    snapshot.maxRenewals(),
                    snapshot.finePerDay(),
                    snapshot.reminderDaysBefore());
        }
    }
}
