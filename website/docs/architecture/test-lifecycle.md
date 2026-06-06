# Test Lifecycle

The lifecycle follows:
1. **Load**: Config is parsed and Zod schemas validate keys.
2. **Plan**: Expands tests, generates unique Run IDs, and compiles deployment targets.
3. **Resolve**: Replaces dynamic variables.
4. **Deploy**: Triggers provider deployment.
5. **Report**: Compiles results.
6. **Teardown**: Deletes stacks in reverse sequence.
