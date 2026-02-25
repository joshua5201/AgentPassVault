3. Fulfill the request in the UI; run get-request to confirm status is fulfilled and you have mappedSecretId.
4. Run get-secret and confirm the CLI decrypts successfully with the agent private key.
5. Delete test data when done.

Audit / logging

• Keep only non-sensitive metadata in logs (request IDs, secret IDs, timestamps, success/failure).
• Do not log plaintext secrets or private keys.

Troubleshooting

• Registration failed: Invalid credentials or HTTP 403 on agentLogin: verify tenantId vs agentId vs appToken are correct and that the token is active and allowed for this tenant.
• Fulfillment URL ends with /null: backend bug — ensure request is persisted before generating URL (see “Notes for implementers”).
• If a site requires full browser JS for login, use a headless browser workflow that receives the secret via stdin/pipe and does not store it in logs.

Example agent pseudocode (high level)

• Run identity setup (one-time)
• Run identity generate-key (if absent)
• Run identity register
• Run request-secret "name" --metadata '{...}' and share fulfillment URL with a human
• Poll get-request until fulfilled
• Run get-secret mappedSecretId and pipe the secret into the action (e.g., login script)
• Delete any plaintext material and rotate if needed
