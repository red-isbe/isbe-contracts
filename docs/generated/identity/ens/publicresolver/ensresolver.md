## EnsResolver

External implementation of ENS resolver providing comprehensive delegation and approval management

_Abstract contract that exposes the IEnsResolver interface whilst delegating core logic to internal
functions. Applies pause protection on write operations, authorisation checks, and
role-based access control for administrative operations. Implements ERC-165 interface
introspection for ENS resolver compatibility_

### initializePublicResolver

```solidity
function initializePublicResolver(contract ENS _ens) external
```

Initialises the ENS resolver with ENS registry reference

_Establishes the connection to the ENS registry for ownership verification_

#### Parameters

| Name  | Type         | Description                                                |
| ----- | ------------ | ---------------------------------------------------------- |
| \_ens | contract ENS | The ENS registry contract address for resolver integration |

### setApprovalForAll

```solidity
function setApprovalForAll(address operator, bool approved) external
```

Grants or revokes operator permissions for all caller's ENS nodes

_Provides comprehensive access control for resolver operations across all nodes_

#### Parameters

| Name     | Type    | Description                                               |
| -------- | ------- | --------------------------------------------------------- |
| operator | address | The address to grant or revoke operator permissions for   |
| approved | bool    | Boolean indicating whether to grant or revoke permissions |

### approve

```solidity
function approve(bytes32 node, address delegate, bool approved) external
```

Grants or revokes delegate permissions for a specific ENS node

_Enables fine-grained access control for individual node operations_

#### Parameters

| Name     | Type    | Description                                               |
| -------- | ------- | --------------------------------------------------------- |
| node     | bytes32 | The ENS node hash to manage delegate permissions for      |
| delegate | address | The address to grant or revoke delegate permissions for   |
| approved | bool    | Boolean indicating whether to grant or revoke permissions |

### isApprovedForAll

```solidity
function isApprovedForAll(address account, address operator) external view returns (bool isApproved)
```

Checks if an address has operator permissions for another account

_Verifies comprehensive operator status across all nodes for an account_

#### Parameters

| Name     | Type    | Description                                           |
| -------- | ------- | ----------------------------------------------------- |
| account  | address | The account address to check operator permissions for |
| operator | address | The address to verify as an operator                  |

#### Return Values

| Name       | Type | Description                                            |
| ---------- | ---- | ------------------------------------------------------ |
| isApproved | bool | Boolean indicating if operator permissions are granted |

### isApprovedFor

```solidity
function isApprovedFor(address owner, bytes32 node, address delegate) external view returns (bool isApproved)
```

Checks if an address has delegate permissions for a specific node

_Verifies node-specific delegate status for targeted access control_

#### Parameters

| Name     | Type    | Description                                              |
| -------- | ------- | -------------------------------------------------------- |
| owner    | address | The owner address to check delegate permissions for      |
| node     | bytes32 | The ENS node hash to verify delegate permissions against |
| delegate | address | The address to verify as a delegate                      |

#### Return Values

| Name       | Type | Description                                            |
| ---------- | ---- | ------------------------------------------------------ |
| isApproved | bool | Boolean indicating if delegate permissions are granted |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure returns (bytes4[] interfaces_)
```

Provides interface introspection support for ENS resolver compatibility

_Internal pure function enabling ERC-165 interface detection for ENS resolver.
Allows upper layers or facets to announce ENS resolver interface support_

#### Return Values

| Name         | Type     | Description                                                              |
| ------------ | -------- | ------------------------------------------------------------------------ |
| interfaces\_ | bytes4[] | Array containing the ENS resolver interface identifier for introspection |

---

## EnsResolverFacet

EIP-2535 facet that exposes the core ENS resolver functionality

_Inherits from EnsResolver and provides introspection of interfaces, business logic, and selectors_

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Returns the interfaces implemented by this facet

_Provides ERC-165 interface introspection for ENS resolver compatibility_

#### Return Values

| Name         | Type     | Description                                                        |
| ------------ | -------- | ------------------------------------------------------------------ |
| interfaces\_ | bytes4[] | Array containing the interface identifiers supported by this facet |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Returns the business identifier for this facet

_Provides the unique resolver key that identifies this business logic component_

#### Return Values

| Name         | Type    | Description                                                                |
| ------------ | ------- | -------------------------------------------------------------------------- |
| businessId\_ | bytes32 | The resolver key that uniquely identifies this ENS resolver implementation |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Returns the function selectors exposed by this facet

_Lists all external functions available through this facet for diamond proxy integration_

#### Return Values

| Name        | Type     | Description                                                 |
| ----------- | -------- | ----------------------------------------------------------- |
| selectors\_ | bytes4[] | Array of function selectors that this facet makes available |

---

## EnsResolverInternal

Root internal implementation contract providing core ENS resolver functionality

_Abstract contract implementing the core logic for ENS resolution with delegation,
approval management, and ENS registry integration. Uses unstructured storage to
enable upgradeable proxy patterns with role-based access control. This serves as
the base for all resolver profile implementations (Name, Text, Pubkey, etc.)_

### EnsResolverStorage

Storage structure containing all ENS resolver state data

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct EnsResolverStorage {
  contract ENS ens;
  mapping(address => mapping(address => bool)) operators;
  mapping(address => mapping(bytes32 => mapping(address => bool))) delegates;
}
```

### onlyAuthorised

```solidity
modifier onlyAuthorised(bytes32 _node)
```

Restricts function access to authorised parties only

_Validates that the caller is authorised to modify the specified node through
node ownership, operator delegation, node-specific delegation, or ENS manager role_

#### Parameters

| Name   | Type    | Description                                      |
| ------ | ------- | ------------------------------------------------ |
| \_node | bytes32 | The ENS node hash to check authorisation against |

### \_initializeEnsResolver

```solidity
function _initializeEnsResolver(contract ENS _ensRegistry) internal
```

Initialises the ENS resolver with ENS registry reference

_Internal function establishing connection to ENS registry for ownership verification_

#### Parameters

| Name          | Type         | Description                                                |
| ------------- | ------------ | ---------------------------------------------------------- |
| \_ensRegistry | contract ENS | The ENS registry contract address for resolver integration |

### \_setApprovalForAll

```solidity
function _setApprovalForAll(address _owner, address _operator, bool _approved) internal
```

Sets operator approval for all caller's ENS nodes

_Internal function managing comprehensive access control across all nodes_

#### Parameters

| Name       | Type    | Description                                               |
| ---------- | ------- | --------------------------------------------------------- |
| \_owner    | address | The address granting or revoking operator permissions     |
| \_operator | address | The address to grant or revoke operator permissions for   |
| \_approved | bool    | Boolean indicating whether to grant or revoke permissions |

### \_approve

```solidity
function _approve(address _owner, bytes32 _node, address _delegate, bool _approved) internal
```

Sets delegate approval for a specific ENS node

_Internal function enabling fine-grained access control for individual nodes_

#### Parameters

| Name       | Type    | Description                                               |
| ---------- | ------- | --------------------------------------------------------- |
| \_owner    | address | The address granting or revoking delegate permissions     |
| \_node     | bytes32 | The ENS node hash to manage delegate permissions for      |
| \_delegate | address | The address to grant or revoke delegate permissions for   |
| \_approved | bool    | Boolean indicating whether to grant or revoke permissions |

### \_ens

```solidity
function _ens() internal view returns (contract ENS)
```

Retrieves the ENS registry contract reference

_Internal view function providing access to the ENS registry for ownership queries_

#### Return Values

| Name | Type         | Description                        |
| ---- | ------------ | ---------------------------------- |
| [0]  | contract ENS | The ENS registry contract instance |

### \_isApprovedForAll

```solidity
function _isApprovedForAll(address _account, address _operator) internal view returns (bool)
```

Checks if an address has operator permissions for another account

_Internal view function verifying comprehensive operator status across all nodes_

#### Parameters

| Name       | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| \_account  | address | The account address to check operator permissions for |
| \_operator | address | The address to verify as an operator                  |

#### Return Values

| Name | Type | Description                                            |
| ---- | ---- | ------------------------------------------------------ |
| [0]  | bool | Boolean indicating if operator permissions are granted |

### \_isApprovedFor

```solidity
function _isApprovedFor(address _owner, bytes32 _node, address _delegate) internal view returns (bool)
```

Checks if an address has delegate permissions for a specific node

_Internal view function verifying node-specific delegate status_

#### Parameters

| Name       | Type    | Description                                              |
| ---------- | ------- | -------------------------------------------------------- |
| \_owner    | address | The owner address to check delegate permissions for      |
| \_node     | bytes32 | The ENS node hash to verify delegate permissions against |
| \_delegate | address | The address to verify as a delegate                      |

#### Return Values

| Name | Type | Description                                            |
| ---- | ---- | ------------------------------------------------------ |
| [0]  | bool | Boolean indicating if delegate permissions are granted |

### \_isAuthorised

```solidity
function _isAuthorised(bytes32 _node, address _caller) internal view returns (bool)
```

Validates if an address is authorised to modify a specific ENS node

_Internal view function checking comprehensive authorisation through multiple mechanisms_

#### Parameters

| Name     | Type    | Description                                      |
| -------- | ------- | ------------------------------------------------ |
| \_node   | bytes32 | The ENS node hash to check authorisation against |
| \_caller | address | The address to validate authorisation for        |

#### Return Values

| Name | Type | Description                                                 |
| ---- | ---- | ----------------------------------------------------------- |
| [0]  | bool | Boolean indicating if the caller is authorised for the node |

---

## IEnsResolver

### ApprovalForAll

```solidity
event ApprovalForAll(address owner, address operator, bool approved)
```

Emitted when an operator is granted or revoked comprehensive permissions

#### Parameters

| Name     | Type    | Description                                                 |
| -------- | ------- | ----------------------------------------------------------- |
| owner    | address | The address granting or revoking operator permissions       |
| operator | address | The address receiving or losing operator permissions        |
| approved | bool    | Boolean indicating whether operator permissions are granted |

### Approved

```solidity
event Approved(address owner, bytes32 node, address delegate, bool approved)
```

Emitted when a delegate is approved or revoked for specific node operations

#### Parameters

| Name     | Type    | Description                                                 |
| -------- | ------- | ----------------------------------------------------------- |
| owner    | address | The address granting or revoking delegate permissions       |
| node     | bytes32 | The ENS node hash for which delegation is being managed     |
| delegate | address | The address receiving or losing delegate permissions        |
| approved | bool    | Boolean indicating whether delegate permissions are granted |

### PublicResolverInitialized

```solidity
event PublicResolverInitialized(address _ens)
```

Emitted when the public resolver is initialised with ENS registry reference

#### Parameters

| Name  | Type    | Description                                               |
| ----- | ------- | --------------------------------------------------------- |
| \_ens | address | The address of the ENS registry contract being associated |

### NotAuthorisedForNode

```solidity
error NotAuthorisedForNode(bytes32 node, address caller)
```

Raised when an unauthorised address attempts to modify a node

_Triggered when the caller lacks ownership, operator, or delegate permissions for the node_

#### Parameters

| Name   | Type    | Description                                       |
| ------ | ------- | ------------------------------------------------- |
| node   | bytes32 | The node hash that the caller attempted to modify |
| caller | address | The address that made the unauthorised attempt    |

### initializePublicResolver

```solidity
function initializePublicResolver(contract ENS _ens) external
```

Initialises the public resolver with ENS registry reference

_Establishes the connection to the ENS registry for ownership verification_

#### Parameters

| Name  | Type         | Description                                                |
| ----- | ------------ | ---------------------------------------------------------- |
| \_ens | contract ENS | The ENS registry contract address for resolver integration |

### setApprovalForAll

```solidity
function setApprovalForAll(address operator, bool approved) external
```

Grants or revokes operator permissions for all caller's ENS nodes

_Provides comprehensive access control for resolver operations across all nodes_

#### Parameters

| Name     | Type    | Description                                               |
| -------- | ------- | --------------------------------------------------------- |
| operator | address | The address to grant or revoke operator permissions for   |
| approved | bool    | Boolean indicating whether to grant or revoke permissions |

### approve

```solidity
function approve(bytes32 node, address delegate, bool approved) external
```

Grants or revokes delegate permissions for a specific ENS node

_Enables fine-grained access control for individual node operations_

#### Parameters

| Name     | Type    | Description                                               |
| -------- | ------- | --------------------------------------------------------- |
| node     | bytes32 | The ENS node hash to manage delegate permissions for      |
| delegate | address | The address to grant or revoke delegate permissions for   |
| approved | bool    | Boolean indicating whether to grant or revoke permissions |

### isApprovedForAll

```solidity
function isApprovedForAll(address account, address operator) external view returns (bool isApproved)
```

Checks if an address has operator permissions for another account

_Verifies comprehensive operator status across all nodes for an account_

#### Parameters

| Name     | Type    | Description                                           |
| -------- | ------- | ----------------------------------------------------- |
| account  | address | The account address to check operator permissions for |
| operator | address | The address to verify as an operator                  |

#### Return Values

| Name       | Type | Description                                            |
| ---------- | ---- | ------------------------------------------------------ |
| isApproved | bool | Boolean indicating if operator permissions are granted |

### isApprovedFor

```solidity
function isApprovedFor(address owner, bytes32 node, address delegate) external view returns (bool isApproved)
```

Checks if an address has delegate permissions for a specific node

_Verifies node-specific delegate status for targeted access control_

#### Parameters

| Name     | Type    | Description                                              |
| -------- | ------- | -------------------------------------------------------- |
| owner    | address | The owner address to check delegate permissions for      |
| node     | bytes32 | The ENS node hash to verify delegate permissions against |
| delegate | address | The address to verify as a delegate                      |

#### Return Values

| Name       | Type | Description                                            |
| ---------- | ---- | ------------------------------------------------------ |
| isApproved | bool | Boolean indicating if delegate permissions are granted |
