CREATE TABLE tenants (
    id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    name VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(255),
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE users (
    id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    tenant_id BIGINT NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255),
    password_hash VARCHAR(255),
    role ENUM('ADMIN', 'AGENT') NOT NULL,
    app_token_hash VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires_at DATETIME(6),
    reset_password_token_created_at DATETIME(6),
    password_last_updated_at DATETIME(6),
    public_key TEXT,
    encrypted_master_key_salt VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT FK_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
) ENGINE=InnoDB;

CREATE TABLE secrets (
    id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    tenant_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    encrypted_data TEXT,
    metadata JSON,
    PRIMARY KEY (id),
    CONSTRAINT FK_secrets_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
) ENGINE=InnoDB;

CREATE TABLE leases (
    id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    secret_id BIGINT NOT NULL,
    agent_id BIGINT NOT NULL,
    encrypted_data TEXT,
    expiry DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT FK_leases_secret FOREIGN KEY (secret_id) REFERENCES secrets (id),
    CONSTRAINT FK_leases_agent FOREIGN KEY (agent_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE requests (
    id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    tenant_id BIGINT NOT NULL,
    requester_id BIGINT NOT NULL,
    status ENUM('pending', 'fulfilled', 'rejected', 'abandoned') NOT NULL,
    type ENUM('CREATE', 'LEASE') NOT NULL,
    name VARCHAR(255),
    context TEXT,
    required_metadata JSON,
    required_fields JSON,
    mapped_secret_id BIGINT,
    requested_secret_id BIGINT,
    rejection_reason VARCHAR(255),
    fulfillment_url VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT FK_requests_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT FK_requests_requester FOREIGN KEY (requester_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE idempotency_records (
    id VARCHAR(255) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    response_body LONGTEXT,
    response_status INTEGER,
    PRIMARY KEY (id)
) ENGINE=InnoDB;
