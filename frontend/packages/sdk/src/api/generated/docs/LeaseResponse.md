
# LeaseResponse


## Properties

Name | Type
------------ | -------------
`id` | string
`agentId` | string
`agentName` | string
`publicKey` | string
`encryptedData` | string
`expiry` | Date
`createdAt` | Date
`updatedAt` | Date

## Example

```typescript
import type { LeaseResponse } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "agentId": null,
  "agentName": null,
  "publicKey": null,
  "encryptedData": null,
  "expiry": null,
  "createdAt": null,
  "updatedAt": null,
} satisfies LeaseResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as LeaseResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


