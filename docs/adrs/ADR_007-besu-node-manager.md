# ADR-007: Besu Node Manager Smart Contract

## Status

Proposed

## Context

Hyperledger Besu networks require robust management of different node types to maintain network health, security, and performance. The network operates with three distinct categories of nodes:

- **Validator Nodes**: Participate in consensus and block validation
- **Boot Nodes**: Facilitate peer discovery and network connectivity
- **Execution Nodes**: Process transactions and maintain network state

Each node type requires lifecycle management including registration, state transitions, and removal. The current implementation lacks a unified, on-chain mechanism to manage these nodes with proper access control and state tracking.

## Decision

Implement a Besu Node Manager smart contract following the Diamond Pattern (EIP-2535) architecture to manage the lifecycle of all node types in the network.

### Architecture

The implementation will consist of:

1. **Storage Library** (`LibBesuNodeManager.sol`)
    - Centralized storage using Diamond Pattern storage position
    - Node structure with enode, id (keccak256 hash), and timestamp
    - State mappings for each node category
    - Helper functions for state validation and transitions

2. **Internal Implementation** (`BesuNodeManagerInternal.sol`)
    - Core business logic for node lifecycle management
    - State transition validation
    - Access control checks
    - Event emission

3. **Facet Interface** (`BesuNodeManagerFacet.sol`)
    - External functions implementing IBesuNodeManager interface
    - Pause mechanism integration
    - Delegation to internal implementation

4. **Interface Definition** (`IBesuNodeManager.sol`)
    - Public API specification
    - Event definitions
    - Enum types for node states

### Node States

**Validator States:**

- `none`: Not registered
- `active`: Validated and actively validating
- `standby`: Permissioned but not validating
- `quarantine`: Quarantined, not validating or permissioned

**Boot Node / Execution Node States:**

- `none`: Not registered
- `active`: Operational
- `quarantine`: Quarantined

### State Transitions

**Validators:**

```
none → active (add_validator)
none → standby (add_validator_standby)
standby → active (promote_validator)
active → standby (standby_validator)
standby → quarantine (add_quarantine)
quarantine → standby (remove_quarantine)
{active, standby, quarantine} → none (remove_validator)
```

**Boot Nodes / Execution Nodes:**

```
none → active (add_*)
active → quarantine (quarantine_*)
quarantine → active (unquarantine_*)
{active, quarantine} → none (remove_*)
```

### Security Measures

- Access control through governance roles
- Input validation for enode format
- Uniqueness enforcement across all node categories
- Prevention of invalid state transitions
- Comprehensive event logging for audit trail

### Storage Position

```solidity
bytes32 constant BESU_NODE_MANAGER_POSITION = keccak256(
    'com.isbe.besuNodeManager.storage'
);
```

### Data Retrieval and Pagination

Following the pattern established in `TimeStampingRegistry`, the contract provides efficient data retrieval with pagination support:

1. **Enumerable Sets**: Use OpenZeppelin's `EnumerableSet.Bytes32Set` for efficient storage and iteration
    - Separate sets for each node category and state combination
    - Validators: `activeValidators`, `standbyValidators`, `quarantinedValidators`
    - Boot Nodes: `activeBootNodes`, `quarantinedBootNodes`
    - Execution Nodes: `activeExecutionNodes`, `quarantinedExecutionNodes`

2. **Count Functions**:
    - `getTotalValidators(ValidatorState state)`: Get total count of validators by state
    - `getTotalBootNodes(BootNodeState state)`: Get total count of boot nodes by state
    - `getTotalExecutionNodes(ExecutionNodeState state)`: Get total count of execution nodes by state

3. **Pagination Functions**:
    - `getPaginatedValidators(ValidatorState state, uint256 pageSize, uint256 pageIndex)`: Get paginated validator list by state
    - `getPaginatedBootNodes(BootNodeState state, uint256 pageSize, uint256 pageIndex)`: Get paginated boot node list by state
    - `getPaginatedExecutionNodes(ExecutionNodeState state, uint256 pageSize, uint256 pageIndex)`: Get paginated execution node list by state

4. **Pagination Parameters**:
    - `state`: Filter nodes by their current state
    - `pageSize`: Number of items per page
    - `pageIndex`: 1-based page index (starts at 1, not 0)
    - Returns: Array of `Node` structs for the requested page
    - Uses `LibCommon.getPaginationParameters()` for cursor calculation and bounds checking

## Consequences

### Positive

- **Centralized Management**: Single source of truth for all node information
- **State Tracking**: Clear lifecycle management with defined state machines
- **Auditability**: Comprehensive event logging for all state changes
- **Upgradeability**: Diamond Pattern allows future enhancements without data migration
- **Access Control**: Governance integration ensures only authorized updates
- **Uniqueness**: Prevents duplicate node registration across categories

### Negative

- **Gas Costs**: On-chain storage and state transitions require gas
- **Complexity**: Additional layer of abstraction for node management
- **Migration**: Existing node configurations need migration to on-chain storage

### Risks

- **State Inconsistency**: Off-chain node status must sync with on-chain state
- **Performance**: High-frequency state changes may impact gas costs
- **Governance Dependencies**: Node management requires proper governance setup

## Implementation Notes

1. Storage position must be added to `constants/storagePositions.sol`
2. Storage structure must include:
    - Main node data mappings: `validators`, `bootNodes`, `executionNodes` (bytes32 → Node)
    - State mappings: `validatorStates`, `bootNodeStates`, `executionNodeStates` (bytes32 → enum)
    - Enumerable sets for each state: `activeValidators`, `standbyValidators`, `quarantinedValidators`, etc.
    - Helper function to return storage struct: `_besuNodeManagerStorage()`
3. State transitions must update both state mappings and enumerable sets atomically
4. Comprehensive test suite required with 100% coverage, including pagination edge cases
5. Integration with existing pause mechanism mandatory
6. NatSpec documentation required for all public functions
7. Slither security analysis must pass with zero critical issues
8. Consider batching operations for multiple node updates to reduce gas costs
9. Follow the pattern from `TimeStampingRegistryInternal.sol` for pagination implementation

## Related ADRs

- ADR-001: Diamond Pattern Implementation
- ADR-002: Governance Layer Architecture
- ADR-003: Pause Mechanism

## References

- Hyperledger Besu Node Permissioning: https://besu.hyperledger.org/
- EIP-2535 Diamond Pattern: https://eips.ethereum.org/EIPS/eip-2535
- OpenZeppelin Access Control: https://docs.openzeppelin.com/contracts/access-control
