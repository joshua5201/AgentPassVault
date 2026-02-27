import { z } from "zod";
import { validateMetadataSize } from "../domain/size-utils";

const metadataSchema = z.record(z.string());

export const createSecretSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(255, "Name must be <= 255 chars"),
    plaintextValue: z.string().trim().min(1, "Secret value is required"),
    metadata: metadataSchema,
  })
  .superRefine((value, context) => {
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
