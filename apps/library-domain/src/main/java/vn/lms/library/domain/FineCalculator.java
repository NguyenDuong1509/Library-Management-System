package vn.lms.library.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;

public final class FineCalculator {

    private FineCalculator() {
    }

    public static long daysBetweenUtc(Instant start, Instant end) {
        LocalDate startDate = start.atZone(ZoneOffset.UTC).toLocalDate();
        LocalDate endDate = end.atZone(ZoneOffset.UTC).toLocalDate();
        return Math.max(0, ChronoUnit.DAYS.between(startDate, endDate));
    }

    public static int calculateOverdueFine(Instant dueAt, Instant returnAt, int finePerDay) {
        long overdueDays = daysBetweenUtc(dueAt, returnAt);
        if (overdueDays <= 0) {
            return 0;
        }
        return Math.toIntExact(overdueDays * finePerDay);
    }
}
