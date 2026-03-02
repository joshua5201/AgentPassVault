import { describe, expect, it } from "vitest";
import { toSecretListItemViewModel } from "./secret-view-model";

describe("toSecretListItemViewModel", () => {
  it("maps ISO string timestamps from JSON responses", () => {
    const mapped = toSecretListItemViewModel(
      {
        secretId: "sec-123",
        name: "Prod DB",
        createdAt: "2026-03-01T10:20:30.000Z",
      } as never,
      0,
    );

    expect(mapped).toEqual({
      id: "sec-123",
      name: "Prod DB",
      updatedAt: "2026-03-01",
    });
  });
});
