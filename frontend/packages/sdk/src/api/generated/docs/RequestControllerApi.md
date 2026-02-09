# RequestControllerApi

All URIs are relative to *http://localhost:8080*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**abandonRequest**](RequestControllerApi.md#abandonrequest) | **DELETE** /api/v1/requests/{id} |  |
| [**createRequest**](RequestControllerApi.md#createrequestoperation) | **POST** /api/v1/requests |  |
| [**getRequest**](RequestControllerApi.md#getrequest) | **GET** /api/v1/requests/{id} |  |
| [**listRequests**](RequestControllerApi.md#listrequests) | **GET** /api/v1/requests |  |
| [**updateRequest**](RequestControllerApi.md#updaterequestoperation) | **PATCH** /api/v1/requests/{id} |  |



## abandonRequest

> abandonRequest(id)



### Example

```ts
import {
  Configuration,
  RequestControllerApi,
} from '';
import type { AbandonRequestRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new RequestControllerApi(config);

  const body = {
    // number
    id: 789,
  } satisfies AbandonRequestRequest;

  try {
    const data = await api.abandonRequest(body);
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
| **id** | `number` |  | [Defaults to `undefined`] |

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


## createRequest

> RequestResponse createRequest(createRequestRequest)



### Example

```ts
import {
  Configuration,
  RequestControllerApi,
} from '';
import type { CreateRequestOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new RequestControllerApi(config);

  const body = {
    // CreateRequestRequest
    createRequestRequest: ...,
  } satisfies CreateRequestOperationRequest;

  try {
    const data = await api.createRequest(body);
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
| **createRequestRequest** | [CreateRequestRequest](CreateRequestRequest.md) |  | |

### Return type

[**RequestResponse**](RequestResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getRequest

> RequestResponse getRequest(id)



### Example

```ts
import {
  Configuration,
  RequestControllerApi,
} from '';
import type { GetRequestRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new RequestControllerApi(config);

  const body = {
    // number
    id: 789,
  } satisfies GetRequestRequest;

  try {
    const data = await api.getRequest(body);
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
| **id** | `number` |  | [Defaults to `undefined`] |

### Return type

[**RequestResponse**](RequestResponse.md)

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


## listRequests

> Array&lt;RequestResponse&gt; listRequests()



### Example

```ts
import {
  Configuration,
  RequestControllerApi,
} from '';
import type { ListRequestsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new RequestControllerApi(config);

  try {
    const data = await api.listRequests();
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

[**Array&lt;RequestResponse&gt;**](RequestResponse.md)

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


## updateRequest

> RequestResponse updateRequest(id, updateRequestRequest)



### Example

```ts
import {
  Configuration,
  RequestControllerApi,
} from '';
import type { UpdateRequestOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new RequestControllerApi(config);

  const body = {
    // number
    id: 789,
    // UpdateRequestRequest
    updateRequestRequest: ...,
  } satisfies UpdateRequestOperationRequest;

  try {
    const data = await api.updateRequest(body);
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
| **id** | `number` |  | [Defaults to `undefined`] |
| **updateRequestRequest** | [UpdateRequestRequest](UpdateRequestRequest.md) |  | |

### Return type

[**RequestResponse**](RequestResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

