# LeaseControllerApi

All URIs are relative to *http://localhost:8080*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createLease**](LeaseControllerApi.md#createleaseoperation) | **POST** /api/v1/secrets/{secretId}/leases |  |
| [**listLeases**](LeaseControllerApi.md#listleases) | **GET** /api/v1/secrets/{secretId}/leases |  |
| [**revokeLease**](LeaseControllerApi.md#revokelease) | **DELETE** /api/v1/secrets/{secretId}/leases/{agentId} |  |



## createLease

> createLease(secretId, createLeaseRequest)



### Example

```ts
import {
  Configuration,
  LeaseControllerApi,
} from '';
import type { CreateLeaseOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new LeaseControllerApi(config);

  const body = {
    // number
    secretId: 789,
    // CreateLeaseRequest
    createLeaseRequest: ...,
  } satisfies CreateLeaseOperationRequest;

  try {
    const data = await api.createLease(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **secretId** | `number` |  | [Defaults to `undefined`] |
| **createLeaseRequest** | [CreateLeaseRequest](CreateLeaseRequest.md) |  | |

### Return type

`void` (Empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listLeases

> Array&lt;LeaseResponse&gt; listLeases(secretId, agentId)



### Example

```ts
import {
  Configuration,
  LeaseControllerApi,
} from '';
import type { ListLeasesRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new LeaseControllerApi(config);

  const body = {
    // number
    secretId: 789,
    // number (optional)
    agentId: 789,
  } satisfies ListLeasesRequest;

  try {
    const data = await api.listLeases(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **secretId** | `number` |  | [Defaults to `undefined`] |
| **agentId** | `number` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**Array&lt;LeaseResponse&gt;**](LeaseResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## revokeLease

> revokeLease(secretId, agentId)



### Example

```ts
import {
  Configuration,
  LeaseControllerApi,
} from '';
import type { RevokeLeaseRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new LeaseControllerApi(config);

  const body = {
    // number
    secretId: 789,
    // number
    agentId: 789,
  } satisfies RevokeLeaseRequest;

  try {
    const data = await api.revokeLease(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **secretId** | `number` |  | [Defaults to `undefined`] |
| **agentId** | `number` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

