# Architecture Decision Record: Enhanced Initializable Contract with Version Control

**ADR Number:** 009
**Date:** 6 November 2025  
**Last Updated:** 6 November 2025  
**Status:** Proposed  
**Decision Makers:** ISBE Contracts Team  
**Technical Context:** Hardhat + Ethers.js + Solidity (OpenZeppelin Patterns)

---

## Table of Contents

1. [Context](#1-context)
2. [Problem Statement](#2-problem-statement)
3. [Proposed Solution](#3-proposed-solution)
4. [Options Considered](#4-options-considered)
5. [Decision](#5-decision)
6. [Consequences](#6-consequences)
7. [Implementation Examples](#7-implementation-examples)
8. [Implementation Plan](#8-implementation-plan)
9. [References](#9-references)

---

## 1. Context

The current `Initializable` smart contract implementation utilises a storage mapping that tracks initialisation status using a `bytes32 facetKey` as the key and a boolean value to indicate whether initialisation has occurred (`true` if initialised, `false` otherwise). The `initializer(bytes32)` modifier marks functions as initialisers.

### Current Architecture

```solidity
// Existing structure
mapping(bytes32 facetKey => bool) initialized;
```

### Technical Environment

- **Framework:** Hardhat development environment
- **Library:** Ethers.js for blockchain interaction
- **Language:** Solidity 0.8.28
- **Pattern:** OpenZeppelin-style upgradeable contracts
- **Architecture:** Diamond pattern with facets

---

## 2. Problem Statement

The existing `Initializable` implementation has the following limitations:

1. **No Version Tracking:** The boolean-based storage cannot track which version of initialisation logic has been executed
2. **Upgrade Limitations:** Introducing breaking changes in contract upgrades requires complete reinitialisation, which may not be desirable or safe
3. **Multi-Version Support:** Cannot manage multiple versions of initialisers or ensure functions are only callable after specific initialisation versions
4. **Migration Complexity:** Upgrading contracts with new state variables or initialisation logic requires workarounds

### Impact

These limitations restrict our ability to:

- Deploy incremental upgrades with new initialisation requirements
- Maintain backwards compatibility whilst introducing new features
- Safely manage contract state evolution across versions
- Implement granular access control based on initialisation state

---

## 3. Proposed Solution

### 3.1 Updated Storage Structure

Replace the boolean-based tracking with version-based tracking:

```solidity
struct InitializableStorage {
    /**
     * @dev Indicates that the contract is in the process of being initialized.
     */
    mapping(bytes32 facetKey => uint256 lastVersion) initialized;
}
```

This change enables:

- Tracking the specific version to which a facet has been initialised
- Supporting multiple initialisation phases across contract upgrades
- Implementing version-dependent function access control

### 3.2 New Modifiers

Introduce three new modifiers to support versioned initialisation:

#### `initializer(bytes32 facetKey, uint256 version)`

Marks a function as the primary initialiser for a specific version. Can only be called once per version.

**Behaviour:**

- Checks that the current version has not been initialised
- Marks the version as initialised after execution
- Prevents re-initialisation of the same version

#### `reinitializer(bytes32 facetKey, uint256 version)`

Allows re-initialisation for contract upgrades, enabling migration to new versions.

**Behaviour:**

- Checks that the specified version is greater than the current initialised version
- Updates the initialised version marker
- Allows controlled state migration during upgrades

#### `onlyFromVersion(bytes32 facetKey, uint256 minVersion)`

Restricts function access to contracts initialised to at least the specified version.

**Behaviour:**

- Verifies the contract has been initialised to the minimum required version
- Prevents calls to functions requiring features from newer initialisations
- Supports incremental feature rollout

---

## 4. Options Considered

We evaluated two primary approaches for version management:

### Option 1: Governance-Managed Version

The version number is managed centrally through a governance diamond contract.

**Advantages:**

- Simplified management through automated updates and rollbacks
- Centralised version control ensures consistency across facets
- Reduced operational complexity for deployment teams
- Lower operational costs through resource optimisation

**Disadvantages:**

- Potential for configuration drift if governance is not properly maintained
- Limited deployment flexibility; requires coordination with governance
- Dependency on external governance mechanism introduces additional failure points
- May slow deployment cycles

### Option 2: Explicit Version Parameters

Version numbers are explicitly passed as parameters to modifiers.

**Advantages:**

- Full control over versioning at the function level
- Greater deployment flexibility; each facet manages its own version
- Enhanced security through fine-grained control over permissions
- Better scalability; versions can be deployed incrementally
- Reduced maintenance through automated update processes

**Disadvantages:**

- Increased operational complexity
- Higher initial setup costs
- Risk of misconfiguration if versions are not carefully managed
- Requires more effort in managing version numbers across facets

### Comparison Matrix

| Aspect                       | Governance-Managed         | Explicit Version         |
| ---------------------------- | -------------------------- | ------------------------ |
| **Configuration Management** | ✅ Automated, centralised  | ⚠️ Manual, per-facet     |
| **Deployment Flexibility**   | ⚠️ Limited, coordinated    | ✅ Independent, flexible |
| **Resource Utilisation**     | ✅ Optimised, shared       | ⚠️ Per-version overhead  |
| **Scalability**              | ⚠️ Rigid structure         | ✅ Incremental growth    |
| **Security**                 | ⚠️ Single point of control | ✅ Granular control      |
| **Maintenance Overhead**     | ✅ Lower, automated        | ⚠️ Higher, manual        |
| **Initial Setup Cost**       | ✅ Lower                   | ⚠️ Higher                |
| **Operational Cost**         | ✅ Lower long-term         | ⚠️ Higher long-term      |

---

## 5. Decision

**We have decided to implement Option 2: Explicit Version Parameters.**

### Rationale

1. **Flexibility:** Allows independent versioning of facets without requiring governance coordination
2. **Security:** Granular control reduces risk of unintended version changes
3. **Scalability:** Supports incremental upgrades without system-wide coordination
4. **Decentralisation:** Removes dependency on centralised governance for version management

### Implementation Details

We will update `Initializable.sol` to include:

1. **Modified storage:**

    ```solidity
    struct InitializableStorage {
        /**
         * @dev Indicates that the contract is in the process of being initialized.
         */
        mapping(bytes32 facetKey => uint256 lastVersion) initialized;
    }
    ```

2. **New modifiers:**
    - `initializer(bytes32 facetKey, uint256 version)`
    - `reinitializer(bytes32 facetKey, uint256 version)`
    - `onlyFromVersion(bytes32 facetKey, uint256 minVersion)`

3. **Updated initialisation functions:** All existing initialise functions will be updated to include `facetKey` and `version` parameters

---

## 6. Consequences

### Positive Consequences

1. **Version Independence**
    - Each facet can maintain its own version lifecycle
    - Upgrades can be deployed incrementally without affecting other facets
    - Supports parallel development of multiple facets

2. **Controlled State Migration**
    - `reinitializer` enables safe migration of state during upgrades
    - Breaking changes can be introduced with clear version boundaries
    - State evolution is explicitly tracked and auditable

3. **Feature Gating**
    - `onlyFromVersion` provides native support for feature flags based on initialisation state
    - Functions can require specific versions, ensuring dependencies are met
    - Reduces risk of calling functions before required setup is complete

4. **Backwards Compatibility**
    - Existing contracts can continue functioning without modification
    - New contracts can adopt versioning incrementally
    - Migration path is clear and well-defined

### Negative Consequences

1. **Increased Complexity**
    - Developers must manually manage version numbers
    - Risk of version mismatch if not carefully coordinated
    - Additional testing required to verify version logic

2. **Performance Impact**
    - Minimal gas overhead from additional parameter and storage operations
    - Estimated impact: <500 gas per initialisation call
    - Negligible for most use cases

3. **Migration Requirements**
    - Existing contracts require updates to adopt versioning
    - Testing effort required to ensure compatibility
    - Documentation must be updated to reflect new patterns

### Risk Mitigation

1. **Version Mismatch Prevention:**
    - Implement version validation in deployment scripts
    - Add events for version changes to enable monitoring
    - Create automated tests to verify version progression

2. **Complexity Management:**
    - Provide clear documentation with examples
    - Create helper libraries for common version patterns
    - Implement CI/CD checks for version consistency

3. **Migration Support:**
    - Provide migration guides for existing contracts
    - Create automated migration scripts where possible
    - Offer backwards-compatible wrapper functions

---

## 7. Implementation Examples

### 7.1 Basic Versioned Initialisation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "./Initializable.sol";

/**
 * @title MyContract
 * @notice Example contract demonstrating versioned initialisation
 */
contract MyContract is Initializable {
    // Storage layout constants
    bytes32 private constant _STORAGE_POSITION =
        0x79a9bfe7e126a43b27e20eafd7bd7b3fb8d8ed5aae1d8efc7323966e18d4e7d9;
    bytes32 private constant _RESOLVER_KEY =
        0x278f3647aba9ccd66a73a040cbd8f16e58fa20e5bbe68f164c22e237f4e53c4b;

    // State variables with version annotations
    bytes32 private initialData;        // Available since version 1
    address private ownerData;          // Available since version 2
    uint256 private reinitializationData; // Available since version 3

    // Events
    event ContractInitialized(bytes32 indexed data, address indexed owner, uint256 indexed value);
    event ContractReinitializedV2(address indexed owner);
    event ContractReinitializedV3(uint256 indexed value));
    event InitialDataSet(bytes32 indexed data);
    event ReinitializationDataSet(uint256 indexed data);

    /**
     * @notice Initialises the contract to version 3
     * @param hash Initial data hash
     * @param owner Owner address
     * @param value Reinitialisation value
     */
    function initializeMyContract(
        bytes32 hash,
        address owner,
        uint256 value
    )
        external
        initializer(_RESOLVER_KEY, 3)
    {
        initialData = hash;
        ownerData = owner;
        reinitializationData = value;

        emit ContractInitialized(hash, owner, value);
    }

    /**
     * @notice Reinitialises contract to version 2, adding owner data
     * @param owner Owner address to set
     */
    function reinitializeMyContractV2(address owner)
        external
        reinitializer(_RESOLVER_KEY, 2)
        onlyRole(UPDATER_ROLE)
    {
        ownerData = owner;
        emit ContractReinitializedV2(owner);
    }

    /**
     * @notice Reinitialises contract to version 3, adding reinitialisation data
     * @param value Value to set
     */
    function reinitializeMyContractV3(uint256 value)
        external
        reinitializer(_RESOLVER_KEY, 3)
        onlyRole(UPDATER_ROLE)
    {
        reinitializationData = value;
        emit ContractReinitialized(value);
    }

    /**
     * @notice Sets initial data (requires version 1+)
     * @param hash Data hash to set
     */
    function setInitialData(bytes32 hash)
        external
        onlyFromVersion(_RESOLVER_KEY, 1)
        onlyRole(CONTRACT_ROLE)
    {
        initialData = hash;
        emit InitialDataSet(hash);
    }

    /**
     * @notice Sets reinitialisation data (requires version 3+)
     * @param value Value to set
     */
    function setReinitializationData(uint256 value)
        external
        onlyFromVersion(_RESOLVER_KEY, 3)
        onlyRole(CONTRACT_ROLE)
    {
        reinitializationData = value;
        emit ReinitializationDataSet(value);
    }
}
```

---

## 8. Implementation Plan

### Phase 1: Core Modifier Implementation (1-3 Days)

**Tasks:**

1. Update storage mapping from `bool` to `uint256`
2. Implement internal versioning logic
3. Create `initializer(bytes32, uint256)` modifier
4. Migrate existing business logic to use version 1 as baseline
5. Ensure all existing tests pass with updated logic
6. Achieve 100% test coverage on core functionality

**Deliverables:**

- Updated `Initializable.sol` contract
- Passing test suite with full coverage
- Migration guide for existing contracts

### Phase 2: Reinitializer Implementation (1-3 Days)

**Tasks:**

1. Implement `reinitializer(bytes32, uint256)` modifier
2. Create internal version validation function
3. Update `CounterTestWrapper` with reinitialisation examples
4. Develop comprehensive test suite covering:
    - Version progression validation
    - Duplicate reinitialisation prevention
    - Version skipping scenarios
    - Edge cases and error conditions

**Deliverables:**

- Functional `reinitializer` modifier
- Updated test contracts
- Test coverage report (target: 100%)

### Phase 3: Version Guard Implementation (1-3 Days)

**Tasks:**

1. Implement `onlyFromVersion(bytes32, uint256)` modifier
2. Create internal version checking function
3. Update `CounterTestWrapper` with version-gated functions
4. Develop test suite covering:
    - Access control based on version
    - Multiple version requirements
    - Integration with existing access control
    - Error messages and revert conditions

**Deliverables:**

- Functional `onlyFromVersion` modifier
- Complete test coverage
- Integration examples

### Phase 4: Documentation and Migration (2-3 Days)

**Tasks:**

1. Update contract documentation (NatSpec)
2. Create migration guide for existing contracts
3. Develop best practices guide
4. Create example implementations
5. Update deployment scripts
6. Conduct security review

**Deliverables:**

- Complete technical documentation
- Migration guide with examples
- Security audit report
- Deployment automation

### Total Estimated Timeline

**Optimistic:** 4-6 days  
**Realistic:** 6-9 days  
**Pessimistic:** 8-12 days (including comprehensive security review)

---

## 9. References

### Related Standards

- [OpenZeppelin Initializable Pattern](https://docs.openzeppelin.com/contracts/4.x/api/proxy#Initializable)
- [EIP-1967: Standard Proxy Storage Slots](https://eips.ethereum.org/EIPS/eip-1967)
- [EIP-2535: Diamond Standard](https://eips.ethereum.org/EIPS/eip-2535)

### Internal Documentation

- ISBE Diamond Architecture Overview
- Facet Development Guidelines
- Smart Contract Upgrade Procedures

### External Resources

- [Proxy Patterns for Upgradeable Contracts](https://blog.openzeppelin.com/proxy-patterns)
- [Safe Contract Upgrades](https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable)

---

## Appendix A: Version Numbering Convention

We recommend the following convention for version numbers:

- **Version 1:** Initial deployment
- **Version 2+:** Each significant state or logic change
- **Version jumps:** Reserved for breaking changes requiring reinitialisation

### Example Version History

```
v1.0 - Initial deployment with basic functionality
v2.0 - Added owner management (breaking: requires reinitialisation)
v2.1 - Bug fix (non-breaking: no reinitialisation needed)
v3.0 - Added new state variables (breaking: requires reinitialisation)
```

---

## Appendix B: Testing Checklist

- [ ] Initializer prevents duplicate initialisation
- [ ] Reinitializer validates version progression
- [ ] Reinitializer prevents downgrade
- [ ] OnlyFromVersion enforces minimum version
- [ ] Multiple facets can version independently
- [ ] Gas consumption within acceptable limits
- [ ] Events emitted correctly
- [ ] Error messages are clear and actionable
- [ ] Integration with existing access control works
- [ ] Migration from boolean to uint256 storage is safe

---

**Document Control:**

- **Author:** ISBE Contracts Team
- **Reviewers:** [To be assigned]
- **Approved By:** [Pending]
- **Next Review Date:** [To be determined]
