export type Metadata = Record<string, string>;

export interface Secret {
  id: string;
  tenantId: string;
  name: string;
  encryptedValue: string; // Master Key encrypted
  metadata: Metadata;
  createdAt: string;
  updatedAt: string;
}

export interface LeasedSecret {
  id: string;
  secretId: string;
  agentId: string;
  encryptedValue: string; // Agent Public Key encrypted
  expiresAt: string | null;
  createdAt: string;
}

export enum RequestStatus {
  PENDING = 'pending',
  FULFILLED = 'fulfilled',
  REJECTED = 'rejected',
  ABANDONED = 'abandoned',
}

export enum RequestType {
  CREATE = 'CREATE',
  LEASE = 'LEASE',
}

export interface SecretRequest {
  id: string;
  tenantId: string;
  agentId: string;
  status: RequestStatus;
  name?: string;
  context?: string;
  requiredMetadata?: Metadata;
  requiredFields?: string[];
  secretId?: string; // Linked secret if fulfilled
  fulfillmentUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  tenantId: string;
  name: string;
  publicKey?: string;
  createdAt: string;
  updatedAt: string;
}
