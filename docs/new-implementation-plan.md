# New Implementation Plan: Client-Side Encryption Architecture

## Overview
This plan outlines the transition of AgentVault from a server-side encryption model to a zero-knowledge architecture where the server only stores pre-encrypted blobs. The server will no longer possess any keys to decrypt user secrets.

## [x] 1. Remove Server-Side Encryption
*   **Action:** Delete `src/main/java/com/agentvault/service/crypto/EncryptionService.java` and its tests.
*   **Action:** Delete `src/main/java/com/agentvault/service/crypto/KeyManagementService.java` and its tests.
*   **Action:** Delete `src/main/java/com/agentvault/service/crypto/MasterKeyProvider.java` and `EnvVarMasterKeyProvider.java`.
*   **Action:** Remove `encryptedTenantKey` from the `Tenant` model.
*   **Action:** Remove dependencies on these services in `SecretService`, `UserService`, and `DataSeeder`.

## [x] 2. Update Data Models
*   **Secret Model:**
    *   Rename `encryptedValue` to `encryptedData` (or similar) to indicate it's an opaque blob.
    *   Change the type to `String` (Base64 encoded)
*   **Tenant Model:**
    *   Remove `encryptedTenantKey`.
*   **User (Agent) Model:**
    *   Add a string field for the user's **Public Key** (`publicKey`), stored as a PEM string. This is used by others to encrypt secrets for this user (agent).
    *   Add `encryptedMasterKeySalt` (String): Stores the user's master key salt, encrypted using the SYSTEM key.
*   **Lease Model:**
    *   Create a new entity `Lease` to store the secret data encrypted specifically for an agent.
    *   Fields:
        *   `id` (String/ObjectId).
        *   `leaseId` (UUID, public).
        *   `secretId` (UUID, FK to Secret).
        *   `agentId` (UUID, FK to Agent/User).
        *   `encryptedData` (Base64 string): The secret value encrypted with the Agent's Public Key.
        *   `expiry` (LocalDateTime): When the lease expires. Null if no expiry
    *   Relationships: A Secret can have multiple Leases (one per agent). The Secret object itself stores the owner's copy (if any), while Leases store the agent copies.

### [x] 2.1 Detailed Migration Steps (MySQL)
The project transitioned from MongoDB to MySQL 8 to leverage robust relational integrity, ACID compliance, and mature tooling while retaining metadata flexibility via MySQL's native JSON support.

#### [x] 2.1.1. Build & Infrastructure Changes
*   **Gradle Dependencies (`build.gradle.kts`):**
    *   **Remove:** `org.springframework.boot:spring-boot-starter-data-mongodb`
    *   **Add:**
        *   `org.springframework.boot:spring-boot-starter-data-jpa`
        *   `com.mysql:mysql-connector-j` (runtimeOnly)
        *   `io.hypersistence:hypersistence-utils-hibernate-63` (For convenient JSON type support)
*   **Docker Compose (`docker-compose.yml`):**
    *   **Remove:** `mongodb` service and `mongodb_data` volume.
    *   **Add:** `mysql` service (MySQL 8.0).
        *   Environment variables: `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE=agentvault`, `MYSQL_USER`, `MYSQL_PASSWORD`.
        *   Ports: `3306:3306`.
        *   Volume: `mysql_data:/var/lib/mysql`.
*   **Configuration (`application.properties`):**
    *   Remove MongoDB configurations.
    *   Add Datasource config: `spring.datasource.url`, `username`, `password`.
    *   Add JPA config: `spring.jpa.hibernate.ddl-auto=update` (dev), `spring.jpa.open-in-view=false`.

#### [x] 2.1.2. Entity & Data Model Migration (JPA)
*   **BaseEntity:**
    *   Annotate with `@MappedSuperclass`.
    *   Use `@Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;`
    *   Add `@Version` for optimistic locking if needed.
    *   Add `@CreatedDate`, `@LastModifiedDate` (requires `@EntityListeners(AuditingEntityListener.class)`).
*   **Tenant (`tenants` table):**
    *   `@Entity @Table(name = "tenants")`.
    *   Fields: `name` (unique).
*   **User (`users` table):**
    *   `@Entity @Table(name = "users")`.
    *   `@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "tenant_id") private Tenant tenant;`
    *   Fields: `username`, `passwordHash`, `role` (EnumString), `publicKey` (TEXT/CLOB), `encryptedMasterKeySalt`.
*   **Secret (`secrets` table):**
    *   `@Entity @Table(name = "secrets")`.
    *   `@ManyToOne(fetch = FetchType.LAZY) private Tenant tenant;`
    *   `@Column(columnDefinition = "json") private Map<String, String> metadata;` (Use Hypersistence `JsonType`).
    *   Fields: `encryptedData` (TEXT/CLOB), `hash` (for uniqueness checks if needed).
*   **Lease (`leases` table):**
    *   `@Entity @Table(name = "leases")`.
    *   `@ManyToOne(fetch = FetchType.LAZY) private Secret secret;`
    *   `@ManyToOne(fetch = FetchType.LAZY) private User agent;`
    *   Fields: `encryptedData` (TEXT/CLOB), `expiry` (LocalDateTime).
*   **Request (`requests` table):**
    *   `@Entity @Table(name = "requests")`.
    *   `@Column(columnDefinition = "json") private Map<String, String> requiredMetadata;`
    *   `@Column(columnDefinition = "json") private List<String> requiredFields;`

#### [x] 2.1.3. Repository Layer
*   Convert all `MongoRepository` interfaces to `JpaRepository<Entity, UUID>`.
*   **Refactor Queries:**
    *   Replace MongoDB JSON queries with JPQL or Native SQL for JSON fields.
    *   Example: `SELECT s FROM Secret s WHERE function('json_extract', s.metadata, '$.service') = :serviceName`
    *   Or use JPA Specifications.

#### [x] 2.1.4. Script Updates
*   **`scripts/management/dev-env.sh`**:
    *   Wait for MySQL port 3306 instead of 27017.
    *   Check for `mysqladmin ping`.
*   **`scripts/management/clear-db.sh`**:
    *   Replace `mongosh` commands with `mysql` commands to truncate/drop tables.
*   **`scripts/management/setup-dev-user.sh`**:
    *   Adapt to insert into SQL tables (or rely on API/DataSeeder).

#### [x] 2.1.5. Code Cleanup
*   Remove `spring-boot-starter-data-mongodb` usage in all service classes.

### [x] 2.2 Primary Key (TSID) change and repository utils
Replace UUID primary keys and separate public IDs with a single TSID (Time-Sorted Unique Identifier) primary key. This improves database performance (locality) and simplifies the model. We will use `hypersistence-tsid` for generation and `hypersistence-utils` for repository utilities.

#### [x] 2.2.1 Dependencies
*   **Add:** `io.hypersistence:hypersistence-tsid:2.1.1` to `build.gradle.kts`.
*   (Already added `hypersistence-utils-hibernate-63` in 2.1).

#### [x] 2.2.2 BaseEntity & ID Configuration
*   **Modify `BaseEntity`:**
    *   Change `id` type from `UUID` to `Long`.
    *   Annotate with `@Id @GeneratedValue(strategy = GenerationType.AUTO)`.
    *   Configure Hibernate to use a TSID generator (likely via `hypersistence-utils` or a custom generator wrapping `TSID.fast()`).
    *   **MySQL Column:** `BIGINT` (Primary Key).

#### [x] 2.2.3 Entity Cleanup
*   **Remove Secondary UUIDs:**
    *   `Tenant`: Remove `tenantId`.
    *   `User`: Remove `userId`.
    *   `Secret`: Remove `secretId`.
    *   `Request`: Remove `requestId`.
    *   `Lease`: Remove `leaseId`.
*   **Foreign Keys:** Update all `@ManyToOne` join columns to reference the new `BIGINT` ids.

#### [x] 2.2.4 Repository & Service Layer Updates
*   **Repositories:** Update `JpaRepository` type parameters to `<Entity, Long>`.
*   **Services/Controllers:**
    *   Update method signatures to accept/return `Long`.
*   **DTO Layer (Request/Response):** 
    *   IDs must be represented as `String` in DTOs to avoid precision loss in JavaScript (JSON).
    *   Implement conversion logic between `String` (DTO) and `Long` (Service/Entity).
    *   **Validation:** Add validation to DTOs to ensure the `String` ID is a valid positive numeric string (representing a Long).
*   **TSID Factory:** Configure a `TsidFactory` bean or static initializer to ensure unique node bits if necessary (for now default is fine for single instance).

## [ ] 3. Update API DTOs
*   **CreateSecretRequest:**
    *   Remove `value` (plaintext).
    *   Add `encryptedValue` (Base64 string). The client must encrypt this before sending.
    *   **Enforce Size Limit:** Implement validation to reject `encryptedValue` larger than **64 KB** (approx. 87,381 Base64 characters).
*   **SecretResponse:**
    *   Remove `value` (decrypted).
    *   Add `encryptedValue` (Base64 string). The client must decrypt this.
*   **Agent Registration:**
    *   Update `POST /api/v1/agents` or a new endpoint to accept the agent's public key.

## [ ] 4. Refactor SecretService
*   **Create Secret:**
    *   Remove logic that generates/retrieves tenant keys.
    *   Simply store the provided `encryptedValue` directly into the database.
    *   **Validation:** Ensure metadata combined size does not exceed **8 KB**.
*   **Get Secret:**
    *   Return the stored `encryptedValue` without any decryption.
    *   Remove checks that depended on server-side decryption (e.g., verifying visibility might still apply, but access control relies on the client having the private key).

## [ ] 5. Refactor Request/Lease Flow (The "Missing Secret" Flow)
*   The server currently facilitates the "handshake".
*   **Request:** 
    *   Agent requests a secret.
    *   **Validation:** Enforce **2 KB** limit on `context` field.
*   **Fulfillment:**
    *   Admin retrieves the agent's public key from the server (via `GET /api/v1/agents/{id}`).
    *   Admin encrypts the secret value with the agent's public key **on their client**.
    *   Admin sends the encrypted blob to the server via `PATCH /api/v1/requests/{id}` (Fulfill).
    *   Server stores this blob (as a new Secret or a Lease entry).
*   **Lease:**
    *   If utilizing the "Lease" concept, the lease object will store the encrypted-for-agent blob.

## [ ] 6. Cleanup & Configuration
*   Remove `agentvault.system.key` from `application.properties` and environment variables.
*   Update `DataSeeder` to stop generating tenant keys.

## [ ] 7. Verification
*   Update tests to mock client-side encryption (i.e., pass dummy "encrypted" strings).
*   Ensure no `javax.crypto` or `java.security` classes are used for *data* encryption on the server (hashing for passwords/tokens is still allowed).

## [ ] 8. Documentation
*   Update `openapi.yaml` to reflect the new API contract (encrypted fields).

## [ ] 9. Implement Idempotency
*   **Data Model:** Create `IdempotencyRecord` entity:
    *   `id`: String (TenantId + IdempotencyKey).
    *   `responseBody`: String (Serialized response).
    *   `responseStatus`: Integer (HTTP status code).
    *   `createdAt`: LocalDateTime (For TTL expiration).
*   **Interceptor/Filter:**
    *   Implement a Spring `HandlerInterceptor` or a Servlet `Filter`.
    *   Intercept all `POST` and `PATCH` requests.
    *   Check for `Idempotency-Key` header.
    *   If present, check MongoDB for an existing record.
    *   If record exists, return the cached response immediately.
    *   If not, proceed with the request and store the result in the `postHandle` or `afterCompletion` phase.
*   **TTL Index:** Add a TTL index to the `createdAt` field in MongoDB to automatically clear records after 24 hours.