# AgentVault

AgentVault is a lightweight, standalone password and secret manager designed for automated agents.

## 🔑 Security Setup

AgentVault uses a 2-tier key hierarchy (SMK + TK) with AES-256 GCM encryption.

### 1. Generate the System Master Key (SMK)

For production, you must generate a cryptographically secure 32-byte key and encode it in Base64. 

**Using OpenSSL:**
```bash
openssl rand -base64 32
```

**Using Python:**
```bash
python3 -c "import os, base64; print(base64.b64encode(os.urandom(32)).decode())"
```

### 2. Configure the Environment

Set the generated key as an environment variable:

```bash
export AGENTVAULT_SYSTEM_KEY="your-generated-base64-key"
```

In `application.properties` (or as an environment variable `AGENTVAULT_SYSTEM_KEY` which Spring maps to the property):

```properties
agentvault.system.key=${AGENTVAULT_SYSTEM_KEY}
```

## 🚀 Running the Application

1. **Prerequisites:**
   - Java 21
   - MongoDB 6.0+

2. **Build:**
   ```bash
   ./gradlew build
   ```

3. **Run:**
   ```bash
   export AGENTVAULT_SYSTEM_KEY="..."
   java -jar build/libs/agentvault-0.0.1-SNAPSHOT.jar
   ```
