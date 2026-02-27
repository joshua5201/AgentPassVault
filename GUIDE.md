# AgentPassVault — Agent Integration Guide
---

A short reference for automated agents to request and retrieve secrets securely using the agentpassvault CLI.

## Security first

- Never expose secrets or private keys in chat, logs, or model prompts.
- Keep private keys local with strict permissions (600). Decrypt and use secrets only locally.

## CLI Setup and Execution

If you need a standalone executable (so you don't need Node.js at runtime), you can compile the CLI. Run this in the `frontend/apps/cli` directory of the repository:
```bash
npm install -g pkg
pkg package.json
```
This produces single binaries (e.g. `agentpassvault-linux`) you can use directly.

**JSON Output:** By default, all CLI commands output clean, machine-readable JSON to standard output (`stdout`). If you need human-readable progress logs, pass the `-v` or `--verbose` flag (which prints to `stderr`). Errors are also output as JSON to `stderr`.

## Required values (keep secret)

- `AGENTPASSVAULT_API_URL` — e.g. https://api.agentpassvault.com
- `TENANT_ID` — numeric tenant id
- `AGENT_ID` — numeric agent id
- `APP_TOKEN` — agent app token

## Quick agent flow

1. **Initialize Agent (One-shot Setup, Key Gen, & Registration):**
```bash
agentpassvault identity init --api-url <URL> --tenant-id <TENANT_ID> --agent-id <AGENT_ID> --app-token <TOKEN>
```
*(This sets up your configuration in `~/.config/agentpassvault/config.json`, generates a 4096-bit RSA keypair in `~/.config/agentpassvault/keys/`, and registers your public key with the server).*

2. **Create request (Ask a human):**
```bash
agentpassvault request create "some-account" --metadata '{"account":"joshua5201"}'
```
→ Share the `fulfillmentUrl` from the JSON response with a human approver.

3. **Poll request:**
```bash
agentpassvault request get <requestId>
```
→ Wait for `"status": "fulfilled"` in the JSON response and note the `mappedSecretId`.

4. **Retrieve secret and decrypt locally:**
```bash
agentpassvault secret get <secretId>
```
→ The CLI securely fetches the encrypted payload and decrypts it locally using your private key, outputting the secret as JSON. Do not forward the plaintext.

5. **(Optional) List available secrets:**
```bash
agentpassvault secret list
```

6. **(Optional) Search for secrets by metadata:**
```bash
# Create a temporary file with your search query
echo '{"service":"aws","region":"us-east-1"}' > /tmp/query.json

# Search using the file
agentpassvault secret search --from-file /tmp/query.json

# Clean up the temp file
rm /tmp/query.json
```

## Using secrets safely

- Parse the JSON output programmatically (e.g., using `jq` or built-in JSON parsers).
- Pipe into the action (stdin) or use an ephemeral file with mode 600, then delete immediately.
- Avoid logging plaintext.

## Minimal test checklist

- `init` → `request create` → fulfill in UI (or via admin CLI) → `request get` → `secret get` → clean up.
