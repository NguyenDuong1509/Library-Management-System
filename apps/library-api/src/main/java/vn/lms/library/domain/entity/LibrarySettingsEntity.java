package vn.lms.library.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "library_settings")
public class LibrarySettingsEntity {

    public static final short SINGLETON_ID = 1;

    @Id
    private Short id = SINGLETON_ID;

    @Column(name = "max_loan_count", nullable = false)
    private int maxLoanCount;

    @Column(name = "loan_days_default", nullable = false)
    private int loanDaysDefault;

    @Column(name = "max_renewals", nullable = false)
    private int maxRenewals;

    @Column(name = "fine_per_day", nullable = false)
    private int finePerDay;

    @Column(name = "reminder_days_before", nullable = false)
    private int reminderDaysBefore;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Short getId() {
        return id;
    }

    public int getMaxLoanCount() {
        return maxLoanCount;
    }

    public void setMaxLoanCount(int maxLoanCount) {
        this.maxLoanCount = maxLoanCount;
    }

    public int getLoanDaysDefault() {
        return loanDaysDefault;
    }

    public void setLoanDaysDefault(int loanDaysDefault) {
        this.loanDaysDefault = loanDaysDefault;
    }

    public int getMaxRenewals() {
        return maxRenewals;
    }

    public void setMaxRenewals(int maxRenewals) {
        this.maxRenewals = maxRenewals;
    }

    public int getFinePerDay() {
        return finePerDay;
    }

    public void setFinePerDay(int finePerDay) {
        this.finePerDay = finePerDay;
    }

    public int getReminderDaysBefore() {
        return reminderDaysBefore;
    }

    public void setReminderDaysBefore(int reminderDaysBefore) {
        this.reminderDaysBefore = reminderDaysBefore;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
