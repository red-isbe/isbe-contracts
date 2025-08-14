## IPublicResolver

Interface for the canonical ENS resolver providing comprehensive name resolution
services with delegation and approval mechanisms

_Extends name and text resolution capabilities with fine-grained permission management
for operators and delegates across ENS node operations_

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
