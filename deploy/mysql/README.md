# MySQL Staging Deployment on GCE Free Tier

This directory contains the configuration for a secure MySQL 8.4 instance intended for staging on a Google Compute Engine (GCE) e2-micro instance.

## 1. Security Overview
- **SSL Enforced**: All remote connections must use SSL (`require_secure_transport=ON`).
- **Limited RAM**: Optimized for e2-micro (256MB InnoDB buffer pool).
- **Hardened**: Local-infile disabled and name resolution skipped.

## 2. Preparation

### Generate SSL Certificates
Before deploying, generate the required certificates. You can use the following script:

```bash
mkdir -p certs
openssl genrsa 2048 > certs/ca-key.pem
openssl req -new -x509 -nodes -days 3600 -key certs/ca-key.pem -out certs/ca.pem -subj "/CN=MySQL_CA"
openssl req -newkey rsa:2048 -days 3600 -nodes -keyout certs/server-key.pem -out certs/server-req.pem -subj "/CN=MySQL_Server"
openssl rsa -in certs/server-key.pem -out certs/server-key.pem
openssl x509 -req -in certs/server-req.pem -days 3600 -CA certs/ca.pem -CAkey certs/ca-key.pem -set_serial 01 -out certs/server-cert.pem
```

## 3. Deployment

### Option A: Using GCE Metadata (Recommended)
This approach avoids storing passwords in plain text files on the VM disk.

1. **Set Metadata**: In the GCP Console, go to your VM instance -> **Edit**. Scroll to **Custom metadata** and add:
   - `MYSQL_ROOT_PASSWORD`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
2. **Transfer files** to your GCE instance.
3. **Launch**:
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

### Option B: Using .env File
1. **Transfer files** to your GCE instance.
2. Create a `.env` file in the same directory:
   ```env
   MYSQL_ROOT_PASSWORD=your_secure_root_password
   MYSQL_USER=staging_user
   MYSQL_PASSWORD=your_secure_user_password
   ```
3. **Launch**:
   ```bash
   docker compose up -d
   ```

## 4. GCP Networking (Firewall)
In the GCP Console, create a firewall rule:
- **Direction**: Ingress
- **Action**: Allow
- **Targets**: Specified target tags (e.g., `mysql-server`)
- **Source Filter**: IP ranges (Ideally only your application server's IP)
- **Protocols and ports**: tcp:3306

## 5. JDBC Connection
Use the following format to ensure a secure connection:

```text
jdbc:mysql://<GCE_IP>:3306/agentpassvault_staging?useSSL=true&requireSSL=true&verifyServerCertificate=true
```

If your client requires a TrustStore, convert the `ca.pem` to JKS:
```bash
keytool -importcert -alias MySQLCA -file certs/ca.pem -keystore truststore.jks -storepass changeit
```
And add `&trustCertificateKeyStoreUrl=file:truststore.jks&trustCertificateKeyStorePassword=changeit` to the JDBC URL.
