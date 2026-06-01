package vn.lms.library.service;

import vn.lms.library.domain.LoanPolicy;
import vn.lms.library.domain.entity.LibrarySettingsEntity;

public record LibraryConfigSnapshot(
        int maxLoanCount,
        int loanDaysDefault,
        int maxRenewals,
        int finePerDay,
        int reminderDaysBefore) {

    public LoanPolicy.Config toLoanPolicyConfig() {
        return new LoanPolicy.Config(maxLoanCount, loanDaysDefault, maxRenewals);
    }

    static LibraryConfigSnapshot fromEntity(LibrarySettingsEntity entity) {
        return new LibraryConfigSnapshot(
                entity.getMaxLoanCount(),
                entity.getLoanDaysDefault(),
                entity.getMaxRenewals(),
                entity.getFinePerDay(),
                entity.getReminderDaysBefore());
    }
}
