package vn.lms.library.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record UpdateLibraryConfigRequest(
        @Min(1) @Max(20) int maxLoanCount,
        @Min(1) @Max(90) int loanDaysDefault,
        @Min(0) @Max(10) int maxRenewals,
        @Min(0) int finePerDay,
        @Min(0) @Max(30) int reminderDaysBefore) {
}
