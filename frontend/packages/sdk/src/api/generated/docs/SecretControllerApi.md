# SecretControllerApi

All URIs are relative to _http://localhost:8080_

| Method                                                           | HTTP request                    | Description |
| ---------------------------------------------------------------- | ------------------------------- | ----------- |
| [**createSecret**](SecretControllerApi.md#createsecretoperation) | **POST** /api/v1/secrets        |             |
| [**deleteSecret**](SecretControllerApi.md#deletesecret)          | **DELETE** /api/v1/secrets/{id} |             |
| [**getSecret**](SecretControllerApi.md#getsecret)                | **GET** /api/v1/secrets/{id}    |             |
| [**searchSecrets**](SecretControllerApi.md#searchsecrets)        | **POST** /api/v1/secrets/search |             |
| [**updateSecret**](SecretControllerApi.md#updatesecretoperation) | **PATCH** /api/v1/secrets/{id}  |             |

## createSecret

> SecretMetadataResponse createSecret(createSecretRequest)

### Example

```ts
import {
  Configuration,
  SecretControllerApi,
} from '';
import type { CreateSecretOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new SecretControllerApi(config);

  const body = {
    // CreateSecretRequest
    createSecretRequest: ...,
  } satisfies CreateSecretOperationRequest;

  try {
    const data = await api.createSecret(body);
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
| **createSecretRequest** | [CreateSecretRequest](CreateSecretRequest.md) |             |       |

### Return type

[**SecretMetadataResponse**](SecretMetadataResponse.md)

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

## deleteSecret

> deleteSecret(id)

### Example

```ts
import { Configuration, SecretControllerApi } from "";
import type { DeleteSecretRequest } from "";

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new SecretControllerApi(config);

  const body = {
    // number
    id: 789,
  } satisfies DeleteSecretRequest;

  try {
    const data = await api.deleteSecret(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description | Notes                     |
| ------ | -------- | ----------- | ------------------------- |
| **id** | `number` |             | [Defaults to `undefined`] |

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

## getSecret

> SecretResponse getSecret(id, leaseToken)

### Example

```ts
import { Configuration, SecretControllerApi } from "";
import type { GetSecretRequest } from "";

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new SecretControllerApi(config);

  const body = {
    // number
    id: 789,
    // string (optional)
    leaseToken: leaseToken_example,
  } satisfies GetSecretRequest;

  try {
    const data = await api.getSecret(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name           | Type     | Description | Notes                                |
| -------------- | -------- | ----------- | ------------------------------------ |
| **id**         | `number` |             | [Defaults to `undefined`]            |
| **leaseToken** | `string` |             | [Optional] [Defaults to `undefined`] |

### Return type

[**SecretResponse**](SecretResponse.md)

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

## searchSecrets

> Array&lt;SecretMetadataResponse&gt; searchSecrets(searchSecretRequest)

### Example

```ts
import {
  Configuration,
  SecretControllerApi,
} from '';
import type { SearchSecretsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new SecretControllerApi(config);

  const body = {
    // SearchSecretRequest
    searchSecretRequest: ...,
  } satisfies SearchSecretsRequest;

  try {
    const data = await api.searchSecrets(body);
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
| **searchSecretRequest** | [SearchSecretRequest](SearchSecretRequest.md) |             |       |

### Return type

[**Array&lt;SecretMetadataResponse&gt;**](SecretMetadataResponse.md)

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

## updateSecret

> SecretMetadataResponse updateSecret(id, updateSecretRequest)

### Example

```ts
import {
  Configuration,
  SecretControllerApi,
} from '';
import type { UpdateSecretOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new SecretControllerApi(config);

  const body = {
    // number
    id: 789,
    // UpdateSecretRequest
    updateSecretRequest: ...,
  } satisfies UpdateSecretOperationRequest;

  try {
    const data = await api.updateSecret(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                    | Type                                          | Description | Notes                     |
| ----------------------- | --------------------------------------------- | ----------- | ------------------------- |
| **id**                  | `number`                                      |             | [Defaults to `undefined`] |
| **updateSecretRequest** | [UpdateSecretRequest](UpdateSecretRequest.md) |             |                           |

### Return type

[**SecretMetadataResponse**](SecretMetadataResponse.md)

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
