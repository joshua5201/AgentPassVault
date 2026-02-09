# AgentControllerApi

All URIs are relative to *http://localhost:8080*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createAgent**](AgentControllerApi.md#createagentoperation) | **POST** /api/v1/agents |  |
| [**deleteAgent**](AgentControllerApi.md#deleteagent) | **DELETE** /api/v1/agents/{id} |  |
| [**getAgent**](AgentControllerApi.md#getagent) | **GET** /api/v1/agents/{id} |  |
| [**listAgents**](AgentControllerApi.md#listagents) | **GET** /api/v1/agents |  |
| [**registerAgent**](AgentControllerApi.md#registeragentoperation) | **POST** /api/v1/agents/{id}/register |  |
| [**rotateToken**](AgentControllerApi.md#rotatetoken) | **POST** /api/v1/agents/{id}/rotate |  |



## createAgent

> AgentTokenResponse createAgent(createAgentRequest)



### Example

```ts
import {
  Configuration,
  AgentControllerApi,
} from '';
import type { CreateAgentOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AgentControllerApi(config);

  const body = {
    // CreateAgentRequest
    createAgentRequest: ...,
  } satisfies CreateAgentOperationRequest;

  try {
    const data = await api.createAgent(body);
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
| **createAgentRequest** | [CreateAgentRequest](CreateAgentRequest.md) |  | |

### Return type

[**AgentTokenResponse**](AgentTokenResponse.md)

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


## deleteAgent

> deleteAgent(id)



### Example

```ts
import {
  Configuration,
  AgentControllerApi,
} from '';
import type { DeleteAgentRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AgentControllerApi(config);

  const body = {
    // number
    id: 789,
  } satisfies DeleteAgentRequest;

  try {
    const data = await api.deleteAgent(body);
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


## getAgent

> AgentResponse getAgent(id)



### Example

```ts
import {
  Configuration,
  AgentControllerApi,
} from '';
import type { GetAgentRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AgentControllerApi(config);

  const body = {
    // number
    id: 789,
  } satisfies GetAgentRequest;

  try {
    const data = await api.getAgent(body);
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

[**AgentResponse**](AgentResponse.md)

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


## listAgents

> Array&lt;AgentResponse&gt; listAgents()



### Example

```ts
import {
  Configuration,
  AgentControllerApi,
} from '';
import type { ListAgentsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AgentControllerApi(config);

  try {
    const data = await api.listAgents();
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

[**Array&lt;AgentResponse&gt;**](AgentResponse.md)

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


## registerAgent

> registerAgent(id, registerAgentRequest)



### Example

```ts
import {
  Configuration,
  AgentControllerApi,
} from '';
import type { RegisterAgentOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AgentControllerApi(config);

  const body = {
    // number
    id: 789,
    // RegisterAgentRequest
    registerAgentRequest: ...,
  } satisfies RegisterAgentOperationRequest;

  try {
    const data = await api.registerAgent(body);
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
| **registerAgentRequest** | [RegisterAgentRequest](RegisterAgentRequest.md) |  | |

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


## rotateToken

> AgentTokenResponse rotateToken(id)



### Example

```ts
import {
  Configuration,
  AgentControllerApi,
} from '';
import type { RotateTokenRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AgentControllerApi(config);

  const body = {
    // number
    id: 789,
  } satisfies RotateTokenRequest;

  try {
    const data = await api.rotateToken(body);
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

[**AgentTokenResponse**](AgentTokenResponse.md)

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

