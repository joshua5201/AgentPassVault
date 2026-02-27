import {
  type CreateLeaseRequest,
  type CreateSecretRequest,
  type LoginResponse,
  type RequestResponse,
  type SecretMetadataResponse,
  type TwoFactorLoginRequest,
  type UpdateRequestRequest,
  type UserLoginRequest,
  type AgentResponse,
  VaultClient,
} from "@agentpassvault/sdk";
import { readAppEnv } from "../config/env";
import { createIdempotencyKey } from "./idempotency";
import { normalizeApiError, type AppApiError } from "./errors";

export type ApiResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: AppApiError;
    };

export class AppApiClient {
  private readonly client: VaultClient;
  private readonly apiClientFallbackEnabled: boolean;

  constructor(baseUrl: string = readAppEnv().apiUrl) {
    const env = readAppEnv();
    this.client = new VaultClient(baseUrl);
    this.apiClientFallbackEnabled = env.apiClientFallbackEnabled;
  }

  setAccessToken(token: string | null) {
    this.client.setAccessToken(token);
  }

  private async safeCall<T>(fn: () => Promise<T>): Promise<ApiResult<T>> {
    try {
      const data = await fn();
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: normalizeApiError(error) };
    }
  }

  private shouldUseMockFallback<T>(result: ApiResult<T>): result is { ok: false; error: AppApiError } {
    if (!this.apiClientFallbackEnabled || result.ok) {
      return false;
    }

    const message = result.error.message.toLowerCase();
    const likelyNetworkError =
      result.error.status >= 500 &&
      (message.includes("load failed") ||
        message.includes("failed to fetch") ||
        message.includes("networkerror") ||
        message.includes("network error"));

    return likelyNetworkError;
  }

  async login(input: UserLoginRequest): Promise<ApiResult<LoginResponse>> {
    const result = await this.safeCall(() => this.client.userLogin(input));
    if (!this.shouldUseMockFallback(result)) {
      return result;
    }

    if (!input.username || !input.password) {
      return {
        ok: false,
        error: {
          status: 422,
          message: "username and password are required",
        },
      };
    }

    return {
      ok: true,
      data: {
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        tokenType: "Bearer",
        expiresIn: 900,
        refreshTokenExpiresIn: 86400,
      },
    };
  }

  async loginWith2fa(input: TwoFactorLoginRequest): Promise<ApiResult<LoginResponse>> {
    return this.safeCall(() => this.client.userLoginWith2fa(input));
  }

  async listRequests(): Promise<ApiResult<RequestResponse[]>> {
    return this.safeCall(() => this.client.listRequests());
  }

  async getRequest(requestId: string): Promise<ApiResult<RequestResponse>> {
    return this.safeCall(() => this.client.getRequest(requestId));
  }

  async updateRequest(
    requestId: string,
    payload: UpdateRequestRequest,
    idempotencyKey: string = createIdempotencyKey(),
  ): Promise<ApiResult<RequestResponse>> {
    return this.safeCall(() => this.client.updateRequest(requestId, payload, idempotencyKey));
  }

  async createSecret(
    payload: CreateSecretRequest,
    idempotencyKey: string = createIdempotencyKey(),
  ): Promise<ApiResult<SecretMetadataResponse>> {
    const result = await this.safeCall(() => this.client.createSecret(payload, idempotencyKey));
    if (!this.shouldUseMockFallback(result)) {
      return result;
    }

    if (!payload.name || !payload.encryptedValue) {
      return {
        ok: false,
        error: {
          status: 422,
          message: "name and encryptedValue are required",
        },
      };
    }

    return {
      ok: true,
      data: {
        secretId: `sec-mock-${Date.now()}`,
        name: payload.name,
        metadata: payload.metadata ?? {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }

  async listSecrets(): Promise<ApiResult<SecretMetadataResponse[]>> {
    return this.safeCall(() => this.client.searchSecrets({}));
  }

  async listAgents(): Promise<ApiResult<AgentResponse[]>> {
    return this.safeCall(() => this.client.listAgents());
  }

  async createLease(
    secretId: string,
    payload: CreateLeaseRequest,
    idempotencyKey: string = createIdempotencyKey(),
  ): Promise<ApiResult<void>> {
    return this.safeCall(() => this.client.createLease(secretId, payload, idempotencyKey));
  }
}

export const appApiClient = new AppApiClient();
