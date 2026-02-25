
# AgentResponse


## Properties

Name | Type
------------ | -------------
`agentId` | string
`name` | string
`displayName` | string
`publicKey` | string
`createdAt` | Date

## Example

```typescript
import type { AgentResponse } from ''

// TODO: Update the object below with actual values
const example = {
  "agentId": null,
  "name": null,
  "displayName": null,
  "publicKey": null,
  "createdAt": null,
} satisfies AgentResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AgentResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


