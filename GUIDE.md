# AgentPassVault — Agent Integration Guide
---

A short reference for automated agents to request and retrieve secrets securely using the agentpassvault CLI.

# Security first

- Never expose secrets or private keys in chat, logs, or model prompts.
- Keep private keys local with strict permissions (600). Decrypt and use secrets only locally.

# Required values (keep secret)

- AGENTPASSVAULT_API_URL — e.g. https://api.agentpassvault.com
- TENANT_ID — numeric tenant id
- AGENT_ID — numeric agent id
- APP_TOKEN — agent app token

# Quick agent flow

1. Configure CLI:
agentpassvault identity setup --api-url <URL> --tenant-id <TENANT_ID> --agent-id <AGENT_ID> --app-token <TOKEN>
2. Ensure keypair:
agentpassvault identity generate-key
(private: ~/.config/agentpassvault/keys/agent.priv, mode 600)
3. Register public key:
agentpassvault identity register
(CLI calls agentLogin then uploads public key)
4. Create request (Ask a human):
agentpassvault request-secret "plurk-account" --metadata '{"account":"joshua5201"}'
→ Share the printed fulfillment URL with a human approver
5. Poll request:
agentpassvault get-request <requestId>
→ Wait for status fulfilled and note mappedSecretId
6. Retrieve secret and decrypt locally:
agentpassvault get-secret <secretId>
→ CLI decrypts locally using private key. Do not forward plaintext.

# Using secrets safely

- Pipe into the action (stdin) or use ephemeral file with mode 600, then delete.
- Avoid logging plaintext.

# Minimal test checklist

- setup → generate-key → register → request-secret → fulfill in UI → get-request → get-secret → clean up.
