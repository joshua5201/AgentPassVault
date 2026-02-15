# AuthControllerApi

All URIs are relative to _http://localhost:8080_

| Method                                                             | HTTP request                           | Description |
| ------------------------------------------------------------------ | -------------------------------------- | ----------- |
| [**agentLogin**](AuthControllerApi.md#agentloginoperation)         | **POST** /api/v1/auth/login/agent      |             |
| [**changePassword**](AuthControllerApi.md#changepasswordoperation) | **POST** /api/v1/auth/change-password  |             |
| [**disableTotp**](AuthControllerApi.md#disabletotp)                | **POST** /api/v1/auth/2fa/totp/disable |             |
| [**enableTotp**](AuthControllerApi.md#enabletotp)                  | **POST** /api/v1/auth/2fa/totp/enable  |             |
| [**forgotPassword**](AuthControllerApi.md#forgotpasswordoperation) | **POST** /api/v1/auth/forgot-password  |             |
| [**getTotpSetup**](AuthControllerApi.md#gettotpsetup)              | **GET** /api/v1/auth/2fa/totp/setup    |             |
| [**ping**](AuthControllerApi.md#ping)                              | **GET** /api/v1/auth/ping              |             |
| [**refresh**](AuthControllerApi.md#refresh)                        | **POST** /api/v1/auth/refresh          |             |
| [**register**](AuthControllerApi.md#register)                      | **POST** /api/v1/auth/register         |             |
| [**resetPassword**](AuthControllerApi.md#resetpasswordoperation)   | **POST** /api/v1/auth/reset-password   |             |
| [**userLogin**](AuthControllerApi.md#userloginoperation)           | **POST** /api/v1/auth/login/user       |             |
| [**userLoginWith2fa**](AuthControllerApi.md#userloginwith2fa)      | **POST** /api/v1/auth/login/user/2fa   |             |

## agentLogin

> LoginResponse agentLogin(agentLoginRequest)

### Example

```ts
import {
  Configuration,
  AuthControllerApi,
} from '';
import type { AgentLoginOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuthControllerApi(config);

  const body = {
    // AgentLoginRequest
    agentLoginRequest: ...,
  } satisfies AgentLoginOperationRequest;

  try {
    const data = await api.agentLogin(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                  | Type                                      | Description | Notes |
| --------------------- | ----------------------------------------- | ----------- | ----- |
| **agentLoginRequest** | [AgentLoginRequest](AgentLoginRequest.md) |             |       |

### Return type

[**LoginResponse**](LoginResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `*/*`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## changePassword

> changePassword(changePasswordRequest)

### Example

```ts
import {
  Configuration,
  AuthControllerApi,
} from '';
import type { ChangePasswordOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuthControllerApi(config);

  const body = {
    // ChangePasswordRequest
    changePasswordRequest: ...,
  } satisfies ChangePasswordOperationRequest;

  try {
    const data = await api.changePassword(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                      | Type                                              | Description | Notes |
| ------------------------- | ------------------------------------------------- | ----------- | ----- |
| **changePasswordRequest** | [ChangePasswordRequest](ChangePasswordRequest.md) |             |       |

### Return type

`void` (Empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: Not defined

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## disableTotp

> disableTotp()

### Example

```ts
import { Configuration, AuthControllerApi } from "";
import type { DisableTotpRequest } from "";

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuthControllerApi(config);

  try {
    const data = await api.disableTotp();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

`void` (Empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## enableTotp

> enableTotp(totpVerifyRequest)

### Example

```ts
import {
  Configuration,
  AuthControllerApi,
} from '';
import type { EnableTotpRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuthControllerApi(config);

  const body = {
    // TotpVerifyRequest
    totpVerifyRequest: ...,
  } satisfies EnableTotpRequest;

  try {
    const data = await api.enableTotp(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                  | Type                                      | Description | Notes |
| --------------------- | ----------------------------------------- | ----------- | ----- |
| **totpVerifyRequest** | [TotpVerifyRequest](TotpVerifyRequest.md) |             |       |

### Return type

`void` (Empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: Not defined

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## forgotPassword

> { [key: string]: string; } forgotPassword(forgotPasswordRequest)

### Example

```ts
import {
  Configuration,
  AuthControllerApi,
} from '';
import type { ForgotPasswordOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuthControllerApi(config);

  const body = {
    // ForgotPasswordRequest
    forgotPasswordRequest: ...,
  } satisfies ForgotPasswordOperationRequest;

  try {
    const data = await api.forgotPassword(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                      | Type                                              | Description | Notes |
| ------------------------- | ------------------------------------------------- | ----------- | ----- |
| **forgotPasswordRequest** | [ForgotPasswordRequest](ForgotPasswordRequest.md) |             |       |

### Return type

**{ [key: string]: string; }**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `*/*`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## getTotpSetup

> TotpSetupResponse getTotpSetup()

### Example

```ts
import { Configuration, AuthControllerApi } from "";
import type { GetTotpSetupRequest } from "";

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuthControllerApi(config);

  try {
    const data = await api.getTotpSetup();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**TotpSetupResponse**](TotpSetupResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `*/*`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## ping

> { [key: string]: object; } ping()

### Example

```ts
import { Configuration, AuthControllerApi } from "";
import type { PingRequest } from "";

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuthControllerApi(config);

  try {
    const data = await api.ping();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

**{ [key: string]: object; }**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `*/*`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## refresh

> LoginResponse refresh(refreshTokenRequest)

### Example

```ts
import {
  Configuration,
  AuthControllerApi,
} from '';
import type { RefreshRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuthControllerApi(config);

  const body = {
    // RefreshTokenRequest
    refreshTokenRequest: ...,
  } satisfies RefreshRequest;

  try {
    const data = await api.refresh(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                    | Type                                          | Description | Notes |
| ----------------------- | --------------------------------------------- | ----------- | ----- |
| **refreshTokenRequest** | [RefreshTokenRequest](RefreshTokenRequest.md) |             |       |

### Return type

[**LoginResponse**](LoginResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `*/*`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## register

> RegistrationResponse register(registrationRequest)

### Example

```ts
import {
  Configuration,
  AuthControllerApi,
} from '';
import type { RegisterRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuthControllerApi(config);

  const body = {
    // RegistrationRequest
    registrationRequest: ...,
  } satisfies RegisterRequest;

  try {
    const data = await api.register(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                    | Type                                          | Description | Notes |
| ----------------------- | --------------------------------------------- | ----------- | ----- |
| **registrationRequest** | [RegistrationRequest](RegistrationRequest.md) |             |       |

### Return type

[**RegistrationResponse**](RegistrationResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `*/*`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## resetPassword

> resetPassword(resetPasswordRequest)

### Example

```ts
import {
  Configuration,
  AuthControllerApi,
} from '';
import type { ResetPasswordOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuthControllerApi(config);

  const body = {
    // ResetPasswordRequest
    resetPasswordRequest: ...,
  } satisfies ResetPasswordOperationRequest;

  try {
    const data = await api.resetPassword(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                     | Type                                            | Description | Notes |
| ------------------------ | ----------------------------------------------- | ----------- | ----- |
| **resetPasswordRequest** | [ResetPasswordRequest](ResetPasswordRequest.md) |             |       |

### Return type

`void` (Empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: Not defined

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## userLogin

> LoginResponse userLogin(userLoginRequest)

### Example

```ts
import {
  Configuration,
  AuthControllerApi,
} from '';
import type { UserLoginOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuthControllerApi(config);

  const body = {
    // UserLoginRequest
    userLoginRequest: ...,
  } satisfies UserLoginOperationRequest;

  try {
    const data = await api.userLogin(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                 | Type                                    | Description | Notes |
| -------------------- | --------------------------------------- | ----------- | ----- |
| **userLoginRequest** | [UserLoginRequest](UserLoginRequest.md) |             |       |

### Return type

[**LoginResponse**](LoginResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `*/*`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## userLoginWith2fa

> LoginResponse userLoginWith2fa(twoFactorLoginRequest)

### Example

```ts
import {
  Configuration,
  AuthControllerApi,
} from '';
import type { UserLoginWith2faRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuthControllerApi(config);

  const body = {
    // TwoFactorLoginRequest
    twoFactorLoginRequest: ...,
  } satisfies UserLoginWith2faRequest;

  try {
    const data = await api.userLoginWith2fa(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                      | Type                                              | Description | Notes |
| ------------------------- | ------------------------------------------------- | ----------- | ----- |
| **twoFactorLoginRequest** | [TwoFactorLoginRequest](TwoFactorLoginRequest.md) |             |       |

### Return type

[**LoginResponse**](LoginResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `*/*`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
