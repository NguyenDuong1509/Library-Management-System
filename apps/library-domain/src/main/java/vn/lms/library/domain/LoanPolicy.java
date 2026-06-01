package vn.lms.library.domain;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

public final class LoanPolicy {

    private LoanPolicy() {
    }

    public record Config(int maxLoanCount, int loanDaysDefault, int maxRenewals) {
    }

    public enum Error {
        MAX_LOANS_REACHED,
        RENEWAL_LIMIT_REACHED,
        RESERVATION_BLOCKS_RENEWAL
    }

    public static Instant computeDueDate(Instant checkoutAt, int loanDaysDefault) {
        return checkoutAt.plus(loanDaysDefault, ChronoUnit.DAYS);
    }

    public static boolean canCheckout(int activeLoanCount, Config config) {
        return activeLoanCount < config.maxLoanCount();
    }

    public static Result canRenew(int renewalCount, boolean hasBlockingReservation, Config config) {
        if (hasBlockingReservation) {
            return Result.fail(Error.RESERVATION_BLOCKS_RENEWAL);
        }
        if (renewalCount >= config.maxRenewals()) {
            return Result.fail(Error.RENEWAL_LIMIT_REACHED);
        }
        return Result.success();
    }

    public static Instant extendDueDate(Instant currentDue, int loanDaysDefault) {
        return currentDue.plus(loanDaysDefault, ChronoUnit.DAYS);
    }

    public record Result(boolean allowed, Error error) {
        public static Result success() {
            return new Result(true, null);
        }

        public static Result fail(Error error) {
            return new Result(false, error);
        }
    }
}
