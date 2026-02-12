DROP TABLE IF EXISTS idempotency_records;

CREATE TABLE idempotency_records (
    id VARCHAR(255) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    response_body LONGTEXT,
    response_status INT NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
