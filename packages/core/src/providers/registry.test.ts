import { describe, it, expect, beforeEach } from "vitest";
import { ProviderRegistry } from "./registry.js";
import { type DeploymentProvider } from "./types.js";

const mockProvider: DeploymentProvider = {
  name: "mock-prov",
  deploy: async () => ({
    success: true,
    status: "CREATE_COMPLETE",
    runId: "123",
    deploymentName: "dep",
    durationMs: 10,
  }),
  destroy: async () => ({
    success: true,
    status: "DELETE_COMPLETE",
    runId: "123",
    deploymentName: "dep",
    durationMs: 5,
  }),
  getEvents: async () => [],
};

describe("ProviderRegistry", () => {
  beforeEach(() => {
    ProviderRegistry.clear();
  });

  it("should register and list providers successfully", () => {
    ProviderRegistry.register(mockProvider);
    expect(ProviderRegistry.list()).toContain("mock-prov");
    expect(ProviderRegistry.get("mock-prov")).toBe(mockProvider);
  });

  it("should throw when trying to register a provider with an existing name", () => {
    ProviderRegistry.register(mockProvider);
    expect(() => ProviderRegistry.register(mockProvider)).toThrow(
      'Provider "mock-prov" is already registered.',
    );
  });

  it("should throw when retrieving a non-registered provider", () => {
    expect(() => ProviderRegistry.get("non-existent")).toThrow(
      /Provider "non-existent" is not registered/i,
    );
  });
});
