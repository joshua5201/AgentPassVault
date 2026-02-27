import type {
  AgentResponse,
  RequestResponse,
  RequestResponseStatusEnum,
  RequestResponseTypeEnum,
  SecretMetadataResponse,
} from "@agentpassvault/sdk";

const now = new Date("2026-02-27T00:00:00.000Z");

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
    createdAt: now,
  },
  {
    agentId: "agent-finance-sync",
    name: "finance-sync",
    displayName: "Finance export scheduler",
    createdAt: now,
  },
];
