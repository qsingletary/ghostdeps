import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "modules/**/*.ts",
        "components/**/*.tsx",
        "hooks/**/*.ts",
        "stores/**/*.ts",
        "app/api/**/*.ts",
      ],
      exclude: [
        "**/index.ts",
        "**/*.d.ts",
        "**/interfaces/**",
        "**/types.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
});
