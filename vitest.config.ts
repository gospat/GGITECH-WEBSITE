import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Test configuration for the email layer.
 *
 * The suite runs in Node with no browser environment: everything under test is
 * server code. The `@/` alias mirrors `tsconfig.json` so test files import the
 * application exactly the way the application imports itself.
 *
 * No Resend credentials are read here. Every test that reaches the provider
 * mocks the SDK, so CI never sends a real email and never needs a real key.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    restoreMocks: true,
  },
});
