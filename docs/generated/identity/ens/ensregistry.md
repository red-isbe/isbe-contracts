## ENS

Core interface for managing decentralised domain name resolution and ownership

_Provides hierarchical domain management with resolver delegation and operator
approval mechanisms for efficient name service operations_

### EnsRegistryInitialised

```solidity
event EnsRegistryInitialised(address ownerRootNode)
```

@notice Event emitted when the contract is initiated.
@param ownerRootNode The address of the root node belonging to the contract's owner.

### NewOwner

```solidity
event NewOwner(bytes32 node, bytes32 label, address newOwner)
```

@notice Emitted when ownership of a sub-node is assigned to a new owner
@param node The parent node hash under which the sub-node is created
@param label The keccak256 hash of the sub-node label being assigned
@param newOwner The address receiving ownership of the new sub-node

### Transfer

```solidity
event Transfer(bytes32 node, address owner)
```

Emitted when node ownership is transferred to a new account

#### Parameters

| Name  | Type    | Description                                      |
| ----- | ------- | ------------------------------------------------ |
| node  | bytes32 | The node hash being transferred to new ownership |
| owner | address | The address receiving ownership of the node      |

### NewResolver

```solidity
event NewResolver(bytes32 node, address resolver)
```

Emitted when the resolver contract for a node is updated

#### Parameters

| Name     | Type    | Description                                         |
| -------- | ------- | --------------------------------------------------- |
| node     | bytes32 | The node hash receiving the new resolver assignment |
| resolver | address | The address of the new resolver contract            |

### NewTTL

```solidity
event NewTTL(bytes32 node, uint64 ttl)
```

Emitted when the time-to-live value for a node is modified

#### Parameters

| Name | Type    | Description                                                |
| ---- | ------- | ---------------------------------------------------------- |
| node | bytes32 | The node hash receiving the new TTL value                  |
| ttl  | uint64  | The new time-to-live value in seconds for caching purposes |

### ApprovalForAll

```solidity
event ApprovalForAll(address owner, address operator, bool approved)
```

Emitted when operator approval status changes for an owner

#### Parameters

| Name     | Type    | Description                                                 |
| -------- | ------- | ----------------------------------------------------------- |
| owner    | address | The address granting or revoking operator permissions       |
| operator | address | The address receiving or losing operator permissions        |
| approved | bool    | Boolean indicating whether operator permissions are granted |

### NotAuthorised

```solidity
error NotAuthorised(bytes32 node, address caller)
```

### CallerLacksENSAdministrativeRole

```solidity
error CallerLacksENSAdministrativeRole(address sender)
```

Raised when a caller lacks the required ENS administrative role for the operation

_Triggered when an address attempts to execute administrative ENS functions without
possessing either ENS_ROLE or ENS_MANAGER_ROLE permissions. This error ensures
proper access control for critical ENS registry management operations_

#### Parameters

| Name   | Type    | Description                                                          |
| ------ | ------- | -------------------------------------------------------------------- |
| sender | address | The address that attempted the unauthorised administrative operation |

### initialiseEnsRegistry

```solidity
function initialiseEnsRegistry(address _ownerRootNode) external
```

Initialises the ENS registry with a specified owner root node.

#### Parameters

| Name            | Type    | Description                                               |
| --------------- | ------- | --------------------------------------------------------- |
| \_ownerRootNode | address | The address of the owner's root node in the ENS registry. |

### setRecord

```solidity
function setRecord(bytes32 node, address owner, address resolver, uint64 ttl) external
```

Sets complete record information for a node in a single transaction

_Updates owner, resolver, and TTL atomically to maintain consistency_

#### Parameters

| Name     | Type    | Description                                                |
| -------- | ------- | ---------------------------------------------------------- |
| node     | bytes32 | The node hash to update with new record information        |
| owner    | address | The address to assign as the new node owner                |
| resolver | address | The resolver contract address for handling node queries    |
| ttl      | uint64  | The time-to-live value in seconds for caching optimisation |

### setSubnodeRecord

```solidity
function setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl) external
```

Creates a subnode with complete record information

_Combines subnode creation with record setting for efficiency_

#### Parameters

| Name     | Type    | Description                                            |
| -------- | ------- | ------------------------------------------------------ |
| node     | bytes32 | The parent node hash under which to create the subnode |
| label    | bytes32 | The keccak256 hash of the subnode label                |
| owner    | address | The address to assign as owner of the new subnode      |
| resolver | address | The resolver contract address for the new subnode      |
| ttl      | uint64  | The time-to-live value for the new subnode record      |

### setSubnodeOwner

```solidity
function setSubnodeOwner(bytes32 node, bytes32 label, address owner) external returns (bytes32 subnodeHash)
```

Creates a new subnode and assigns ownership

_Requires caller to be authorised to modify the parent node_

#### Parameters

| Name  | Type    | Description                                            |
| ----- | ------- | ------------------------------------------------------ |
| node  | bytes32 | The parent node hash under which to create the subnode |
| label | bytes32 | The keccak256 hash of the subnode label                |
| owner | address | The address to receive ownership of the new subnode    |

#### Return Values

| Name        | Type    | Description                                    |
| ----------- | ------- | ---------------------------------------------- |
| subnodeHash | bytes32 | The computed hash of the newly created subnode |

### setResolver

```solidity
function setResolver(bytes32 node, address resolver) external
```

@notice Updates the resolver contract address for a node.
@dev Requires caller to be the node owner or approved operator.
@param node The node hash to update with a new resolver.
@param resolver The address of the new resolver contract.

### setOwner

```solidity
function setOwner(bytes32 node, address owner) external
```

@notice Transfers ownership of a node to a new address.
@dev Requires caller to be the current node owner or approved operator.
@param node The node hash to transfer to new ownership.
@param owner The address to receive ownership of the node.

### setTTL

```solidity
function setTTL(bytes32 node, uint64 ttl) external
```

@notice Updates the time-to-live value for a node.
@dev Affects caching behaviour for resolvers and clients.
@param node The node hash to update with a new TTL value.
@param ttl The new time-to-live value in seconds.

### setApprovalForAll

```solidity
function setApprovalForAll(address operator, bool approved) external
```

@notice Grants or revokes operator permissions for all caller's nodes.
@dev Allows operators to manage nodes on behalf of the owner.
@param operator The address to grant or revoke operator permissions.
@param approved Boolean indicating whether to grant or revoke permissions.

### owner

```solidity
function owner(bytes32 _node) external view returns (address ownerAddress_)
```

Retrieves the current owner address of a node

_Returns the address with management rights for the specified node_

#### Parameters

| Name   | Type    | Description                                      |
| ------ | ------- | ------------------------------------------------ |
| \_node | bytes32 | The node hash to query for ownership information |

#### Return Values

| Name           | Type    | Description                              |
| -------------- | ------- | ---------------------------------------- |
| ownerAddress\_ | address | The address that owns the specified node |

### resolver

```solidity
function resolver(bytes32 _node) external view returns (address resolverAddress_)
```

Retrieves the resolver contract address for a node

_Returns the contract responsible for resolving queries for this node_

#### Parameters

| Name   | Type    | Description                                     |
| ------ | ------- | ----------------------------------------------- |
| \_node | bytes32 | The node hash to query for resolver information |

#### Return Values

| Name              | Type    | Description                                 |
| ----------------- | ------- | ------------------------------------------- |
| resolverAddress\_ | address | The address of the node's resolver contract |

### ttl

```solidity
function ttl(bytes32 _node) external view returns (uint64 ttlValue_)
```

Retrieves the time-to-live value for a node

_Returns the caching duration in seconds for the specified node_

#### Parameters

| Name   | Type    | Description                                |
| ------ | ------- | ------------------------------------------ |
| \_node | bytes32 | The node hash to query for TTL information |

#### Return Values

| Name       | Type   | Description                       |
| ---------- | ------ | --------------------------------- |
| ttlValue\_ | uint64 | The time-to-live value for a node |

### recordExists

```solidity
function recordExists(bytes32 node) external view returns (bool exists)
```

Checks whether a record exists for the specified node

_Determines if a node has been registered in the ENS registry_

#### Parameters

| Name | Type    | Description                          |
| ---- | ------- | ------------------------------------ |
| node | bytes32 | The node hash to check for existence |

#### Return Values

| Name   | Type | Description                                       |
| ------ | ---- | ------------------------------------------------- |
| exists | bool | Boolean indicating whether the node record exists |

### isApprovedForAll

```solidity
function isApprovedForAll(address owner, address operator) external view returns (bool isApproved)
```

Checks if an operator is approved to manage all nodes for an owner

_Validates operator permissions for node management operations_

#### Parameters

| Name     | Type    | Description                                                |
| -------- | ------- | ---------------------------------------------------------- |
| owner    | address | The address that granted or may grant operator permissions |
| operator | address | The address to check for operator approval status          |

#### Return Values

| Name       | Type | Description                                              |
| ---------- | ---- | -------------------------------------------------------- |
| isApproved | bool | Boolean indicating if operator is approved for all nodes |

---

## EnsRegistry

External implementation of ENS domain name registry with pause and authorisation controls

_Abstract contract that exposes the ENS interface whilst delegating core logic to internal
functions. Applies pause protection on write operations, authorisation checks, and
role-based access control for administrative operations. Implements ERC-165 interface
introspection for ENS compatibility_

### initialiseEnsRegistry

```solidity
function initialiseEnsRegistry(address _ownerRootNode) external
```

Initializes the ENS registry with a specified owner root node.

#### Parameters

| Name            | Type    | Description                                               |
| --------------- | ------- | --------------------------------------------------------- |
| \_ownerRootNode | address | The address of the owner's root node in the ENS registry. |

### setRecord

```solidity
function setRecord(bytes32 _node, address _owner, address _resolver, uint64 _ttl) external
```

Sets the complete record data for a node in a single atomic operation

_External function with pause and authorisation protection. Updates owner, resolver,
and TTL simultaneously for gas optimisation and consistency_

#### Parameters

| Name       | Type    | Description                                              |
| ---------- | ------- | -------------------------------------------------------- |
| \_node     | bytes32 | The node hash to update with new record data             |
| \_owner    | address | The new owner address for the node                       |
| \_resolver | address | The new resolver contract address for resolution queries |
| \_ttl      | uint64  | The new time-to-live value in seconds for caching        |

### setSubnodeRecord

```solidity
function setSubnodeRecord(bytes32 node, bytes32 label, address owner_, address resolver_, uint64 ttl_) external
```

Creates or updates a subnode with complete record information

_External function that computes subnode hash and sets all record fields atomically.
Requires authorisation on the parent node and respects pause state_

#### Parameters

| Name       | Type    | Description                                            |
| ---------- | ------- | ------------------------------------------------------ |
| node       | bytes32 | The parent node hash under which to create the subnode |
| label      | bytes32 | The label hash identifying the subdomain name          |
| owner\_    | address | The owner address for the new subnode                  |
| resolver\_ | address | The resolver contract address for the subnode          |
| ttl\_      | uint64  | The time-to-live value in seconds for the subnode      |

### setSubnodeOwner

```solidity
function setSubnodeOwner(bytes32 node, bytes32 label, address owner_) external returns (bytes32 subnodeHash)
```

Creates a new subnode or transfers ownership of an existing subnode

_External function that computes the subnode hash and assigns ownership.
Emits NewOwner event and requires parent node authorisation_

#### Parameters

| Name    | Type    | Description                                                      |
| ------- | ------- | ---------------------------------------------------------------- |
| node    | bytes32 | The parent node hash under which to create or modify the subnode |
| label   | bytes32 | The label hash for the subdomain identifier                      |
| owner\_ | address | The address to receive ownership of the subnode                  |

#### Return Values

| Name        | Type    | Description                                          |
| ----------- | ------- | ---------------------------------------------------- |
| subnodeHash | bytes32 | The computed hash of the created or modified subnode |

### setResolver

```solidity
function setResolver(bytes32 node, address resolver_) external
```

Updates the resolver contract address for domain name resolution

_External function that sets the resolver for a node with authorisation and pause
checks. Emits NewResolver event for off-chain tracking_

#### Parameters

| Name       | Type    | Description                                            |
| ---------- | ------- | ------------------------------------------------------ |
| node       | bytes32 | The node hash to update with a new resolver            |
| resolver\_ | address | The new resolver contract address for handling queries |

### setOwner

```solidity
function setOwner(bytes32 node, address owner_) external
```

Transfers ownership of a domain node to a new address

_External function that changes node ownership with proper authorisation checks.
Emits Transfer event and respects system pause state_

#### Parameters

| Name    | Type    | Description                                  |
| ------- | ------- | -------------------------------------------- |
| node    | bytes32 | The node hash to transfer to a new owner     |
| owner\_ | address | The address to receive ownership of the node |

### setTTL

```solidity
function setTTL(bytes32 node, uint64 ttl_) external
```

Updates the time-to-live value for domain caching behaviour

_External function that sets TTL with authorisation validation and pause protection.
Emits NewTTL event for cache infrastructure updates_

#### Parameters

| Name  | Type    | Description                                                |
| ----- | ------- | ---------------------------------------------------------- |
| node  | bytes32 | The node hash to update with a new TTL value               |
| ttl\_ | uint64  | The new time-to-live value in seconds for caching duration |

### setApprovalForAll

```solidity
function setApprovalForAll(address operator, bool approved) external
```

Grants or revokes operator approval for all caller's domain nodes

_External function enabling delegation of domain management rights.
Emits ApprovalForAll event and respects pause state for security_

#### Parameters

| Name     | Type    | Description                                              |
| -------- | ------- | -------------------------------------------------------- |
| operator | address | The address to grant or revoke operator permissions      |
| approved | bool    | True to grant full operator rights, false to revoke them |

### owner

```solidity
function owner(bytes32 node) external view returns (address ownerAddress)
```

Retrieves the current owner address of a domain node

_External view function providing read access to node ownership information_

#### Parameters

| Name | Type    | Description                          |
| ---- | ------- | ------------------------------------ |
| node | bytes32 | The node hash to query for ownership |

#### Return Values

| Name         | Type    | Description                                        |
| ------------ | ------- | -------------------------------------------------- |
| ownerAddress | address | The address that currently owns the specified node |

### resolver

```solidity
function resolver(bytes32 node) external view returns (address resolverAddress)
```

Retrieves the resolver contract address for a domain node

_External view function providing access to resolution configuration_

#### Parameters

| Name | Type    | Description                             |
| ---- | ------- | --------------------------------------- |
| node | bytes32 | The node hash to query for its resolver |

#### Return Values

| Name            | Type    | Description                                            |
| --------------- | ------- | ------------------------------------------------------ |
| resolverAddress | address | The contract address handling resolution for this node |

### ttl

```solidity
function ttl(bytes32 node) external view returns (uint64 ttlValue)
```

Retrieves the time-to-live value for domain caching

_External view function providing access to TTL configuration for cache management_

#### Parameters

| Name | Type    | Description                              |
| ---- | ------- | ---------------------------------------- |
| node | bytes32 | The node hash to query for its TTL value |

#### Return Values

| Name     | Type   | Description                                      |
| -------- | ------ | ------------------------------------------------ |
| ttlValue | uint64 | The time-to-live duration in seconds for caching |

### recordExists

```solidity
function recordExists(bytes32 node) external view returns (bool exists)
```

Checks whether a domain record has been explicitly created

_External view function determining if a node has been registered in the system_

#### Parameters

| Name | Type    | Description                                 |
| ---- | ------- | ------------------------------------------- |
| node | bytes32 | The node hash to check for record existence |

#### Return Values

| Name   | Type | Description                                                     |
| ------ | ---- | --------------------------------------------------------------- |
| exists | bool | True if the record has been explicitly created, false otherwise |

### isApprovedForAll

```solidity
function isApprovedForAll(address owner_, address operator) external view returns (bool isApproved)
```

Checks if an operator has approval rights for all nodes of an owner

_External view function for validating delegation permissions_

#### Parameters

| Name     | Type    | Description                                       |
| -------- | ------- | ------------------------------------------------- |
| owner\_  | address | The address that owns the domain nodes            |
| operator | address | The address to check for operator approval status |

#### Return Values

| Name       | Type | Description                                         |
| ---------- | ---- | --------------------------------------------------- |
| isApproved | bool | True if operator has approval for all owner's nodes |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure returns (bytes4[] interfaces_)
```

Provides interface introspection support for ENS compatibility

_Internal pure function enabling ERC-165 interface detection for ENS.
Allows upper layers or facets to announce ENS interface support_

#### Return Values

| Name         | Type     | Description                                                     |
| ------------ | -------- | --------------------------------------------------------------- |
| interfaces\_ | bytes4[] | Array containing the ENS interface identifier for introspection |

---

## EnsRegistryFacet

Faceta EIP-2535 que expone la funcionalidad del registro ENS

_Hereda de EnsRegistry y publica introspección de interfaces/negocio/selectores_

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Gets the list of ERC-165 interface IDs the facet supports.

_A pure function that returns an array of supported `bytes4` IDs._

#### Return Values

| Name         | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| interfaces\_ | bytes4[] | An array of supported interface identifiers. |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Retrieves the unique business identifier for this facet.

_Returns a `bytes32` key identifying the facet's purpose._

#### Return Values

| Name         | Type    | Description                              |
| ------------ | ------- | ---------------------------------------- |
| businessId\_ | bytes32 | The `bytes32` ID for the business logic. |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Gets all function selectors implemented by this facet.

_A pure function that returns a `bytes4[]` array of selectors._

#### Return Values

| Name        | Type     | Description                              |
| ----------- | -------- | ---------------------------------------- |
| selectors\_ | bytes4[] | An array of `bytes4` function selectors. |

---

## EnsRegistryInternal

Internal implementation contract providing core ENS domain name management

_Abstract contract implementing the core logic for decentralised domain name
registry operations including ownership, resolution, and authorisation management.
Uses unstructured storage to enable upgradeable proxy patterns with role-based
access control for administrative operations_

### EnsRegistryStorage

Storage structure containing all ENS registry state data

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct EnsRegistryStorage {
    mapping(bytes32 => address) owners;
    mapping(bytes32 => address) resolvers;
    mapping(bytes32 => uint64) ttls;
    mapping(address => mapping(address => bool)) operators;
    mapping(bytes32 => bool) records;
}
```

### onlyAuthorised

```solidity
modifier onlyAuthorised(bytes32 _node)
```

Restricts function access to authorised parties only

_Validates that the caller either owns the node or is an approved operator_

#### Parameters

| Name   | Type    | Description                                  |
| ------ | ------- | -------------------------------------------- |
| \_node | bytes32 | The node hash to check authorisation against |

### \_setRecord

```solidity
function _setRecord(bytes32 _node, address newOwner, address newResolver, uint64 newTtl) internal
```

### \_setSubnodeRecord

```solidity
function _setSubnodeRecord(bytes32 _node, bytes32 _label, address newOwner, address newResolver, uint64 newTtl) internal returns (bytes32 subnode_)
```

### \_setSubnodeOwner

```solidity
function _setSubnodeOwner(bytes32 _node, bytes32 _label, address newOwner) internal returns (bytes32 subnode_)
```

### \_setResolver

```solidity
function _setResolver(bytes32 _node, address newResolver) internal
```

### \_setOwner

```solidity
function _setOwner(bytes32 _node, address newOwner) internal
```

### \_setTTL

```solidity
function _setTTL(bytes32 _node, uint64 newTtl) internal
```

### \_setApprovalForAll

```solidity
function _setApprovalForAll(address ownerAddr, address operator, bool approved) internal
```

### \_createRootNode

```solidity
function _createRootNode(bytes32 _node, address _nodeOwner) internal
```

### \_owner

```solidity
function _owner(bytes32 _node) internal view returns (address)
```

### \_resolver

```solidity
function _resolver(bytes32 _node) internal view returns (address)
```

### \_ttl

```solidity
function _ttl(bytes32 _node) internal view returns (uint64)
```

### \_recordExists

```solidity
function _recordExists(bytes32 _node) internal view returns (bool)
```

### \_isApprovedForAll

```solidity
function _isApprovedForAll(address ownerAddr, address operator) internal view returns (bool)
```

### \_isAuthorised

```solidity
function _isAuthorised(bytes32 _node, address _caller) internal view returns (bool)
```
