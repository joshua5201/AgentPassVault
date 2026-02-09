
# RequestResponse


## Properties

Name | Type
------------ | -------------
`requestId` | string
`agentId` | string
`status` | string
`type` | string
`name` | string
`context` | string
`requiredMetadata` | { [key: string]: object; }
`requiredFieldsInSecretValue` | Array&lt;string&gt;
`mappedSecretId` | string
`rejectionReason` | string
`fulfillmentUrl` | string
`createdAt` | Date
`updatedAt` | Date

## Example

```typescript
import type { RequestResponse } from ''

// TODO: Update the object below with actual values
const example = {
  "requestId": null,
  "agentId": null,
  "status": null,
  "type": null,
  "name": null,
  "context": null,
  "requiredMetadata": null,
  "requiredFieldsInSecretValue": null,
  "mappedSecretId": null,
  "rejectionReason": null,
  "fulfillmentUrl": null,
  "createdAt": null,
  "updatedAt": null,
} satisfies RequestResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as RequestResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


