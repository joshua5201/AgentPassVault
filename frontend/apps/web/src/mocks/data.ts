import type {
  AgentResponse,
  RequestResponse,
  RequestResponseStatusEnum,
  RequestResponseTypeEnum,
  SecretMetadataResponse,
} from "@agentpassvault/sdk";

const now = new Date("2026-02-27T00:00:00.000Z");
const mockAgentPublicKeyCiProd =
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqtc7Mrlh0SalmCb8B4iOXQ0T7PNDwHyAJvWNUxvvg06T4wJKMOZ172ajPz8m08JbNaQSB38PPPIHV+dzJ3n8t9QDEA4W8UgABf4ORByHHWLYc1QUAVTq+1ZZcz3yjkK242YAdmm7YruCarcYBtlskTnnOQ5VIAoDROlxKvBwjCFpRcDof7YOVbq8D1Q0k82vSSNFrJsNrMtZ0pFlYox69e3oRdrQJLU6bJKhy2YbwTLPNKzjETj2Nt8nmWHpEpbOOE8ZUziunZggq1NyktD5Ue823JmZ+6JGLqNhRUTWXKUdUzSxiWdTdAJZN8/02tKTuAuddbn8+1DhPzEWEhbCCQIDAQAB";
const mockAgentPublicKeyFinanceSync =
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2UtAsG74jvV+ah+PI1SV2ndIcwZsyFJdc4MQoTgbqP12oEzxcfa2O+8obTCwKaNlNEObBvpWMqQ8RHT+fb400AIZ3a/OwE/55YBUzyQkDuPSVoh1HgtlMx/A/30mfUwbTjnlUlwmUUEoir7qgNF1pxKXunmwvXojJc9oMx4w3huynA1RKAHGqw2Q3iDSEeDYIk3ZB6D1V5Y3CevbBjAu0nM649p0Jhi8hXwm9VNYmU/AGWjUndUlXeq5Wo0CvUFHgmU9S0bhmSlXjrF5L6LEZApMdePhy6m74zcqF5OTlR+QUiZ91Wd78cAxox8OXQobkW4ffbIIE5W6dLA1wO4RewIDAQAB";

export const mockRequests: RequestResponse[] = [
  {
    requestId: "req-aws-prod",
    agentId: "agent-ci-prod",
    status: "pending" satisfies RequestResponseStatusEnum,
    type: "CREATE" satisfies RequestResponseTypeEnum,
    name: "AWS Production Credentials",
    context: "Deployment pipeline needs updated credentials.",
    requiredMetadata: { service: { value: "aws" }, environment: { value: "prod" } },
    requiredFieldsInSecretValue: ["access_key", "secret_key"],
    fulfillmentUrl: "https://vault.local/fill/req-aws-prod",
    createdAt: now,
    updatedAt: now,
  },
  {
    requestId: "req-gcp-billing",
    agentId: "agent-finance-sync",
    status: "pending" satisfies RequestResponseStatusEnum,
    type: "LEASE" satisfies RequestResponseTypeEnum,
    secretId: "sec-002",
    name: "GCP Billing Service Account",
    context: "Finance export integration cannot authenticate.",
    requiredMetadata: { service: { value: "gcp" }, team: { value: "finance" } },
    requiredFieldsInSecretValue: ["service_account_json"],
    fulfillmentUrl: "https://vault.local/fill/req-gcp-billing",
    createdAt: now,
    updatedAt: now,
  },
];

export const mockSecrets: SecretMetadataResponse[] = [
  {
    secretId: "sec-001",
    name: "AWS Deploy Key",
    metadata: { service: { value: "aws" }, environment: { value: "prod" } },
    createdAt: now,
    updatedAt: now,
  },
  {
    secretId: "sec-002",
    name: "GCP Billing Token",
    metadata: { service: { value: "gcp" }, team: { value: "finance" } },
    createdAt: now,
    updatedAt: now,
  },
];

export const mockAgents: AgentResponse[] = [
  {
    agentId: "agent-ci-prod",
    name: "ci-prod",
    displayName: "Production deployment runner",
    publicKey: mockAgentPublicKeyCiProd,
    createdAt: now,
  },
  {
    agentId: "agent-finance-sync",
    name: "finance-sync",
    displayName: "Finance export scheduler",
    publicKey: mockAgentPublicKeyFinanceSync,
    createdAt: now,
  },
];
