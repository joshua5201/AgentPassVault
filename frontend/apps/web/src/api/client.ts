import {
  type CreateLeaseRequest,
  type CreateSecretRequest,
  type LoginResponse,
  type RequestResponse,
  type SecretMetadataResponse,
  type UpdateRequestRequest,
  type UserLoginRequest,
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

  constructor(baseUrl: string = readAppEnv().apiUrl) {
    this.client = new VaultClient(baseUrl);
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

  async login(input: UserLoginRequest): Promise<ApiResult<LoginResponse>> {
    return this.safeCall(() => this.client.userLogin(input));
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
    return this.safeCall(() => this.client.createSecret(payload, idempotencyKey));
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
