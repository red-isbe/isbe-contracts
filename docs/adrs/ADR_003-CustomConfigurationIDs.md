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

ISBE Factory currently supports predefined Configuration IDs for standard use cases.

Each Configuration ID represents a fixed Diamond Proxy configuration with specific facets.

**Problem**: Users cannot customize facet selection for testing purposes. They must use predefined configurations that include all facets, even unused ones.

**Purpose**: This ADR proposes a Custom Configuration ID system to test a user-facing no-code client application (ISBE Portal) where end-users can select optional facets for ERC20 deployments.

**User Selection**: The no-code application allows users to choose per example:

- Deploy with **Mintable** only
- Deploy with **Burnable** only
- Deploy with **both Mintable and Burnable**
- Deploy with **neither** (basic ERC20)

**Testing Scope**: Initial implementation focuses on ERC20 use case for validation and testing.

## Decision

Implement a Custom Configuration ID System for testing a user no-code client application based on deterministic bitmask generation:

1. **Configuration IDs are deterministic bitmasks**, not random hashes:
    - Same facet selection always produces the same Configuration ID
    - No hash collisions
    - IDs can be pre-calculated for all possible combinations

2. **Create a Facet selection model**:

    Each facet is assigned a specific bit position, allowing deterministic ID generation.

3. **Generate Configuration IDs using bitmask algorithm, example:**:
   A specialized script will be created to generate all possible Configuration IDs for ERC20 use cases.

4. **One-time configuration registration**:
    - Governance registers all possible Configuration IDs **once**
    - Each Configuration ID maps to its specific facet combination
    - Future optional facets can be added by defining new bit positions
    - Pre-registration ensures all valid combinations are available for users

5. **User deployment workflow from no-code application example**:

    ```
    Frontend (User Interface)
       ↓
    1. User selects: Token Name, Symbol, Optional Facets (Mintable/Burnable)
       ↓
    2. Frontend calculates deterministic Configuration ID from selection
       ↓
    3. Frontend calls backend/smart contract:
       └─→ factory.deploy(configurationId)
           └─→ Returns: proxyAddress
       ↓
    4. Frontend initializes deployed proxy:
       └─→ proxy.initializeMetadata(name, symbol, decimals)
       └─→ proxy.grantRole(ADMIN_ROLE, userAddress)
       └─→ proxy.grantRole(MINTER_ROLE, userAddress) [if Mintable selected]
       ↓
    5. User's custom ERC20 token is ready
    ```

    **Key**: Configuration ID is calculated client-side using the same bitmask algorithm. Backend only needs to call `factory.deploy()` with the pre-calculated ID.

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

````

**Note**: Mandatory facets are automatically included by the system. Users only specify optional facets.

## Implementation Phases

### Phase 1: Deterministic ID Generation

- Create deterministic bitmask generator script
- Define bit positions for mandatory and optional facets
- Generate all possible Configuration IDs for ERC20
- Document bitmask structure for future extensions

### Phase 2: Configuration Registration

- Deploy business logic facets (if not already deployed)
- Verify all configurations are correctly registered in factory
- Document registered Configuration IDs

### Phase 3: No-Code Application Integration

- Implement `CustomConfigBuilder` utility for Configuration ID calculation
- Implement `FacetCompatibilityValidator` for validation
- Create deployment and initialization workflows
- Integration tests

### Phase 4: Testing and Documentation

- Test all Configuration ID combinations
- Validate deterministic ID generation
- Complete user and developer documentation
- User acceptance testing with no-code application

## Mandatory Facets

All ERC20 custom configurations MUST include these facets:

1. **ERC20Core**: Base ERC20 implementation
2. **ERC20Metadata**: Token name, symbol, and decimals (requires initialization parameters)
3. **Pausable**: Emergency stop mechanism for security
4. **AccessControl**: Role-based permissions for governance

## Configurable Elements

### Mandatory Facet Parameters

**ERC20Metadata** (required initialization):

- `name`: Token name (e.g., "My Token")
- `symbol`: Token symbol (e.g., "MTK")
- `decimals`: Token decimals (typically 18)

### Optional Facets

Users can select these facets via the no-code application ids:

The system enforces mandatory facets while allowing flexible selection of optional facets and configuration of metadata parameters.

## Implementation

### Existing Infrastructure

ISBE already provides the necessary infrastructure for custom configurations:

**Existing Tasks**:

- `setConfig` (tasks/configMgmt/setConfig.ts): Registers custom configuration IDs with business logic facets
- `deployUseCase` (tasks/proxyFactory/deployUseCase.ts): Deploys proxy with specified configuration ID
- `deployUseCaseTo` (tasks/proxyFactory/deployUseCaseTo.ts): Deploys proxy to deterministic address

**Configuration Management**:

- `ConfigurationManagement.sol`: Handles registration and versioning of configurations
- `setConfiguration(bytes32 configurationId, BusinessData[] businessIds)`: Core function for registering configurations

### New Components Required

**Deterministic Bitmask Generator Script**:
- Generates all possible Configuration IDs for ERC20 use cases
- Implements bitmask algorithm (mandatory bits + optional bits)
- Outputs mapping: `{facet_combination => configurationId}`
- Can be extended for future optional facets

**CustomConfigBuilder** (TypeScript utility):
- Calculates Configuration ID from user facet selection using bitmask
- Validates facet existence in deployed business logics
- Maps Configuration ID to business logic array for registration

**FacetCompatibilityValidator** (TypeScript utility):
- Detects selector conflicts between facets
- Validates facet dependencies
- Enforces mandatory facets policy

### No-Code Application Integration

Frontend calculates Configuration ID client-side and calls backend:

```typescript
// Frontend: User selects facets
const userSelection = {
    name: "My Token",
    symbol: "MTK",
    mintable: true,
    burnable: false
};

// Frontend: Calculate deterministic Configuration ID
const configId = calculateBitmask(userSelection);

// Backend: Deploy proxy
const proxyAddress = await factory.deploy(configId);

// Backend: Initialize token
await initializeToken(proxyAddress, userSelection);
````

## Implementation Phases

### Phase 1: Deterministic ID Generation

- Create deterministic bitmask generator script
- Define bit positions for mandatory and optional facets
- Generate all possible Configuration IDs for ERC20
- Document bitmask structure for future extensions

### Phase 2: Configuration Registration

- Deploy business logic facets (if not already deployed)
- Use register all Configuration IDs via `setConfiguration()`
- Verify all configurations are correctly registered in factory
- Document registered Configuration IDs

### Phase 3: No-Code Application Integration

- Implement `CustomConfigBuilder` utility for Configuration ID calculation
- Implement `FacetCompatibilityValidator` for validation
- Create deployment and initialization workflows
- Integration tests with customR1Network

### Phase 4: Testing and Documentation

- Test all Configuration ID combinations
- Validate deterministic ID generation
- Complete user and developer documentation
- User acceptance testing with no-code application

## Risks and Mitigation

### Bitmask Collision

**Risk**: Incorrect bit assignment causes Configuration ID collisions

**Mitigation**: Clear bit position documentation, automated validation script, unit tests for all combinations

### Future Facet Extensions

**Risk**: Adding new optional facets requires updating bitmask structure

**Mitigation**: Reserve bit positions for future use, document extension procedure, maintain backward compatibility

### Invalid Configurations

**Risk**: Users select incompatible facet combinations

**Mitigation**: Pre-registration ensures all valid combinations, FacetCompatibilityValidator enforces rules, clear error messages

**Workflow**:

1. Frontend calculates deterministic Configuration ID from facet selection
    - Bitmask: Mandatory (bits 0-4) + Mintable (bit 5) = `0x...003F`

2. Frontend calls: `factory.deploy(0x...003F)`
    - Returns: `proxyAddress`

3. Frontend initializes token:
    - `proxy.initializeMetadata("Mintable Token", "MINT", 18)`
    - `proxy.grantRole(ADMIN_ROLE, userAddress)`
    - `proxy.grantRole(MINTER_ROLE, userAddress)`

**A example Possible Configurations**:

| Mintable | Burnable | Configuration ID | Description |
| -------- | -------- | ---------------- | ----------- |
| No       | No       | `0x...001F`      | Basic ERC20 |
| Yes      | No       | `0x...003F`      | + Mintable  |
| No       | Yes      | `0x...005F`      | + Burnable  |
| Yes      | Yes      | `0x...007F`      | Full        |

## Conclusion

Custom Configuration IDs use deterministic bitmasks to enable a user-facing no-code client application where end-users build custom ERC20 tokens by selecting optional facets. The bitmask approach ensures:

- No hash collisions
- Pre-calculable Configuration IDs
- Efficient one-time registration
- Future extensibility with new optional facets

This design balances user flexibility with platform security and deterministic behavior.
