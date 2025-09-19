# ISBE Contracts

Repository of certified and audited smart contracts for the ISBE (Interoperable Secure Blockchain Ecosystem) network, developed by Alastria. This project implements sophisticated Diamond Pattern (EIP-2535) architecture for modular, upgradeable smart contracts with comprehensive governance controls.

## 🚀 Quick Start

### Requirements

- **Node.js**: Version 20.X.X or higher
- **npm**: Latest version
- **Git**: For version control
- **Docker**: Required for Slither security analysis

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd isbe-contracts

# Install dependencies
npm install

# Compile contracts
npm run compile:force

# Run tests
npm run test

# Generate documentation
npm run docgen
```

## 🌐 Network Support

This project supports both **secp256k1** (standard Ethereum) and **secp256r1** (custom Hyperledger Besu) elliptic curves.

### Available Networks

| Network           | Type           | Curve     | Chain ID | URL                     |
| ----------------- | -------------- | --------- | -------- | ----------------------- |
| `hardhat`         | Local          | secp256k1 | -        | Local Hardhat           |
| `localhost`       | Local          | secp256k1 | -        | http://127.0.0.1:8545   |
| `mvp`             | ISBE MVP       | secp256k1 | 2023     | ISBE MVP Environment    |
| `arsys`           | ISBE Arsys     | secp256k1 | 2024     | Arsys Environment       |
| `kepler`          | IoBuilders     | secp256k1 | 1003     | Kepler Testnet          |
| `customR1Network` | Besu secp256r1 | secp256r1 | 2222     | Custom Hyperledger Besu |

### Deployment Commands

```bash
# Deploy to local Hardhat network (secp256k1)
npx hardhat deployAll --network hardhat

# Deploy to localhost (secp256k1)
npx hardhat deployAll --network localhost

# Deploy to ISBE MVP (secp256k1)
npx hardhat deployAll --network mvp

# Deploy to Hyperledger Besu with secp256r1
npx hardhat deployAll --network customR1Network

# Test deployment (comprehensive)
npx hardhat deployTest
```

## 🔐 Account Management

### secp256k1 Networks (Standard Ethereum)

For standard Ethereum networks, create a `.env` file:

```bash
# .env file for secp256k1 networks
; Curve: SECP256K1
ACCOUNT_ADDRESS=0xYourAddress
ACCOUNT_PRIVATE_KEY=0xYourPrivateKey
ACCOUNTS=privatekey1,privatekey2,privatekey3,privatekey4,privatekey5
```

### secp256r1 Networks (Hyperledger Besu)

For Hyperledger Besu networks with secp256r1:

```bash
# Generate secp256r1 accounts
npx hardhat generate-secp256r1-env --count 5

# This creates a .env file like:
; Curve: SECP256R1
ACCOUNT_ADDRESS=0xGeneratedAddress
ACCOUNT_PRIVATE_KEY=generatedprivatekey
ACCOUNTS=privatekey1,privatekey2,privatekey3,privatekey4,privatekey5
```

### Account Validation

```bash
# Validate current account configuration
npx hardhat validate-accounts

# Show account configuration (without private keys)
npx hardhat show-env-accounts

# Show account configuration (with private keys - development only)
npx hardhat show-env-accounts --private

# Show secp256r1 accounts with public keys
npx hardhat show-secp256r1-accounts
```

## 🏗️ Architecture Overview

### Core Components

1. **Diamond Pattern (EIP-2535)**: Modular proxy architecture
2. **Governance Layer**: Role-based access control and factory management
3. **Business Logic**: Pluggable facets for different functionalities
4. **Use Cases**: Complete applications using diamond proxies

### Key Contracts

- **ISBE Factory**: Governance and factory management
- **Business Logic Factory**: Manages business logic deployment
- **Configuration Management**: Diamond configuration management
- **Proxy Factory**: Use case proxy deployment
- **Global ISBE Pause**: Network-wide pause functionality

## 📋 Development Tasks

### Build and Compilation

```bash
# Standard compilation
npm run compile

# Force recompilation
npm run compile:force

# Compilation with stack traces
npm run compile:traces

# Generate TypeChain types
npm run typechain

# Check contract sizes
npm run size
```

### Testing

```bash
# Run all tests
npm run test

# Run tests in parallel
npm run test:parallel

# Run coverage analysis (requires 100%)
npm run test:coverage

# Test deployment scripts
npm run test:scripts

# Run specific test suites
npm run test:accessControl
npm run test:erc20
npm run test:BusinessLogicFactory
npm run test:ProxyFactory
npm run test:ConfigurationManagement
npm run test:GlobalIsbePause
```

### Code Quality

```bash
# Run all linters
npm run lint

# Lint Solidity files (max 0 warnings)
npm run lint:sol

# Lint TypeScript files
npm run lint:ts

# Format all files
npm run prettier

# Check formatting
npm run prettier:check
```

### Security Analysis

```bash
# Complete Slither analysis (requires Docker)
npm run slither

# Local Slither analysis
npm run slither:analysis:local

# Generate security summary
npm run slither:summary

# Analyze storage layout
npm run slither:storageLayout

# Analyze inheritance structure
npm run slither:inheritance
```

### Documentation

```bash
# Generate contract documentation
npm run docgen
```

### Pre-commit Pipeline

```bash
# Full pre-commit pipeline
npm run pre-commit
# Includes: docgen, prettier, lint, test, coverage
```

## 🎯 Deployment Tasks

### Full Deployment

```bash
# Deploy all contracts to specific network
npx hardhat deployAll --network <network>

# Test complete deployment pipeline
npx hardhat deployTest
```

### Business Logic Management

```bash
# Deploy ISBE factory (governance)
npx hardhat deploy-isbe-factory --network <network>

# Deploy business logic
npx hardhat deploy-business-logic --resolver <resolver> --network <network>

# Get business logic address
npx hardhat get-business-logic-address --business-id <id> --network <network>

# Get all business logics
npx hardhat get-business-logics --network <network>

# Get business logic versions
npx hardhat get-business-logic-versions --business-id <id> --network <network>
```

### Configuration Management

```bash
# Set configuration
npx hardhat set-config --business-data <data> --network <network>

# Get configuration
npx hardhat get-config --config-id <id> --network <network>

# Get facets from configuration
npx hardhat config-facets --config-id <id> --network <network>
```

### Use Case Deployment

```bash
# Deploy use case
npx hardhat deploy-use-case --config-id <id> --network <network>

# Deploy use case to specific address
npx hardhat deploy-use-case-to --config-id <id> --salt <salt> --network <network>

# Get configuration by proxy
npx hardhat get-configuration-by-proxy --proxy <address> --network <network>
```

## 🔍 Verification and Monitoring

### Deployment Verification

```bash
# Verify Besu deployment
npx hardhat verify-besu-deployment --network <network>

# Complete deployment status
npx hardhat complete-deployment-status --network <network>

# Simple deployment status
npx hardhat deployment-status --network <network>

# Contract information
npx hardhat contract-info --address <address> --network <network>
```

### Governance Analysis

```bash
# Analyze governance roles
npx hardhat governance-roles --governance <address> --network <network>

# Get role members
npx hardhat get-role-members --role <role> --contract <address> --network <network>

# Check if account has role
npx hardhat has-role --role <role> --account <address> --contract <address> --network <network>
```

### Diamond Pattern Tasks

```bash
# Get all facets
npx hardhat get-facets --diamond <address> --network <network>

# Get facet address
npx hardhat get-facet-address --selector <selector> --diamond <address> --network <network>

# Get facet selectors
npx hardhat get-facet-selectors --facet <address> --diamond <address> --network <network>

# Perform diamond cut
npx hardhat diamond-cut --cuts <cuts> --diamond <address> --network <network>
```

### Access Control

```bash
# Grant role
npx hardhat grant-role --role <role> --account <address> --contract <address> --network <network>

# Revoke role
npx hardhat revoke-role --role <role> --account <address> --contract <address> --network <network>

# Renounce role
npx hardhat renounce-role --role <role> --contract <address> --network <network>
```

### Pause Controls

```bash
# Pause ISBE globally
npx hardhat pause-isbe --network <network>

# Unpause ISBE globally
npx hardhat unpause-isbe --network <network>

# Pause specific contract
npx hardhat pause --contract <address> --network <network>

# Unpause specific contract
npx hardhat unpause --contract <address> --network <network>

# Check if paused
npx hardhat is-paused --contract <address> --network <network>
```

## 🛠️ Curve-Aware Development

### Working with secp256k1 (Standard Ethereum)

```bash
# Use standard Ethereum tools and wallets
# MetaMask, Hardhat, Ganache work out of the box
npx hardhat deployAll --network hardhat
npx hardhat validate-accounts  # Shows SECP256K1 detected
```

### Working with secp256r1 (Hyperledger Besu)

```bash
# Generate secp256r1 compatible accounts
npx hardhat generate-secp256r1-env --count 5

# Validate secp256r1 accounts
npx hardhat validate-accounts  # Shows SECP256R1 detected

# Show secp256r1 account details
npx hardhat show-secp256r1-accounts

# Deploy to secp256r1 network
npx hardhat deployAll --network customR1Network
```

### Cross-Curve Development

The project automatically detects the curve type based on your `.env` configuration:

1. **Curve Detection**: Automatic detection from account validation
2. **Network Configuration**: Each network specifies its curve type
3. **Task Compatibility**: All tasks work with both curves
4. **Account Generation**: Separate tools for each curve type

## 📊 Examples

### Complete Deployment Example

```bash
# For secp256k1 networks
echo '; Curve: SECP256K1' > .env
echo 'ACCOUNT_ADDRESS=0xYourAddress' >> .env
echo 'ACCOUNT_PRIVATE_KEY=0xYourPrivateKey' >> .env
echo 'ACCOUNTS=key1,key2,key3,key4,key5' >> .env

npx hardhat validate-accounts
npx hardhat deployAll --network hardhat
npx hardhat complete-deployment-status --network hardhat
```

```bash
# For secp256r1 networks (Hyperledger Besu)
npx hardhat generate-secp256r1-env --count 5
npx hardhat validate-accounts
npx hardhat deployAll --network customR1Network
npx hardhat verify-besu-deployment --network customR1Network
```

## 👥 User Roles

This repository has two types of users:

- **Admin Users**: Smart contract working group coordinators (IoBuilders) who:
    - Maintain the project
    - Manage user access and roles
    - Review all changes before approval
    - Have full deployment and governance rights

- **Collaborator Users**: Contributors who:
    - Have read permissions
    - Can submit pull requests
    - Contribute to development
    - Must have changes reviewed by admin users

## 📝 Development Workflow

### Branch Naming Convention

- `feat/[IssueId]-description` - New features
- `fix/[IssueId]-description` - Bug fixes
- `docs/[IssueId]-description` - Documentation updates
- `release/[IssueId]-description` - Release preparations

> **IssueId**: GitHub project issue ID from [ISBE Project](https://github.com/orgs/alastria/projects/21)

### Commit Requirements

- All commits must be **signed** (`git commit -S`)
- Follow conventional commit format
- Include comprehensive commit messages
- Reference related issues

### Pull Request Process

1. Create branch from `main`
2. Implement changes following code standards
3. Run pre-commit checks: `npm run pre-commit`
4. Create pull request to `main`
5. Share PR link in smart contract working group channel
6. Await admin approval
7. Merge PR (by original author)
8. Delete feature branch

> **Note**: Any commits pushed after PR approval require re-approval.

## ✅ Code Quality Standards

### Mandatory Requirements

- **100% test coverage** (lines and branches)
- **Zero critical Slither vulnerabilities**
- **All linting rules pass** (Solidity + TypeScript)
- **Prettier formatting applied**
- **Clean npm audit** (no high/critical vulnerabilities)
- **Complete NatSpec documentation**

### Pre-commit Validation

The project uses Husky hooks that automatically run:

```bash
# Automatic checks on git commit
- Documentation generation
- Code formatting (Prettier)
- Linting (Solidity + TypeScript)
- Full test suite execution
- Coverage analysis
- Deployment script testing
```

## 📦 NPM Package Usage

To use ISBE contracts as a dependency in your project:

```bash
npm install @alastria/isbe-contracts
```

For detailed installation and usage instructions, visit the [package documentation](https://github.com/alastria/isbe-contracts/pkgs/npm/isbe-contracts).

## 📚 Documentation

- **Development Guidelines**: `docs/Development-guidelines.md`
- **Diamond Pattern Guide**: `docs/Diamond-pattern-guidelines.md`
- **Governance Architecture**: `docs/Gobernance-Layer-Architecture.md`
- **Generated Documentation**: `docs/generated-temp/` (via `npm run docgen`)

## 🔧 Troubleshooting

### Common Issues

1. **Account Validation Fails**:

    ```bash
    npx hardhat validate-accounts --fix
    ```

2. **Wrong Curve Detected**:
    - Check `.env` file curve comments
    - Regenerate accounts for correct curve
3. **Compilation Errors**:

    ```bash
    npm run compile:force
    npm run typechain
    ```

4. **Test Failures**:
    ```bash
    npm run test:coverage
    npm run lint
    ```

### Network Connection Issues

- Verify network URLs in `hardhat.config.ts`
- Check account balances
- Validate network accessibility

## 🚀 Advanced Usage

### Custom Network Configuration

To add a new network:

```typescript
// In hardhat.config.ts
customNetwork: {
    url: 'your-network-url',
    chainId: yourChainId,
    accounts: ACCOUNTS, // or SECP256R1_ACCOUNT_KEYS
    gasPrice: 0,
    gas: 100000000,
    curve: 'secp256k1' // or 'secp256r1'
}
```

### Environment-Specific Deployment

Use different `.env` files for different environments:

```bash
# Development
cp .env.development .env
npx hardhat deployAll --network localhost

# Production
cp .env.production .env
npx hardhat deployAll --network mvp
```

This README provides comprehensive documentation for the ISBE contracts project, covering both secp256k1 and secp256r1 network support, all available tasks, and complete development workflows.
