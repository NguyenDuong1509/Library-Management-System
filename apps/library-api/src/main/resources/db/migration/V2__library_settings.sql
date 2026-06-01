CREATE TABLE IF NOT EXISTS library_settings (
  id SMALLINT PRIMARY KEY CHECK (id = 1),
  max_loan_count INT NOT NULL CHECK (max_loan_count BETWEEN 1 AND 20),
  loan_days_default INT NOT NULL CHECK (loan_days_default BETWEEN 1 AND 90),
  max_renewals INT NOT NULL CHECK (max_renewals BETWEEN 0 AND 10),
  fine_per_day INT NOT NULL CHECK (fine_per_day >= 0),
  reminder_days_before INT NOT NULL CHECK (reminder_days_before BETWEEN 0 AND 30),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO library_settings (
  id, max_loan_count, loan_days_default, max_renewals, fine_per_day, reminder_days_before
) VALUES (1, 5, 14, 2, 5000, 2)
ON CONFLICT (id) DO NOTHING;
