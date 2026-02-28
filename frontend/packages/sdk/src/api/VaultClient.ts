import {
  AgentLoginRequest,
  AgentResponse,
  AgentTokenResponse,
  ChangePasswordRequest,
  CreateAgentRequest,
  CreateLeaseRequest,
  CreateRequestRequest,
  CreateSecretRequest,
  ForgotPasswordRequest,
  LeaseResponse,
  LoginResponse,
  RefreshTokenRequest,
  RegisterAgentRequest,
  RegistrationRequest,
  RegistrationResponse,
  RequestResponse,
  ResetPasswordRequest,
  SearchSecretRequest,
  SecretDetailsResponse,
  SecretMetadataResponse,
  SecretResponse,
  TotpSetupResponse,
  TotpVerifyRequest,
  TwoFactorLoginRequest,
  UpdateRequestRequest,
  UpdateSecretRequest,
  UserLoginRequest,
} from "./generated/models";

export class VaultError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string,
    public serverStackTrace?: string,
  ) {
    super(message);
  }
}

export class VaultClient {
  private accessToken: string | null = null;

  constructor(private baseUrl: string) {}

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(
    path: string,
    method: string = "GET",
    body?: any,
    idempotencyKey?: string,
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new VaultError(
        response.status,
        errorData.message || response.statusText,
        errorData.code || errorData.message,
        errorData.stackTrace,
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text);
  }

  // Auth
  async register(request: RegistrationRequest): Promise<RegistrationResponse> {
    return this.request<RegistrationResponse>(
      "/api/v1/auth/register",
      "POST",
      request,
    );
  }

  async userLogin(request: UserLoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>(
      "/api/v1/auth/login/user",
      "POST",
      request,
    );
  }

  async userLoginWith2fa(
    request: TwoFactorLoginRequest,
  ): Promise<LoginResponse> {
    return this.request<LoginResponse>(
      "/api/v1/auth/login/user/2fa",
      "POST",
      request,
    );
  }

  async agentLogin(request: AgentLoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>(
      "/api/v1/auth/login/agent",
      "POST",
      request,
    );
  }

  async refresh(request: RefreshTokenRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>("/api/v1/auth/refresh", "POST", request);
  }

  async changePassword(request: ChangePasswordRequest): Promise<void> {
    await this.request<void>("/api/v1/auth/change-password", "POST", request);
  }

  async forgotPassword(
    request: ForgotPasswordRequest,
  ): Promise<{ resetToken: string }> {
    return this.request<{ resetToken: string }>(
      "/api/v1/auth/forgot-password",
      "POST",
      request,
    );
  }

  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    await this.request<void>("/api/v1/auth/reset-password", "POST", request);
  }

  // 2FA
  async getTotpSetup(): Promise<TotpSetupResponse> {
    return this.request<TotpSetupResponse>("/api/v1/auth/2fa/totp/setup");
  }

  async enableTotp(request: TotpVerifyRequest): Promise<void> {
    await this.request<void>("/api/v1/auth/2fa/totp/enable", "POST", request);
  }

  async disableTotp(): Promise<void> {
    await this.request<void>("/api/v1/auth/2fa/totp/disable", "POST");
  }

  // Secrets
  async createSecret(
    request: CreateSecretRequest,
    idempotencyKey?: string,
  ): Promise<SecretMetadataResponse> {
    return this.request<SecretMetadataResponse>(
      "/api/v1/secrets",
      "POST",
      request,
      idempotencyKey,
    );
  }

  async getSecret(id: string, leaseToken?: string): Promise<SecretResponse> {
    let path = `/api/v1/secrets/${id}`;
    if (leaseToken) {
      path += `?leaseToken=${encodeURIComponent(leaseToken)}`;
    }
    return this.request<SecretResponse>(path);
  }

  async updateSecret(
    id: string,
    request: UpdateSecretRequest,
    idempotencyKey?: string,
  ): Promise<SecretMetadataResponse> {
    return this.request<SecretMetadataResponse>(
      `/api/v1/secrets/${id}`,
      "PATCH",
      request,
      idempotencyKey,
    );
  }

  async deleteSecret(id: string): Promise<void> {
    await this.request<void>(`/api/v1/secrets/${id}`, "DELETE");
  }

  async searchSecrets(
    request: SearchSecretRequest,
  ): Promise<SecretMetadataResponse[]> {
    return this.request<SecretMetadataResponse[]>(
      "/api/v1/secrets/search",
      "POST",
      request,
    );
  }

  async listSecrets(): Promise<SecretDetailsResponse[]> {
    return this.request<SecretDetailsResponse[]>("/api/v1/secrets");
  }

  // Agents
  async listAgents(): Promise<AgentResponse[]> {
    return this.request<AgentResponse[]>("/api/v1/agents");
  }

  async getAgent(id: string): Promise<AgentResponse> {
    return this.request<AgentResponse>(`/api/v1/agents/${id}`);
  }

  async createAgent(
    request: CreateAgentRequest,
    idempotencyKey?: string,
  ): Promise<AgentTokenResponse> {
    return this.request<AgentTokenResponse>(
      "/api/v1/agents",
      "POST",
      request,
      idempotencyKey,
    );
  }

  async rotateAgentToken(
    id: string,
    idempotencyKey?: string,
  ): Promise<AgentTokenResponse> {
    return this.request<AgentTokenResponse>(
      `/api/v1/agents/${id}/rotate`,
      "POST",
      {},
      idempotencyKey,
    );
  }

  async deleteAgent(id: string): Promise<void> {
    await this.request<void>(`/api/v1/agents/${id}`, "DELETE");
  }

  async registerAgentPublicKey(
    id: string,
    request: RegisterAgentRequest,
  ): Promise<void> {
    await this.request<void>(`/api/v1/agents/${id}/register`, "POST", request);
  }

  // Tenants
  async deleteTenant(id: string): Promise<void> {
    await this.request<void>(`/api/v1/tenants/${id}`, "DELETE");
  }

  // Leases
  async listLeases(
    secretId: string,
    agentId?: string,
  ): Promise<LeaseResponse[]> {
    let path = `/api/v1/secrets/${secretId}/leases`;
    if (agentId) {
      path += `?agentId=${encodeURIComponent(agentId)}`;
    }
    return this.request<LeaseResponse[]>(path);
  }

  async createLease(
    secretId: string,
    request: CreateLeaseRequest,
    idempotencyKey?: string,
  ): Promise<void> {
    await this.request<void>(
      `/api/v1/secrets/${secretId}/leases`,
      "POST",
      request,
      idempotencyKey,
    );
  }

  async revokeLease(secretId: string, agentId: string): Promise<void> {
    await this.request<void>(
      `/api/v1/secrets/${secretId}/leases/${agentId}`,
      "DELETE",
    );
  }

  // Requests
  async createRequest(
    request: CreateRequestRequest,
    idempotencyKey?: string,
  ): Promise<RequestResponse> {
    return this.request<RequestResponse>(
      "/api/v1/requests",
      "POST",
      request,
      idempotencyKey,
    );
  }

  async getRequest(id: string): Promise<RequestResponse> {
    return this.request<RequestResponse>(`/api/v1/requests/${id}`);
  }

  async abandonRequest(id: string): Promise<void> {
    await this.request<void>(`/api/v1/requests/${id}`, "DELETE");
  }

  async listRequests(): Promise<RequestResponse[]> {
    return this.request<RequestResponse[]>("/api/v1/requests");
  }

  async updateRequest(
    id: string,
    request: UpdateRequestRequest,
    idempotencyKey?: string,
  ): Promise<RequestResponse> {
    return this.request<RequestResponse>(
      `/api/v1/requests/${id}`,
      "PATCH",
      request,
      idempotencyKey,
    );
  }
}
