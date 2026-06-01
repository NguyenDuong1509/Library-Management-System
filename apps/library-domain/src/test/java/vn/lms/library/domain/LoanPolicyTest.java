package vn.lms.library.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LoanPolicyTest {

    private static final LoanPolicy.Config CONFIG = new LoanPolicy.Config(3, 14, 2);

    @Test
    void computesDueDate() {
        Instant due = LoanPolicy.computeDueDate(Instant.parse("2026-01-01T00:00:00Z"), 14);
        assertEquals(Instant.parse("2026-01-15T00:00:00Z"), due);
    }

    @Test
    void blocksCheckoutAtMaxLoans() {
        assertFalse(LoanPolicy.canCheckout(3, CONFIG));
        assertTrue(LoanPolicy.canCheckout(2, CONFIG));
    }

    @Test
    void blocksRenewWhenReservationExists() {
        assertEquals(
                LoanPolicy.Error.RESERVATION_BLOCKS_RENEWAL,
                LoanPolicy.canRenew(0, true, CONFIG).error());
    }
}
