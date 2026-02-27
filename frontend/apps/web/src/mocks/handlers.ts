import { HttpResponse, http } from "msw";
import type {
  CreateLeaseRequest,
  CreateSecretRequest,
  RequestResponse,
  UpdateRequestRequest,
  UserLoginRequest,
} from "@agentpassvault/sdk";
import { mockAgents, mockRequests, mockSecrets } from "./data";

function maybeErrorFrom(request: Request): Response | null {
  const forcedError = request.headers.get("x-mock-error") ?? request.url.includes("mockError=")
    ? new URL(request.url).searchParams.get("mockError")
    : null;

  if (!forcedError) {
    return null;
  }

  const status = Number(forcedError);
  if (!Number.isFinite(status) || status < 400) {
    return HttpResponse.json({ message: "Invalid mock error code" }, { status: 422 });
  }

  return HttpResponse.json({ message: `Mocked error ${status}` }, { status });
}

export const handlers = [
  http.post("*/api/v1/auth/login/user", async ({ request }) => {
    const forcedError = maybeErrorFrom(request);
    if (forcedError) {
      return forcedError;
    }

    const body = (await request.json()) as UserLoginRequest;
    if (!body.username || !body.password) {
      return HttpResponse.json({ message: "username and password are required" }, { status: 422 });
    }

    return HttpResponse.json({
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      tokenType: "Bearer",
      expiresIn: 900,
      refreshTokenExpiresIn: 86400,
    });
  }),

  http.get("*/api/v1/requests", ({ request }) => {
    const forcedError = maybeErrorFrom(request);
    if (forcedError) {
      return forcedError;
    }

    return HttpResponse.json(mockRequests);
  }),

  http.get("*/api/v1/requests/:id", ({ params, request }) => {
    const forcedError = maybeErrorFrom(request);
    if (forcedError) {
      return forcedError;
    }

    const item = mockRequests.find((entry) => entry.requestId === params.id);
    if (!item) {
      return HttpResponse.json({ message: "Request not found" }, { status: 404 });
    }

    return HttpResponse.json(item);
  }),

  http.patch("*/api/v1/requests/:id", async ({ params, request }) => {
    const forcedError = maybeErrorFrom(request);
    if (forcedError) {
      return forcedError;
    }

    const payload = (await request.json()) as UpdateRequestRequest;
    const index = mockRequests.findIndex((entry) => entry.requestId === params.id);
    if (index < 0) {
      return HttpResponse.json({ message: "Request not found" }, { status: 404 });
    }

    const updated: RequestResponse = {
      ...mockRequests[index],
      ...payload,
      updatedAt: new Date(),
    };
    mockRequests[index] = updated;

    return HttpResponse.json(updated);
  }),

  http.get("*/api/v1/secrets", ({ request }) => {
    const forcedError = maybeErrorFrom(request);
    if (forcedError) {
      return forcedError;
    }

    return HttpResponse.json(mockSecrets);
  }),

  http.post("*/api/v1/secrets", async ({ request }) => {
    const forcedError = maybeErrorFrom(request);
    if (forcedError) {
      return forcedError;
    }

    const payload = (await request.json()) as CreateSecretRequest;
    if (!payload.name || !payload.encryptedValue) {
      return HttpResponse.json({ message: "name and encryptedValue are required" }, { status: 422 });
    }

    const created = {
      secretId: `sec-${String(mockSecrets.length + 1).padStart(3, "0")}`,
      name: payload.name,
      metadata: payload.metadata ?? {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockSecrets.unshift(created);

    return HttpResponse.json(created, { status: 201 });
  }),

  http.get("*/api/v1/agents", ({ request }) => {
    const forcedError = maybeErrorFrom(request);
    if (forcedError) {
      return forcedError;
    }

    return HttpResponse.json(mockAgents);
  }),

  http.post("*/api/v1/secrets/:secretId/leases", async ({ request, params }) => {
    const forcedError = maybeErrorFrom(request);
    if (forcedError) {
      return forcedError;
    }

    const payload = (await request.json()) as CreateLeaseRequest;
    if (!payload.agentId || !payload.encryptedData) {
      return HttpResponse.json({ message: "agentId and encryptedData are required" }, { status: 422 });
    }

    const secret = mockSecrets.find((item) => item.secretId === params.secretId);
    if (!secret) {
      return HttpResponse.json({ message: "Secret not found" }, { status: 404 });
    }

    return new HttpResponse(null, { status: 204 });
  }),
];
