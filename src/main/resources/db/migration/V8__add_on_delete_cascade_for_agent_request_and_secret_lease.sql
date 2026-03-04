ALTER TABLE leases DROP FOREIGN KEY FK_leases_secret;
ALTER TABLE leases
    ADD CONSTRAINT FK_leases_secret
        FOREIGN KEY (secret_id) REFERENCES secrets (id) ON DELETE CASCADE;

ALTER TABLE leases DROP FOREIGN KEY FK_leases_agent;
ALTER TABLE leases
    ADD CONSTRAINT FK_leases_agent
        FOREIGN KEY (agent_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE requests DROP FOREIGN KEY FK_requests_requester;
ALTER TABLE requests
    ADD CONSTRAINT FK_requests_requester
        FOREIGN KEY (requester_id) REFERENCES users (id) ON DELETE CASCADE;
