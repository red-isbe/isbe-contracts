# ISBE Configuration

This directory contains the unified configuration system for ISBE contracts, designed to be simple, maintainable, and **completely silent by default**.

## 🔇 Silent by Default

The configuration system produces **no output** during normal operation. This means:

- **Clean builds**: No configuration noise cluttering your output
- **Quiet scripts**: Your hardhat commands run silently unless there's an actual error
- **Debug when needed**: Enable `DEBUG=true` to see detailed configuration information when troubleshooting

```bash
# Silent operation (default)
npx hardhat compile

# Verbose debug output when needed
DEBUG=true npx hardhat compile
```

## Network Configuration

### Unified Networks (`networks.ts`)

All network configurations are now centralized in `config/networks.ts`. This file provides:

- **Clear structure**: All networks defined in one readable file
- **Environment variable support**: URLs can be overridden via environment variables
- **Type safety**: Full TypeScript type checking
- **Easy maintenance**: Add/modify networks in a single location

#### Available Networks:

- **hardhat**: Local Hardhat network for development
- **localhost**: Local test network (secp256k1)
- **mvp**: ISBE MVP Network (secp256k1)
- **arsys**: ISBE Arsys Network (secp256k1)
- **kepler**: Kepler Network (secp256k1)
- **customR1Network**: Custom secp256r1 network

#### Environment Variables:

You can override network URLs using environment variables:

```bash
export LOCALHOST_URL="http://your-local-node:8545"
export MVP_URL="https://your-mvp-endpoint.com"
export ARSYS_URL="http://your-arsys-node:8545"
export KEPLER_URL="https://your-kepler-endpoint.com"
export CUSTOM_R1_URL="http://your-r1-node:8545"
```

### Usage

🆕 **Unified Configuration Index**: All configuration functionality is now available through a single import:

```typescript
// Import everything from the unified index
import { getNetworkConfigs, ConfigManager, logger, config } from './config'

// Get all network configurations
const networks = getNetworkConfigs()

// Use the configuration manager
const manager = ConfigManager.getInstance()

// Quick access via config object
const accounts = config.accounts()
const summary = config.summary()
```

#### Alternative Imports

```typescript
// Import specific modules directly (still supported)
import { getNetworkConfigs, getNetworkSummary } from './config/networks'
import { AccountManager } from './config/AccountManager'
import { logger } from './utils/logger'

// Use default export for everything
import config from './config'
const networks = config.getNetworkConfigs()
const accounts = config.accounts()
```

### Legacy Compatibility

The old `NetworkConfig.ts` file is still available for backward compatibility but is deprecated. It redirects to the new unified configuration. New code should import directly from `networks.ts`.

## Development Utilities

🆕 **New Development Helpers**: The unified index includes utilities for development and testing:

### Quick Configuration Access

```typescript
import { config, dev, env } from './config'

// Quick access to common functions
const manager = config.manager() // ConfigManager.getInstance()
const networks = config.networks() // getNetworkConfigs()
const accounts = config.accounts() // AccountManager.getAccounts()
const isDebug = config.isDebug() // Check if debug mode is enabled
const environment = config.environment() // getCurrentEnvironment()
```

### Development Utilities

```typescript
import { dev } from './config'

// For testing - enable/disable debug mode
dev.enableDebug() // Sets DEBUG=true programmatically
dev.disableDebug() // Removes DEBUG env var
dev.suppressLogging() // Silence all logging for tests

// Safe configuration validation
const validation = dev.validateConfig()
if (!validation.isValid) {
    console.error('Config issues:', validation.errors)
}
```

### Environment Variable Helpers

```typescript
import { env } from './config'

// Check what network overrides are active
const overrides = env.getNetworkOverrides()
console.log('Network overrides:', overrides)

// Check if any overrides are set
if (env.hasNetworkOverrides()) {
    console.log('Using custom network URLs')
}

// Get debug configuration
const debugInfo = env.getDebugConfig()
console.log('Debug config:', debugInfo)
```

## Debug-Aware Logging

### Logger Utility (`utils/logger.ts`)

The logging system now respects debug settings and environment context:

- **Normal mode**: Completely silent output
- **Debug mode**: Detailed configuration information
- **Test mode**: Suppressed output to avoid cluttering test results

#### Enable Debug Mode:

```bash
# Enable debug logging
export DEBUG=true
# or
export DEBUG=1
# or set NODE_ENV to development
export NODE_ENV=development
```

#### Logger Methods:

```typescript
import { logger } from '../utils/logger'

logger.error(...)    // Only in debug mode
logger.warn(...)     // Only in debug mode
logger.info(...)     // Only in debug mode
logger.debug(...)    // Only in debug mode
logger.config(...)   // Only in debug mode
logger.success(...)  // Only in debug mode
logger.summary(...)  // Only in debug mode
```

## Configuration Manager

### Simplified ConfigManager

The `ConfigManager` has been simplified and no longer handles network configurations directly. It now focuses on:

- Account management
- Environment settings
- Deployment configuration
- Testing configuration

Network configurations are handled by the unified `networks.ts` file.

## Migration Guide

### From Old Configuration

**Before (obfuscated across multiple files):**

```typescript
// Old way - scattered configurations
const networkManager = new NetworkConfigManager()
const configs = networkManager.getNetworkConfigs()
```

**After (unified and clear):**

```typescript
// New way - direct import from unified config
import { getNetworkConfigs } from './config/networks'
const configs = getNetworkConfigs()
```

### Adding New Networks

To add a new network, simply edit `config/networks.ts`:

```typescript
// Add to the return object in getNetworkConfigs()
myNewNetwork: {
    url: process.env.MY_NEW_NETWORK_URL || 'https://default-url.com',
    chainId: 12345,
    accounts,
    gasPrice: 0,
    gas: 100000000,
    blockGasLimit: 30000000,
    curve: 'secp256k1',
} as NetworkConfigWithCurve,
```

## Example Usage

📄 **Complete Example**: See `examples/config-usage.ts` for a comprehensive demonstration of all features.

```bash
# Run the example (silent mode)
npx ts-node examples/config-usage.ts

# Run with debug output
DEBUG=true npx ts-node examples/config-usage.ts
```

### Basic Usage Examples

```typescript
// Method 1: Direct imports for specific needs
import { getNetworkConfigs, ConfigManager, logger } from './config'
const networks = getNetworkConfigs()
const manager = ConfigManager.getInstance()

// Method 2: Quick access object for common operations
import { config } from './config'
const accounts = config.accounts()
const summary = config.summary()
const isDebug = config.isDebug()

// Method 3: Default import for everything
import config from './config'
const networks = config.getNetworkConfigs()
const accounts = config.accounts()

// Method 4: Development utilities
import { dev, env } from './config'
const validation = dev.validateConfig()
const hasOverrides = env.hasNetworkOverrides()
```

## Benefits of Unified Configuration

1. **Clarity**: All network settings in one place
2. **Maintainability**: Easy to find and modify configurations
3. **Silent by Default**: No noise in normal operation, detailed output only when debugging
4. **Environment Flexibility**: Override settings via environment variables
5. **Type Safety**: Full TypeScript support
6. **Backward Compatibility**: Existing code continues to work

## Environment Variables Summary

| Variable        | Default                                                  | Description                                  |
| --------------- | -------------------------------------------------------- | -------------------------------------------- |
| `DEBUG`         | `false`                                                  | Enable detailed debug logging                |
| `NODE_ENV`      | `development`                                            | Environment mode (development enables debug) |
| `LOCALHOST_URL` | `http://172.16.240.30:8545`                              | Local network URL                            |
| `MVP_URL`       | `https://besu-node-non-validator-1.mvp.envs.redisbe.com` | MVP network URL                              |
| `ARSYS_URL`     | `http://213.165.85.41:8545`                              | Arsys network URL                            |
| `KEPLER_URL`    | `https://regular.pre.iosec.io.builders:8565`             | Kepler network URL                           |
| `CUSTOM_R1_URL` | `http://172.16.240.30:8545`                              | Custom R1 network URL                        |
