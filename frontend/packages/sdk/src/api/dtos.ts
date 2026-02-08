import { RequestStatus, RequestType } from '../models';

export interface UserLoginRequest {
  username: string;
  password: string; // Login Hash
}

export interface TwoFactorLoginRequest {
  username: string;
  password: string; // Login Hash
  code: string;
}

export interface AgentLoginRequest {
  tenantId: string;
  appToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshTokenExpiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  username: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface TotpSetupResponse {
  secret: string;
  qrCodeUrl: string;
}

export interface TotpVerifyRequest {
  code: string;
  secret?: string;
}

export interface CreateSecretRequest {
  name: string;
  encryptedValue: string;
  metadata?: Record<string, any>;
}

export interface UpdateSecretRequest {
  name?: string;
  encryptedValue?: string;
  metadata?: Record<string, any>;
  updatedLeases?: LeaseUpdateRequest[];
}

export interface LeaseUpdateRequest {
  agentId: string;
  publicKey: string;
  encryptedData: string;
}

export interface SecretResponse {
  secretId: string;
  name: string;
  encryptedValue: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SecretMetadataResponse {
  secretId: string;
  name: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SearchSecretRequest {
  metadata: Record<string, any>;
}

export interface AgentResponse {
  agentId: string;
  name: string;
  displayName: string;
  publicKey: string;
  createdAt: string;
}

export interface AgentTokenResponse {
  agentId: string;
  appToken: string;
}

export interface CreateAgentRequest {
  name: string;
}

export interface RegisterAgentRequest {
  publicKey: string;
}

export interface CreateLeaseRequest {
  agentId: string;
  publicKey: string;
  encryptedData: string;
  expiry?: string;
}

export interface LeaseResponse {
  id: string;
  agentId: string;
  agentName: string;
  publicKey: string;
  encryptedData: string;
  expiry: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RequestResponse {
  requestId: string;
  status: RequestStatus;
  type: RequestType;
  name: string;
  context: string;
  requiredMetadata: Record<string, any>;
  requiredFieldsInSecretValue: string[];
  mappedSecretId?: string;
  rejectionReason?: string;
  fulfillmentUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRequestDTO {
  name: string;
  context?: string;
  requiredMetadata?: Record<string, any>;
  requiredFieldsInSecretValue?: string[];
  type: RequestType;
  secretId?: string;
}

export interface UpdateRequestDTO {
  status: RequestStatus;
  secretId?: string;
  rejectionReason?: string;
}
