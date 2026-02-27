import { z } from "zod";
import { validateRequestContextSize } from "../domain/size-utils";

export const createRequestSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(255, "Name must be <= 255 chars"),
    type: z.enum(["CREATE", "LEASE"]),
    context: z.string().optional(),
    requiredMetadata: z.record(z.unknown()).optional(),
    requiredFieldsInSecretValue: z.array(z.string()).optional(),
    secretId: z.string().optional(),
  })
  .superRefine((value, context) => {
    const contextError = validateRequestContextSize(value.context);
    if (contextError) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: contextError,
        path: ["context"],
      });
    }
  });

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
