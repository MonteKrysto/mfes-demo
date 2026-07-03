import { describe, expect, test } from "vitest";
import contract from "../contracts/frontend-backend.contract.json";
import { providerResponses } from "./app";

type Schema = {
  type: "array" | "object" | "number" | "string";
  required?: Record<string, Schema>;
  items?: Schema;
};

describe(`${contract.provider} provider contract`, () => {
  for (const interaction of contract.interactions) {
    test(interaction.description, () => {
      const body = providerResponses[interaction.request.path as keyof typeof providerResponses];

      expect(interaction.request.method).toBe("GET");
      expect(interaction.response.status).toBe(200);
      expect(body, `Missing provider response for ${interaction.request.path}`).toBeDefined();
      assertSchema(body, interaction.response.body as unknown as Schema, "$");
    });
  }
});

function assertSchema(value: unknown, schema: Schema, path: string) {
  if (schema.type === "array") {
    expect(Array.isArray(value), `${path} should be an array`).toBe(true);
    for (const [index, item] of (value as unknown[]).entries()) {
      assertSchema(item, schema.items as Schema, `${path}[${index}]`);
    }
    return;
  }

  if (schema.type === "object") {
    expect(value && typeof value === "object" && !Array.isArray(value), `${path} should be an object`).toBe(true);
    for (const [key, childSchema] of Object.entries(schema.required ?? {})) {
      const objectValue = value as Record<string, unknown>;
      expect(objectValue, `${path} should include ${key}`).toHaveProperty(key);
      assertSchema(objectValue[key], childSchema, `${path}.${key}`);
    }
    return;
  }

  expect(typeof value, `${path} should be a ${schema.type}`).toBe(schema.type);
}
