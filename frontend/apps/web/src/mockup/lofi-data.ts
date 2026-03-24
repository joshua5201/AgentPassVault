export type MockupRequestStatus = "pending" | "fulfilled" | "rejected";
export type MockupRequestType = "CREATE" | "LEASE";

export interface MockupRequest {
  id: string;
  name: string;
  type: MockupRequestType;
  status: MockupRequestStatus;
  agentId: string;
  agentName: string;
  updatedAt: string;
  context: string;
  summary: string;
  requiredFields: string[];
  metadata: Record<string, string>;
  linkedSecretId?: string;
  linkedSecretName?: string;
  leaseStatus?: string;
  leaseExpiresAt?: string;
}

export interface MockupSecret {
  id: string;
  name: string;
  service: string;
  environment: string;
  owner: string;
  updatedAt: string;
  revealedValue: string;
  metadata: Record<string, string>;
  leaseCount: number;
  activeAgents: string[];
  note: string;
}

export interface MockupAgent {
  id: string;
  name: string;
  displayName: string;
  environment: string;
  publicKeyState: string;
  keyFingerprint: string;
  lastActivityAt: string;
  activeLeases: number;
  linkedSecrets: string[];
  note: string;
  risk: "stable" | "attention";
}

export interface MockupAuditEvent {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  domain: "Requests" | "Secrets" | "Agents";
  outcome: "success" | "warning" | "danger" | "neutral";
  detail: string;
}

export const mockupRequests: MockupRequest[] = [
  {
    id: "req-aws-prod",
    name: "AWS Production Credentials",
    type: "CREATE",
    status: "pending",
    agentId: "agent-ci-prod",
    agentName: "ci-prod",
    updatedAt: "2026-03-20T10:45:00.000Z",
    context:
      "Deployment pipeline needs updated credentials before the next release cut.",
    summary:
      "Waiting for a human to create a new production credential set for the deployment runner.",
    requiredFields: ["access_key", "secret_key"],
    metadata: {
      service: "aws",
      environment: "prod",
      scope: "deployments",
      requested_by: "release-window-42",
    },
  },
  {
    id: "req-gcp-billing",
    name: "GCP Billing Service Account",
    type: "LEASE",
    status: "pending",
    agentId: "agent-finance-sync",
    agentName: "finance-sync",
    updatedAt: "2026-03-20T09:15:00.000Z",
    context:
      "Finance export integration cannot authenticate for the daily billing pull.",
    summary:
      "Existing secret can likely be leased again after a quick review of expiry and scope.",
    requiredFields: ["service_account_json"],
    metadata: {
      service: "gcp",
      environment: "prod",
      team: "finance",
      sync_window: "daily-08-utc",
    },
    linkedSecretId: "sec-gcp-billing",
    linkedSecretName: "GCP Billing Token",
    leaseStatus: "Expired 3 hours ago",
    leaseExpiresAt: "2026-03-20T06:03:00.000Z",
  },
  {
    id: "req-github-release",
    name: "GitHub Release Token",
    type: "LEASE",
    status: "fulfilled",
    agentId: "agent-release-bot",
    agentName: "release-bot",
    updatedAt: "2026-03-19T14:08:00.000Z",
    context:
      "Release automation requested a refreshed token for package publication.",
    summary: "Lease was reissued after confirming repository scope.",
    requiredFields: ["token"],
    metadata: {
      service: "github",
      repository: "agentpassvault/frontend",
      environment: "prod",
    },
    linkedSecretId: "sec-gh-release",
    linkedSecretName: "GitHub Release Token",
    leaseStatus: "Active",
    leaseExpiresAt: "2026-03-27T14:08:00.000Z",
  },
  {
    id: "req-legacy-jenkins",
    name: "Legacy Jenkins Admin",
    type: "CREATE",
    status: "rejected",
    agentId: "agent-legacy-migrator",
    agentName: "legacy-migrator",
    updatedAt: "2026-03-18T17:20:00.000Z",
    context:
      "Migration helper requested elevated Jenkins access not aligned with the approved runbook.",
    summary:
      "Request was rejected because the requested privilege exceeded migration policy.",
    requiredFields: ["username", "password"],
    metadata: {
      service: "jenkins",
      environment: "legacy",
      requested_scope: "admin",
    },
  },
];

export const mockupSecrets: MockupSecret[] = [
  {
    id: "sec-aws-deploy",
    name: "AWS Deploy Key",
    service: "aws",
    environment: "prod",
    owner: "Platform",
    updatedAt: "2026-03-19T21:40:00.000Z",
    revealedValue: "AKIA...F5M0 / wJalrXUtnFEMI/K7MDENG+bPxRfiCY",
    metadata: {
      service: "aws",
      environment: "prod",
      rotation: "30d",
      owner: "platform",
    },
    leaseCount: 3,
    activeAgents: ["ci-prod", "release-bot", "observability-sync"],
    note: "Primary deploy credential used for application rollout.",
  },
  {
    id: "sec-gcp-billing",
    name: "GCP Billing Token",
    service: "gcp",
    environment: "prod",
    owner: "Finance Ops",
    updatedAt: "2026-03-18T07:12:00.000Z",
    revealedValue:
      '{ "type": "service_account", "project_id": "billing-prod" }',
    metadata: {
      service: "gcp",
      environment: "prod",
      team: "finance",
      rotation: "quarterly",
    },
    leaseCount: 1,
    activeAgents: ["finance-sync"],
    note: "Scoped to billing export workflow only.",
  },
  {
    id: "sec-gh-release",
    name: "GitHub Release Token",
    service: "github",
    environment: "prod",
    owner: "Release Engineering",
    updatedAt: "2026-03-17T11:30:00.000Z",
    revealedValue: "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    metadata: {
      service: "github",
      repository: "agentpassvault/frontend",
      environment: "prod",
    },
    leaseCount: 2,
    activeAgents: ["release-bot", "ci-prod"],
    note: "Token is restricted to package publication and release tagging.",
  },
];

export const mockupAgents: MockupAgent[] = [
  {
    id: "agent-ci-prod",
    name: "ci-prod",
    displayName: "Production deployment runner",
    environment: "prod",
    publicKeyState: "RSA-OAEP-4096 key present",
    keyFingerprint: "1F:E8:97:3A:92:11",
    lastActivityAt: "2026-03-20T10:48:00.000Z",
    activeLeases: 3,
    linkedSecrets: ["AWS Deploy Key", "GitHub Release Token"],
    note: "Primary deployment worker for release automation.",
    risk: "stable",
  },
  {
    id: "agent-finance-sync",
    name: "finance-sync",
    displayName: "Finance export scheduler",
    environment: "prod",
    publicKeyState: "Key present, lease expired",
    keyFingerprint: "92:41:3B:B4:18:0C",
    lastActivityAt: "2026-03-20T09:16:00.000Z",
    activeLeases: 0,
    linkedSecrets: ["GCP Billing Token"],
    note: "Runs once a day and is currently blocked on lease renewal.",
    risk: "attention",
  },
  {
    id: "agent-release-bot",
    name: "release-bot",
    displayName: "Release publication bot",
    environment: "prod",
    publicKeyState: "RSA-OAEP-4096 key present",
    keyFingerprint: "11:7D:F0:43:AA:C1",
    lastActivityAt: "2026-03-19T14:10:00.000Z",
    activeLeases: 1,
    linkedSecrets: ["GitHub Release Token"],
    note: "Publishes tagged releases and package artifacts.",
    risk: "stable",
  },
];

export const mockupAuditEvents: MockupAuditEvent[] = [
  {
    id: "audit-001",
    at: "2026-03-20T10:49:00.000Z",
    actor: "alex@tenant",
    action: "Fulfilled request",
    target: "AWS Production Credentials",
    domain: "Requests",
    outcome: "success",
    detail: "Created a new secret and attached it to request req-aws-prod.",
  },
  {
    id: "audit-002",
    at: "2026-03-20T09:17:00.000Z",
    actor: "finance-sync",
    action: "Lease expired",
    target: "GCP Billing Token",
    domain: "Secrets",
    outcome: "warning",
    detail: "Agent attempted access after the previous lease window ended.",
  },
  {
    id: "audit-003",
    at: "2026-03-19T14:08:00.000Z",
    actor: "maya@tenant",
    action: "Reissued lease",
    target: "GitHub Release Token",
    domain: "Requests",
    outcome: "success",
    detail:
      "Approved a lease refresh for release-bot after confirming repository scope.",
  },
  {
    id: "audit-004",
    at: "2026-03-18T17:20:00.000Z",
    actor: "daria@tenant",
    action: "Rejected request",
    target: "Legacy Jenkins Admin",
    domain: "Requests",
    outcome: "danger",
    detail: "Rejected due to privilege request exceeding migration policy.",
  },
  {
    id: "audit-005",
    at: "2026-03-18T08:02:00.000Z",
    actor: "system",
    action: "Registered agent key",
    target: "finance-sync",
    domain: "Agents",
    outcome: "neutral",
    detail: "Stored a replacement public key after scheduler redeploy.",
  },
];
