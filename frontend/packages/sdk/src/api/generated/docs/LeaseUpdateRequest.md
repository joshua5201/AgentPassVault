# LeaseUpdateRequest

## Properties

| Name            | Type   |
| --------------- | ------ |
| `agentId`       | string |
| `publicKey`     | string |
| `encryptedData` | string |

## Example

```typescript
import type { LeaseUpdateRequest } from "";

// TODO: Update the object below with actual values
const example = {
  agentId: null,
  publicKey: null,
  encryptedData: null,
} satisfies LeaseUpdateRequest;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as LeaseUpdateRequest;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
