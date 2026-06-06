import { type DeploymentProvider } from "./types.js";
import { FakeProvider } from "./fake.js";

export class ProviderRegistry {
  private static providers = new Map<string, DeploymentProvider>();

  static register(provider: DeploymentProvider): void {
    const existing = this.providers.get(provider.name);
    if (existing) {
      if (existing === provider) {
        return;
      }
      throw new Error(`Provider "${provider.name}" is already registered.`);
    }
    this.providers.set(provider.name, provider);
  }

  static get(name: string): DeploymentProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(
        `Provider "${name}" is not registered. Registered providers: ${Array.from(
          this.providers.keys(),
        ).join(", ")}`,
      );
    }
    return provider;
  }

  static list(): string[] {
    return Array.from(this.providers.keys());
  }

  static clear(): void {
    this.providers.clear();
  }
}

// Auto-register default FakeProvider
ProviderRegistry.register(new FakeProvider());
