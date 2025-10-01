# Configuration Migration Guide

## 🚀 Overview

This guide helps developers migrate to the new unified configuration system introduced in ISBE contracts. The update provides a cleaner, more maintainable configuration with silent-by-default logging.

## 🆕 What's New

### Unified Network Configuration

**Before**: Networks were obfuscated across multiple files
**After**: All network configurations centralized in `config/networks.ts`

### Silent-by-Default Logging

**Before**: Verbose configuration output cluttered builds
**After**: Completely silent operation unless debug mode is enabled

### Environment Variable Support

**Before**: Fixed network URLs
**After**: Override any network URL via environment variables

## 🔄 Migration Steps

### For Existing Projects

1. **No Code Changes Required**: The migration is backward compatible
2. **Optional**: Update custom network references from `hardhat.config.ts` to `config/networks.ts`
3. **Optional**: Use environment variables to override network URLs

### For Custom Networks

**Old Way (still works):**

```typescript
// In hardhat.config.ts
myNetwork: {
    url: 'https://my-endpoint.com',
    chainId: 1234,
    accounts: accounts
}
```

**New Way (recommended):**

```typescript
// In config/networks.ts - add to getNetworkConfigs() return
myNetwork: {
    url: process.env.MY_NETWORK_URL || 'https://my-endpoint.com',
    chainId: 1234,
    accounts,
    gasPrice: 0,
    gas: 100000000,
    blockGasLimit: 30000000,
    curve: 'secp256k1',
} as NetworkConfigWithCurve,
```

## 📝 Updated Commands

### Silent Operation (Default)

All commands now run silently:

```bash
# Clean, quiet builds
npx hardhat compile
npx hardhat test
npx hardhat deployAll --network mvp

# No configuration noise in CI/CD pipelines
npm run test
npm run lint
npm run deploy
```

### Debug Mode (When Needed)

Enable detailed output for troubleshooting:

```bash
# See detailed configuration information
DEBUG=true npx hardhat compile

# Troubleshoot network connections
DEBUG=true npx hardhat deployAll --network mvp

# Debug secp256r1 operations
DEBUG=true npx hardhat deployAll --network customR1Network
```

## 🌐 Network Configuration Updates

### Current Networks

All networks are now defined in `config/networks.ts`:

| Network         | URL Override    | Default URL                                |
| --------------- | --------------- | ------------------------------------------ |
| hardhat         | N/A             | Local Hardhat                              |
| localhost       | `LOCALHOST_URL` | http://172.16.240.30:8545                  |
| mvp             | `MVP_URL`       | https://besu-node-non-validator-1.mvp...   |
| arsys           | `ARSYS_URL`     | http://213.165.85.41:8545                  |
| kepler          | `KEPLER_URL`    | https://regular.pre.iosec.io.builders:8565 |
| customR1Network | `CUSTOM_R1_URL` | http://172.16.240.30:8545                  |

### Environment Variable Usage

```bash
# Override network URLs
export MVP_URL="https://my-mvp-node.com"
export ARSYS_URL="https://my-arsys-node.com"

# Then deploy normally
npx hardhat deployAll --network mvp
```

## 🔍 Debugging and Troubleshooting

### Enable Debug Mode

```bash
# Method 1: Environment variable
export DEBUG=true
npx hardhat compile

# Method 2: Inline
DEBUG=true npx hardhat compile

# Method 3: For development
export NODE_ENV=development  # Enables debug automatically
```

### Debug Information Includes

When `DEBUG=true`:

- Configuration loading details
- Network validation results
- Account loading confirmations
- Detailed error messages
- Environment detection info
- Cryptographic operation details (for secp256r1)

### Common Debug Scenarios

```bash
# Debug network connection issues
DEBUG=true npx hardhat deployAll --network mvp

# Debug account configuration
DEBUG=true npx hardhat validate-accounts

# Debug secp256r1 operations
DEBUG=true npx hardhat show-secp256r1-accounts

# Debug custom network setup
DEBUG=true npx hardhat deployAll --network myCustomNetwork
```

## 📚 Documentation Updates

### Updated Files

- `README.md` - Added silent configuration section
- `docs/Production-Deployment-Guide.md` - Updated for silent deployment
- `docs/Development-guidelines.md` - Added configuration note
- `docs/SECP256R1_COMPLETE_GUIDE.md` - Updated with new config system

### New Files

- `config/networks.ts` - Unified network configurations
- `config/README.md` - Configuration system documentation
- `utils/logger.ts` - Debug-aware logging system
- `docs/Configuration-Migration-Guide.md` - This guide

## ✅ Verification

### Test the Migration

1. **Verify Silent Operation**:

    ```bash
    npx hardhat compile  # Should be quiet
    ```

2. **Test Debug Mode**:

    ```bash
    DEBUG=true npx hardhat compile  # Should show detailed info
    ```

3. **Validate Networks**:

    ```bash
    DEBUG=true npx hardhat validate-accounts
    ```

4. **Test Environment Overrides**:
    ```bash
    export LOCALHOST_URL="http://my-local-node:8545"
    DEBUG=true npx hardhat deployAll --network localhost
    ```

## 🚨 Breaking Changes

### None!

This migration is **100% backward compatible**:

- All existing commands work unchanged
- Existing network configurations still work
- No breaking changes to contract deployment
- All task scripts continue to function

### What Changed

- **Default behavior**: Silent operation (can be reverted with `DEBUG=true`)
- **Network location**: Centralized in `config/networks.ts` (old way still works)
- **Environment support**: New optional URL overrides

## 📞 Support

### If You Need Help

1. **Enable Debug Mode**: `DEBUG=true` provides detailed information
2. **Check Network Config**: Verify `config/networks.ts` has your networks
3. **Environment Variables**: Use `env | grep -i url` to check overrides
4. **Documentation**: Refer to updated documentation files

### Report Issues

If you encounter problems after migration:

1. Run the failing command with `DEBUG=true`
2. Check network connectivity
3. Verify account configuration
4. Review environment variables

## 🎯 Benefits After Migration

### For Developers

- **🔇 Cleaner Builds**: No configuration noise in output
- **🐛 Better Debugging**: Rich debug information when needed
- **🏠 Unified Config**: All networks in one clear location
- **🌍 Environment Flexibility**: Easy URL overrides

### For CI/CD

- **📈 Faster Logs**: Reduced log volume
- **🤖 Silent Scripts**: Clean automated builds
- **🔧 Easy Debugging**: Enable debug mode when tests fail
- **📊 Better Monitoring**: Focus on actual errors

### For Teams

- **📖 Clear Configuration**: Easy to understand network setup
- **🔄 Easy Maintenance**: Single file to update
- **🌐 Environment Specific**: Different URLs per environment
- **👥 Consistent**: Same configuration structure for all

---

**Migration Complete!** 🎉

Your ISBE project now uses the unified configuration system with silent-by-default logging. Enjoy cleaner builds and better debugging capabilities!
