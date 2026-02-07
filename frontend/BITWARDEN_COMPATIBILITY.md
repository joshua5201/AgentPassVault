# Bitwarden Compatibility Analysis

> **CRITICAL:** While we are okay to refer to the logic of Bitwarden's GPL-licensed code to implement our encryption/decryption logic and formats, we must **NEVER** refer to or use any code from Bitwarden's commercially licensed software (`bitwarden_license/`). All implementations must be written from scratch to ensure no direct code duplication or license contamination from proprietary modules.

## 1. License Analysis & Commercial Use

### Bitwarden License v1.0 (Proprietary)
The "Bitwarden License v1.0" applies specifically to **Commercial Modules** (located in `/bitwarden_license`).
- **Restrictions:** Section 2.3 (iii) explicitly prohibits using these modules to **"create a competing product or service."**
- **Usage:** Only allowed for internal development and testing in non-production environments.
- **Action for AgentPassVault:** **COMPLETE AVOIDANCE.** We must not read, reference, or use any code within `bitwarden_license/` directories to ensure our product remains legally independent and avoids any conflict with Bitwarden's commercial licensing.

### Building Compatible Products with Paid Features
Based on research into the legality of Bitwarden-compatible implementations (e.g., Vaultwarden):
- **Legality of Protocol:** Reimplementing a protocol or API from scratch for interoperability (Clean Room Design) is a standard industry practice. Bitwarden has not legally challenged reimplementations of its protocol.
- **Trademark Restrictions:** You **cannot** use the name "Bitwarden" or their logos in your product name or marketing. Using "Bitwarden-compatible" in technical descriptions is generally acceptable, but the product must have a distinct brand (e.g., *AgentPassVault* instead of *Agent-Bitwarden*).
- **Commercialization:** Offering a third-party compatible server/client with paid features is legal as long as it does not include any Bitwarden-copyrighted code (especially their Commercial Modules). 
- **Managed Hosting Precedents:** Services like **PikaPods, Elestio, and iTeFix** already offer managed Vaultwarden hosting for a fee. These services prove that providing a Bitwarden-compatible cloud service is a viable and legally recognized business model.
- **Recommendation:** Ensure all "premium" logic is original work and does not derive from Bitwarden's proprietary "Bitwarden License" modules. Maintain a strong, independent brand to avoid trademark issues.

### GPL v3.0 (Open Source)
The bulk of the Bitwarden client logic (primitives, UI components, etc.) is under GPL v3.0.
- **Usage:** While GPL allows creating third-party clients/servers, any code *derived* from GPL code must also be GPL.
- **Action for AgentPassVault:** Since we have adopted **GPLv3** for our frontend implementation, we are permitted to refer to the encryption/decryption logic and data formats defined in Bitwarden's GPL-licensed repositories to ensure full compatibility. We still implement our own code from scratch using standard platform APIs (Web Crypto API) to maintain a clean and independent codebase.

### Goldwarden (MIT)
- **Action:** Patterns and protocol details can be safely referenced as it is MIT licensed, but we still implement our own code to maintain project integrity.

## 2. Strategic Choice: Forking vs. Clean Room

### Option A: Forking Bitwarden SDK (GPLv3)
- **Pros:** 
  - Fastest path to 100% protocol parity.
  - Battle-tested code for edge cases (e.g., various KDF configurations).
- **Cons:**
  - **Copyleft Requirement:** While GPLv3 **allows commercial use**, it requires that you release your modified source code under GPLv3. You cannot make a "closed source" version of a GPLv3 fork.
  - **Extreme Coupling:** Bitwarden's SDK is highly coupled with internal services like `StateProvider`, `LogService`, and RxJS streams.
  - **WASM Dependency:** Core crypto is moving to `PureCrypto` (a WASM module), which adds complexity.

### Option B: Clean Room based on MIT Reference (Goldwarden)
- **Pros:**
  - **Licensing Freedom:** You can license AgentPassVault under any license.
  - **Minimal Dependencies:** Zero external dependencies (uses native Web Crypto API).
  - **Ease of Integration:** Lightweight and easy to integrate.
- **Cons:**
  - Requires more effort to implement and test protocol compatibility from scratch.

### Decision for AgentPassVault
We have chosen a **Hybrid Licensing Model** combined with a **Clean Room** implementation:
- **Backend:** **AGPLv3** to ensure that any network-accessible modifications are shared with the community.
- **Frontend/Client (SDK, CLI, Web):** **GPLv3** to provide robust defensive patent protection and ensure that the "Agent Fulfillment" flow remains open and available to the community without risk of patent hijacking.
- **Implementation:** Research into the Bitwarden SDK confirmed that it is too tightly integrated with Bitwarden's specific application architecture. Our clean room implementation ensures 100% protocol compatibility while maintaining a lightweight and legally independent codebase.

## 3. Patents and the "Business Flow"

If you intend to patent a unique business flow (like the "Agent Fulfillment" process) while keeping the implementation Open Source:

### GPLv3 Patent Clause (Section 11)
- **Automatic License:** By distributing code under GPLv3, you grant every recipient a **royalty-free, non-exclusive patent license** to use any patented invention embodied in that software.
- **Implication:** You **cannot charge royalties** to anyone using, modifying, or distributing your GPLv3 code. 
- **Strategic Value:** You can still patent the flow for defensive protection and to prevent competitors from using the same flow in proprietary or non-compatible software.

## 4. Key Files and Locations (Reference)

### Bitwarden Clients (Official)
- **Core Primitives:** `libs/common/src/key-management/crypto/services/web-crypto-function.service.ts`
- **Encryption Service:** `libs/common/src/key-management/crypto/services/encrypt.service.implementation.ts`
- **Encryption Types:** `libs/common/src/platform/enums/encryption-type.enum.ts`
- **Key Management:** `libs/key-management/src/key.service.ts`

### Goldwarden (Third-Party Go Client)
- **Crypto Core:** `cli/agent/bitwarden/crypto/crypto.go`
- **Encryption Strings:** `cli/agent/bitwarden/crypto/encstring.go`

## 5. Implementation Comparison

| Feature | Bitwarden Official | Goldwarden (Go) | AgentPassVault |
| :--- | :--- | :--- | :--- |
| **Symmetric Algo** | AES-256-CBC | AES-256-CBC | AES-256-CBC |
| **MAC** | HMAC-SHA256 | HMAC-SHA256 | HMAC-SHA256 |
| **KDF** | PBKDF2-HMAC-SHA256 | PBKDF2-HMAC-SHA256 | PBKDF2-HMAC-SHA256 |
| **PBKDF2 Iterations** | 600,000 (Default) | Matches Server | 600,000 |
| **Key Size** | 512 bits (split 256/256) | 512 bits (split 256/256) | 512 bits (split 256/256) |
| **Asymmetric Algo** | RSA-OAEP (2048/4096) | RSA-OAEP (2048) | RSA-OAEP (4096) |
| **OAEP Hash** | SHA-256 (Type 3) / SHA-1 (Type 4) | SHA-1 (Type 4) | SHA-256 |

## 6. Compatibility Strategy for AgentPassVault

### Symmetric Encryption (Vault Secrets)
- **Format:** `2.<iv>|<ciphertext>|<mac>` (Bitwarden Type 2 Compatible).
- **Key Splitting:** Derive 512 bits via `deriveBits` and split into `encKey` (0-255) and `macKey` (256-511).
- **HMAC Verification:** MAC is calculated over `IV + Ciphertext`.

### Asymmetric Encryption (Agent Leases)
- **Algorithm:** RSA-OAEP 4096-bit.
- **Hash Function:** SHA-256.
- **Why RSA-OAEP?** Ideal for asynchronous fulfillment by humans for agents. We use SHA-256 to align with modern security standards while following the general Bitwarden pattern for asymmetric delivery.

### Key Derivation (Master Key)
- **Method:** PBKDF2-HMAC-SHA256.
- **Salt:** User's email (following Bitwarden's approach).
- **Iterations:** 600,000 to match Bitwarden's current security baseline.
