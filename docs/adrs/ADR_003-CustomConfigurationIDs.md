# ADR-003: Custom Configuration IDs for Testing User No-Code Application

## Table of Contents

- [Status](#status)
- [Context](#context)
- [Decision](#decision)
- [Mandatory Facets](#mandatory-facets)
- [Roles and Permissions](#roles-and-permissions)
- [Implementation](#implementation)
- [Implementation Phases](#implementation-phases)
- [Risks and Mitigation](#risks-and-mitigation)

## Status

Proposal

## Context

ISBE Factory currently supports 5 predefined Configuration IDs for standard use cases:

- ERC20
- ERC721
- ERC3643
- DID
- HashTimestamp

Each Configuration ID represents a fixed Diamond Proxy configuration with specific facets.

**Problem**: Users cannot customize facet selection for testing purposes. They must use predefined configurations that include all facets, even unused ones.

**Purpose**: This ADR proposes a Custom Configuration ID system to test a user-facing no-code client application (ISBE Portal) where end-users can select optional facets for ERC20 deployments.

**User Selection**: The no-code application allows users to choose:

- Deploy with **Mintable** only
- Deploy with **Burnable** only
- Deploy with **both Mintable and Burnable**
- Deploy with **neither** (basic ERC20)

The system automatically includes mandatory facets (Pausable, AccessControl, Snapshot) without user intervention.

**Testing Scope**: Initial implementation focuses on ERC20 use case for validation and testing.

## Decision

Implement a Custom Configuration ID System for testing a user no-code client application that allows:

1. **Users select optional facets** from available ERC20 extensions:
    - ERC20Mintable
    - ERC20Burnable

    Users can deploy with Mintable only, Burnable only, both, or neither.

2. **System automatically includes mandatory facets** without user intervention:
    - Pausable (emergency stop mechanism)
    - AccessControl (role-based permissions)
    - Snapshot (state capture for auditing)

3. **Generate unique Configuration IDs** using deterministic hashing:

    ```solidity
    customConfigId = keccak256(abi.encodePacked(
        useCaseName,
        version,
        msg.sender,
        block.timestamp
    ))
    ```

4. **Register and deploy** via factory: `setConfiguration()` then `deploy()`

User no-code application workflow example:

```json
{
    "name": "CustomToken",
    "version": "1.0.0",
    "facets": [{ "name": "ERC20Mintable" }],
    "initialization": {
        "ERC20Metadata": {
            "name": "My Token",
            "symbol": "MTK",
            "decimals": 18
        }
    }
}
```

Users only specify optional facets. System automatically adds mandatory facets: `ERC20Core`, `ERC20Metadata`, `Pausable`, `AccessControl`, and `Snapshot`.

## Mandatory Facets

All ERC20 custom configurations MUST include these facets:

1. **ERC20Core**: Base ERC20 implementation
2. **ERC20Metadata**: Token name, symbol, and decimals
3. **Pausable**: Emergency stop mechanism for security
4. **AccessControl**: Role-based permissions for governance
5. **Snapshot**: State capture for auditing and compliance

## Optional Facets

Users can select these facets via the no-code application:

1. **ERC20Mintable**: Allows authorized accounts to mint new tokens
2. **ERC20Burnable**: Allows token holders to burn their tokens

The system enforces mandatory facets while allowing flexible selection of optional facets.

## Roles and Permissions

**Current Roles**:

- `DEFAULT_ADMIN_ROLE`: Manages governance and all roles
- `PAUSER_ROLE`: Can pause/unpause contracts

**Proposed Role**: `VALIDATED_DEPLOYER_ROLE`

- **Purpose**: Allow users to select optional facets (Mintable, Burnable) for ERC20 custom configurations
- **Restrictions**: Cannot remove or modify mandatory facets (ERC20Core, ERC20Metadata, Pausable, AccessControl, Snapshot)
- **Assignment**: Granted by DEFAULT_ADMIN_ROLE to authorized deployers
- **Use Case**: Testing user no-code client application where end-users build custom ERC20 configurations

User workflow with `VALIDATED_DEPLOYER_ROLE`:

1. User selects optional facets: Mintable only, Burnable only, both, or neither
2. System enforces mandatory facets: ERC20Core, ERC20Metadata, Pausable, AccessControl, Snapshot
3. Configuration is validated and deployed with all required facets

## Implementation

### Core Components

**CustomConfigBuilder**: Builds business logic arrays, generates Configuration IDs, validates facet existence

**FacetCompatibilityValidator**: Detects selector conflicts, validates dependencies, determines initialization order, enforces mandatory facets

**Hardhat Task**: `deployCustomUseCase` for CLI and JSON-based deployments

### CLI Usage

```bash
# Deploy with Mintable only
npx hardhat deployCustomUseCase \
    --network customR1Network \
    --name "MintableToken" \
    --facets "ERC20Mintable"

# Deploy with both Mintable and Burnable
npx hardhat deployCustomUseCase \
    --network customR1Network \
    --name "FullToken" \
    --facets "ERC20Mintable,ERC20Burnable"

# Deploy basic ERC20 (no optional facets)
npx hardhat deployCustomUseCase \
    --network customR1Network \
    --name "BasicToken"

# Using JSON configuration
npx hardhat deployCustomUseCase \
    --network customR1Network \
    --config custom-token.json

# Validation only (dry-run)
npx hardhat deployCustomUseCase \
    --network customR1Network \
    --config custom-token.json \
    --validate
```

### User Workflow

1. Explore available optional facets: `npx hardhat listAvailableFacets --network customR1Network`
2. Create configuration specifying only optional facets (JSON or CLI parameters)
3. Validate: `deployCustomUseCase --validate`
4. Deploy: `deployCustomUseCase` (system adds mandatory facets, registers config, and deploys proxy)
5. Verify: `npx hardhat verifyCustomDeployment --address <proxy>`

## Implementation Phases

### Phase 1: Core Infrastructure

- Implement `CustomConfigBuilder` and `FacetCompatibilityValidator`
- Configuration ID generation algorithm
- Mandatory facets enforcement
- Unit tests

### Phase 2: Deployment Task

- Implement `deployCustomUseCase` Hardhat task
- CLI and JSON configuration support
- Integration tests with dev network

### Phase 3: Developer Tools

- `listAvailableFacets` task
- `verifyCustomDeployment` task
- Auto-generate facet documentation
- Configuration templates and examples

### Phase 4: Integration

- Integrate with existing `deployAll` task
- CI/CD validation pipelines
- Complete documentation
- User acceptance testing

## Risks and Mitigation

### Selector Conflicts

**Risk**: Function signature collisions between facets

**Mitigation**: Comprehensive selector validation pre-deployment, automated conflict detection, detailed error messages

### Circular Dependencies

**Risk**: Facets with circular dependencies prevent initialization

**Mitigation**: Dependency graph analysis with cycle detection, early validation failure, documented dependencies

### Invalid Configurations

**Risk**: Users create non-functional configurations

**Mitigation**: Multi-layer validation, dry-run mode, templates and examples, mandatory facets enforcement

## Example

Deploy ERC20 token with Mintable facet via no-code client application:

```json
{
    "name": "MintableToken",
    "version": "1.0.0",
    "facets": [{ "name": "ERC20Mintable" }],
    "initialization": {
        "ERC20Metadata": {
            "name": "Mintable Token",
            "symbol": "MINT",
            "decimals": 18
        }
    }
}
```

Users specify only optional facets. System automatically includes mandatory facets: `ERC20Core`, `ERC20Metadata`, `Pausable`, `AccessControl`, and `Snapshot`.

**User Options**:

- Deploy with `ERC20Mintable` only
- Deploy with `ERC20Burnable` only
- Deploy with both: `"facets": [{ "name": "ERC20Mintable" }, { "name": "ERC20Burnable" }]`
- Deploy with neither: `"facets": []` (basic ERC20 with mandatory facets only)

## Conclusion

Custom Configuration IDs enable testing for a user-facing no-code client application where end-users build custom ERC20 configurations by selecting optional facets (Mintable, Burnable). The system enforces mandatory facets (ERC20Core, ERC20Metadata, Pausable, AccessControl, Snapshot) while providing flexibility for optional features. This design balances user choice with platform security and compliance requirements.
