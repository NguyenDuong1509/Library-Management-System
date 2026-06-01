package vn.lms.library.domain;

public final class ReservationQueue {

    private ReservationQueue() {
    }

    public static int nextQueuePosition(int existingCount) {
        return existingCount + 1;
    }
}
