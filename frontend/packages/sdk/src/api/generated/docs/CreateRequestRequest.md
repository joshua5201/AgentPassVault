
# CreateRequestRequest


## Properties

Name | Type
------------ | -------------
`name` | string
`context` | string
`requiredMetadata` | { [key: string]: object; }
`requiredFieldsInSecretValue` | Array&lt;string&gt;
`type` | string
`secretId` | string

## Example

```typescript
import type { CreateRequestRequest } from ''

// TODO: Update the object below with actual values
const example = {
  "name": null,
  "context": null,
  "requiredMetadata": null,
  "requiredFieldsInSecretValue": null,
  "type": null,
  "secretId": null,
} satisfies CreateRequestRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateRequestRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


