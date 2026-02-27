import { z } from "zod";
import { validateEncryptedValueSize, validateMetadataSize } from "../domain/size-utils";

const metadataSchema = z.record(z.unknown()).superRefine((value, context) => {
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== "object" || entry === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Metadata value for "${key}" must be a JSON object/array`,
      });
    }
  }
});

export const createSecretSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(255, "Name must be <= 255 chars"),
    encryptedValue: z.string().trim().min(1, "Encrypted value is required"),
    metadata: metadataSchema,
  })
  .superRefine((value, context) => {
    const encryptedValueError = validateEncryptedValueSize(value.encryptedValue);
    if (encryptedValueError) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: encryptedValueError,
        path: ["encryptedValue"],
      });
    }

    const metadataError = validateMetadataSize(value.metadata);
    if (metadataError) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: metadataError,
        path: ["metadata"],
      });
    }
  });

export type CreateSecretInput = z.infer<typeof createSecretSchema>;
