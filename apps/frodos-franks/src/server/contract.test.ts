import { EventEmitter } from "node:events";
import { describe, expect, test } from "vitest";
import contract from "../contracts/frontend-backend.contract.json";
import { app } from "./app";

type Schema = {
  type: "array" | "object" | "number" | "string";
  required?: Record<string, Schema>;
  items?: Schema;
};

type ExpressHandler = {
  handle: (request: unknown, response: unknown, next: (error?: unknown) => void) => void;
};

describe(`${contract.provider} provider contract`, () => {
  for (const interaction of contract.interactions) {
    test(interaction.description, async () => {
      const response = await requestJson(interaction.request.path);

      expect(interaction.request.method).toBe("GET");
      expect(response.status).toBe(interaction.response.status);
      assertSchema(response.body, interaction.response.body as unknown as Schema, "$");
    });
  }
});

async function requestJson(path: string) {
  return new Promise<{ body: unknown; status: number }>((resolve, reject) => {
    const req = Object.assign(new EventEmitter(), {
      connection: {},
      headers: {},
      method: "GET",
      socket: {},
      url: path
    });
    const chunks: Buffer[] = [];
    const headers = new Map<string, string | number | readonly string[]>();
    const res = Object.assign(new EventEmitter(), {
      statusCode: 200,
      end(chunk?: string | Buffer) {
        if (chunk) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }

        const text = Buffer.concat(chunks).toString("utf8");
        resolve({
          status: this.statusCode,
          body: text ? JSON.parse(text) : null
        });
      },
      getHeader(name: string) {
        return headers.get(name.toLowerCase());
      },
      removeHeader(name: string) {
        headers.delete(name.toLowerCase());
      },
      setHeader(name: string, value: string | number | readonly string[]) {
        headers.set(name.toLowerCase(), value);
        return this;
      },
      write(chunk: string | Buffer) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        return true;
      },
      writeHead(statusCode: number) {
        this.statusCode = statusCode;
        return this;
      }
    });

    (app as unknown as ExpressHandler).handle(req, res, reject);
  });
}

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
