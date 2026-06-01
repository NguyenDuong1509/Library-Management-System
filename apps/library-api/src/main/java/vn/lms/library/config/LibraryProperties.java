package vn.lms.library.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "library")
public record LibraryProperties(
        int maxLoanCount,
        int loanDaysDefault,
        int maxRenewals,
        int finePerDay,
        int reminderDaysBefore,
        Jwt jwt) {

    public record Jwt(String secret, int expirationHours) {
    }

    public vn.lms.library.domain.LoanPolicy.Config toLoanPolicyConfig() {
        return new vn.lms.library.domain.LoanPolicy.Config(
                maxLoanCount, loanDaysDefault, maxRenewals);
    }
}
