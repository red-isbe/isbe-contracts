## ENS

Core interface for managing decentralised domain name resolution and ownership

_Provides hierarchical domain management with resolver delegation and operator
approval mechanisms for efficient name service operations_

### NewOwner

```solidity
event NewOwner(bytes32 node, bytes32 label, address owner)
```

Emitted when ownership of a subnode is assigned to a new owner

#### Parameters

| Name  | Type    | Description                                             |
| ----- | ------- | ------------------------------------------------------- |
| node  | bytes32 | The parent node hash under which the subnode is created |
| label | bytes32 | The keccak256 hash of the subnode label being assigned  |
| owner | address | The address receiving ownership of the new subnode      |

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

Updates the resolver contract address for a node

_Requires caller to be the node owner or approved operator_

#### Parameters

| Name     | Type    | Description                                 |
| -------- | ------- | ------------------------------------------- |
| node     | bytes32 | The node hash to update with a new resolver |
| resolver | address | The address of the new resolver contract    |

### setOwner

```solidity
function setOwner(bytes32 node, address owner) external
```

Transfers ownership of a node to a new address

_Requires caller to be the current node owner or approved operator_

#### Parameters

| Name  | Type    | Description                                  |
| ----- | ------- | -------------------------------------------- |
| node  | bytes32 | The node hash to transfer to new ownership   |
| owner | address | The address to receive ownership of the node |

### setTTL

```solidity
function setTTL(bytes32 node, uint64 ttl) external
```

Updates the time-to-live value for a node

_Affects caching behaviour for resolvers and clients_

#### Parameters

| Name | Type    | Description                                  |
| ---- | ------- | -------------------------------------------- |
| node | bytes32 | The node hash to update with a new TTL value |
| ttl  | uint64  | The new time-to-live value in seconds        |

### setApprovalForAll

```solidity
function setApprovalForAll(address operator, bool approved) external
```

Grants or revokes operator permissions for all caller's nodes

_Allows operators to manage nodes on behalf of the owner_

#### Parameters

| Name     | Type    | Description                                               |
| -------- | ------- | --------------------------------------------------------- |
| operator | address | The address to grant or revoke operator permissions       |
| approved | bool    | Boolean indicating whether to grant or revoke permissions |

### owner

```solidity
function owner(bytes32 node) external view returns (address ownerAddress)
```

Retrieves the current owner address of a node

_Returns the address with management rights for the specified node_

#### Parameters

| Name | Type    | Description                                      |
| ---- | ------- | ------------------------------------------------ |
| node | bytes32 | The node hash to query for ownership information |

#### Return Values

| Name         | Type    | Description                              |
| ------------ | ------- | ---------------------------------------- |
| ownerAddress | address | The address that owns the specified node |

### resolver

```solidity
function resolver(bytes32 node) external view returns (address resolverAddress)
```

Retrieves the resolver contract address for a node

_Returns the contract responsible for resolving queries for this node_

#### Parameters

| Name | Type    | Description                                     |
| ---- | ------- | ----------------------------------------------- |
| node | bytes32 | The node hash to query for resolver information |

#### Return Values

| Name            | Type    | Description                                 |
| --------------- | ------- | ------------------------------------------- |
| resolverAddress | address | The address of the node's resolver contract |

### ttl

```solidity
function ttl(bytes32 node) external view returns (uint64 ttlValue)
```

Retrieves the time-to-live value for a node

_Returns the caching duration in seconds for the specified node_

#### Parameters

| Name | Type    | Description                                |
| ---- | ------- | ------------------------------------------ |
| node | bytes32 | The node hash to query for TTL information |

#### Return Values

| Name     | Type   | Description                       |
| -------- | ------ | --------------------------------- |
| ttlValue | uint64 | The time-to-live value in seconds |

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
