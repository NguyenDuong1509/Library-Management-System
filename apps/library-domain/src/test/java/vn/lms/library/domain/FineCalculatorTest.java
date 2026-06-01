package vn.lms.library.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FineCalculatorTest {

    @Test
    void zeroWhenOnTime() {
        Instant day = Instant.parse("2026-06-10T12:00:00Z");
        assertEquals(0, FineCalculator.calculateOverdueFine(day, day, 5000));
    }

    @Test
    void multipliesOverdueDays() {
        assertEquals(
                15_000,
                FineCalculator.calculateOverdueFine(
                        Instant.parse("2026-06-10T00:00:00Z"),
                        Instant.parse("2026-06-13T00:00:00Z"),
                        5000));
    }
}
