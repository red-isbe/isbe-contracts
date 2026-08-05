# Contributing to ISBE Contracts

This document provides guidelines and instructions for contributing to the ISBE Contracts project.

## Table of Contents

- [User Roles](#user-roles)
- [Development Workflow](#development-workflow)
- [Code Quality Standards](#code-quality-standards)
- [Testing Requirements](#testing-requirements)
- [Pre-commit Pipeline](#pre-commit-pipeline)

## User Roles

This repository has two types of users:

### Admin Users

Smart contract working group coordinators (IoBuilders) who:

- Maintain the project
- Manage user access and roles
- Review all changes before approval
- Have full deployment and governance rights

### Collaborator Users

Contributors who:

- Have read permissions
- Can submit pull requests
- Contribute to development
- Must have changes reviewed by admin users

## Development Workflow

### Branch Naming Convention

Use the following naming patterns for branches:

| Prefix     | Purpose               | Example                       |
| ---------- | --------------------- | ----------------------------- |
| `feat/`    | New features          | `feat/ISBE-123-did-registry`  |
| `fix/`     | Bug fixes             | `fix/ISBE-456-access-control` |
| `docs/`    | Documentation updates | `docs/ISBE-789-api-docs`      |
| `release/` | Release preparations  | `release/v1.2.0`              |

> **IssueId**: Reference the GitHub project issue ID from [ISBE Project](https://github.com/orgs/alastria/projects/21)

### Commit Requirements

- All commits must be **signed** (`git commit -S`)
- Follow [conventional commit format](https://www.conventionalcommits.org/)
- Include comprehensive commit messages
- Reference related issues

Example:

```
feat(identity): add TrustedIssuersRegistry setAttributeMetadata access control fix

- Remove incorrect onlyControllerOrAuth(_did) modifier
- Access control now handled by _checkEligibility only
- Add NatSpec documentation clarifying parameter meanings

Fixes #123
```

### Pull Request Process

1. **Create branch** from `main`
2. **Implement changes** following code standards
3. **Run pre-commit checks**: `npm run pre-commit`
4. **Create pull request** to `main`
5. **Share PR link** in smart contract working group channel
6. **Await admin approval**
7. **Merge PR** (by original author)
8. **Delete feature branch**

> **Note**: Any commits pushed after PR approval require re-approval.

## Code Quality Standards

### Mandatory Requirements

| Requirement             | Standard                                     |
| ----------------------- | -------------------------------------------- |
| Test Coverage           | 100% (lines and branches)                    |
| Slither Vulnerabilities | Zero critical issues                         |
| Linting                 | All Solidity + TypeScript rules pass         |
| Formatting              | Prettier applied                             |
| npm audit               | No high/critical vulnerabilities             |
| NatSpec Documentation   | Complete for all public functions            |
| TypeScript Compilation  | `npx tsc --noEmit --skipLibCheck` passes     |
| Error Handling          | Use structured errors from `utils/errors.ts` |

### Code Style

- **Solidity**: Follow existing patterns in contracts
- **TypeScript**: Standard Hardhat conventions
- **Tests**: Use fixtures from `test/fixtures/` and helpers from `test/support/`
- **No emojis in code**: Unless explicitly requested

### Configuration ID Algorithm

When working with configuration IDs, follow the established algorithm:

```typescript
function buildConfigurationId(
    seed: string, // Initial state (32-byte hex)
    resolverKeys: string[], // Array of resolver keys
    options?: {
        positionDivisor?: number
        logLevel?: 'info' | 'verbose'
    }
): string
```

For detailed implementation, see [ADR_003-CustomConfigurationIDs](docs/adrs/ADR_003-CustomConfigurationIDs.md).

## Testing Requirements

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in parallel
npm run test:parallel

# Run with coverage (requires 100%)
npm run test:coverage

# Run specific test suites
npm run test:accessControl
npm run test:erc20
npm run test:erc721
npm run test:didRegistry

# Run by category
npm run test:core          # Access control, ownership, pause
npm run test:tokens        # ERC20, ERC721, ERC165
npm run test:proxies       # Beacon, ERC1967, Transparent
npm run test:governance    # Governance-related tests
npm run test:identity      # DID Registry tests
```

### Test Fixtures

Use shared fixtures for consistent test setup:

```typescript
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import {
    deployBasicERC20Fixture,
    deployInitializedERC20Fixture,
    getTestSigners,
} from './test/fixtures/common'

describe('MyTest', function () {
    beforeEach(async () => {
        const contracts = await loadFixture(deployInitializedERC20Fixture)
        // Use contracts.erc20, contracts.owner, etc.
    })
})
```

### DID Creation in Tests

**MUST** use proof-derived DIDs to prevent vanity DID attacks:

```typescript
import { generateProof, proofToDid } from '../support/identity/did'

const proof = generateProof(wallet) // wallet must have signingKey
const did = proofToDid(proof) // DID derived from proof

await didRegistry.insertFirstDidDocument(
    did, // Must be proof-derived!
    baseDocument,
    vMethodId,
    proof,
    publicKey,
    ellipticType,
    notBefore,
    notAfter,
    alsoKnownAs
)
```

### Wallet Creation

```typescript
import { HDNodeWallet, ethers } from 'hardhat'
import { config } from 'hardhat'

const accountsConfig = config.networks.hardhat.accounts as { mnemonic: string }

// CORRECT: Empty string for password, path as 3rd argument
const wallet = HDNodeWallet.fromPhrase(
    accountsConfig.mnemonic,
    '', // password (empty)
    "m/44'/60'/0'/0/0" // derivation path
).connect(ethers.provider) // MUST connect to provider!
```

## Pre-commit Pipeline

The project uses Husky hooks that automatically run:

```bash
# Manual run
npm run pre-commit
```

### Pipeline Steps

1. **Documentation generation** - Enhanced TypeScript version
2. **Code formatting** - Prettier
3. **Linting** - Solidity + TypeScript with enhanced rules
4. **TypeScript compilation** - Type validation
5. **Full test suite** - All tests pass
6. **Coverage analysis** - Enhanced with custom error handling
7. **Deployment script testing** - Script validation

## Common Errors and Solutions

| Error                           | Cause                      | Fix                                     |
| ------------------------------- | -------------------------- | --------------------------------------- |
| `DidNotDerivedFromProof`        | DID not derived from proof | Use `proofToDid(generateProof(wallet))` |
| `DidAlreadyExists`              | Same wallet/DID used twice | Different derivation paths or wallets   |
| `missing provider`              | HDNodeWallet not connected | Call `.connect(ethers.provider)`        |
| `TypeScript parameter property` | Constructor shorthand      | Use explicit field assignments          |

## Resources

- [Development Guidelines](docs/Development-guidelines.md)
- [Diamond Pattern Guidelines](docs/Diamond-pattern-guidelines.md)
- [Governance Architecture](docs/Governance-Layer-Architecture.md)
- [API Documentation](docs/generated/INDEX.md)
- [Architecture Decision Records](docs/adrs/README.md)
