# SecretMetadataResponse

## Properties

| Name        | Type                       |
| ----------- | -------------------------- |
| `secretId`  | string                     |
| `name`      | string                     |
| `metadata`  | { [key: string]: object; } |
| `createdAt` | Date                       |
| `updatedAt` | Date                       |

## Example

```typescript
import type { SecretMetadataResponse } from "";

// TODO: Update the object below with actual values
const example = {
  secretId: null,
  name: null,
  metadata: null,
  createdAt: null,
  updatedAt: null,
} satisfies SecretMetadataResponse;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SecretMetadataResponse;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
