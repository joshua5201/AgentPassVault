# RegistrationRequest

## Properties

| Name          | Type   |
| ------------- | ------ |
| `username`    | string |
| `password`    | string |
| `displayName` | string |

## Example

```typescript
import type { RegistrationRequest } from "";

// TODO: Update the object below with actual values
const example = {
  username: null,
  password: null,
  displayName: null,
} satisfies RegistrationRequest;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as RegistrationRequest;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
