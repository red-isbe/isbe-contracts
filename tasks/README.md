# Tasks Index

This directory contains all task-related functionality for the ISBE contracts project, now organized with a unified index pattern similar to the `config` directory.

## Usage

### Import from the index

```typescript
import { DeploymentOrchestrator, DeploymentConfig, logger } from './tasks'

// Get deployment configuration
const config = DeploymentConfig.getDefaultConfig()

// Create orchestrator
const orchestrator = new DeploymentOrchestrator(hre, config)

// Use debug-aware logging
logger.info('Starting deployment...')
```

### Quick access utilities

```typescript
import { tasks, deployment } from './tasks'

// Quick access to common functionality
const orchestrator = tasks.createOrchestrator(hre)
const config = tasks.getDefaultConfig()
const signatureProvider = tasks.createSignatureProvider(hre)

// Organized access to deployment utilities
const cleanOrchestrator = deployment.orchestrator.createClean(hre)
const constants = deployment.config.constants
```

### Task execution

Run Hardhat tasks directly from the command line:

```bash
# Example task execution
npx hardhat deployAll --precommit
npx hardhat grantRole --role "0x..." --account "0x..." --diamond "0x..."
npx hardhat diamondCut --facet-addresses '["0x..."]' --actions '[1]'
```

## Organization

### Core Exports

- **DeploymentOrchestrator**: Main deployment orchestration
- **DeploymentConfig**: Configuration management
- **PreCommitValidator**: Validation utilities
- **SignatureProviderFactory**: Signature provider creation

### Organized Access

- **`tasks`**: Quick access functions for common operations
- **`deployment`**: Organized deployment utilities and helpers
- **`dev`**: Development and debugging utilities

### Task Categories

The index provides documentation for all Hardhat tasks organized by category:

- **access**: Access control tasks (grantRole, revokeRole, etc.)
- **businessLogic**: Business logic deployment and management
- **configMgmt**: Configuration and facet management
- **diamond**: Diamond proxy pattern operations
- **pause**: Contract pause/unpause operations
- **proxyFactory**: Proxy factory deployment
- **secp256r1**: Secp256r1 curve specific tasks
- **validation**: Contract validation and verification
- **examples**: Example implementations

## Pattern Consistency

This index follows the same organizational pattern as `config/index.ts`:

1. **Centralized exports**: All related functionality in one place
2. **Type safety**: Full TypeScript support with proper type exports
3. **Convenience functions**: Quick access utilities for common operations
4. **Documentation**: JSDoc examples and usage patterns
5. **Development utilities**: Helper functions for testing and debugging

## Integration with Hardhat Config

The tasks are now registered through a consolidated approach in `hardhat.config.ts`:

```typescript
// In hardhat.config.ts - Single import replaces 50+ individual imports
import './tasks/register'

// Task utilities available when needed:
// import { DeploymentOrchestrator, DeploymentConfig, tasks } from './tasks'
```

This provides:

- **Simplified imports**: Single task registration import instead of 50+ individual imports
- **Clean configuration**: Reduced hardhat.config.ts complexity
- **Easy maintenance**: All task registrations managed in one place

## Benefits

- **Single import point**: Import all task functionality from one location
- **Organized structure**: Clear categorization of different task types
- **Type safety**: Full TypeScript support with proper type definitions
- **Discoverability**: Easy to find and use task functionality
- **Consistency**: Matches the pattern established by the config index
- **Development integration**: Built into hardhat.config.ts for enhanced debugging
