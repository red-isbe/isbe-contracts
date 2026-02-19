## ISmartAccountFactory

### EntryPointInterfaceMismatch

```solidity
error EntryPointInterfaceMismatch(address entryPoint)
```

Thrown when the provided address does not implement the required {IEntryPoint} interface.

_Should be raised during initialisation or update if the ERC-165
     interface check for {IEntryPoint} fails._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| entryPoint | address | The non-conforming EntryPoint contract address. |

### createAccount

```solidity
function createAccount(address owner, bytes32 salt) external returns (address)
```

Deploys a SmartAccount.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The owner of the to-be-deployed SmartAccount. |
| salt | bytes32 | The salt to be used when deploying the account. |



---

## SmartAccountFactory

Provides functionality for deploying ERC-4337 smart accounts.

### createAccount

```solidity
function createAccount(address owner, bytes32 salt) external returns (address)
```

Deploys a SmartAccount.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The owner of the to-be-deployed SmartAccount. |
| salt | bytes32 | The salt to be used when deploying the account. |

### _implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

Declares supported interfaces for ERC-165 discovery.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaces_ | bytes4[] | Array of supported interface identifiers. |



---

## SmartAccountFactoryFacet

EIP-2535 facet that exposes ERC-4337 smart account factory functionality for modular proxy systems.

_Implements introspection for diamond compatibility and delegates core logic to
     the {SmartAccountFactory} base contract. Provides metadata about supported interfaces,
     business identifiers, and exposed function selectors. Enables dynamic discovery
     and upgrade management within a facet-based architecture._

### constructor

```solidity
constructor() public
```

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Retrieves the unique business identifier for this facet.

_Returns a `bytes32` key identifying the facet's purpose._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| businessId_ | bytes32 | The `bytes32` ID for the business logic. |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Gets all function selectors implemented by this facet.

_A pure function that returns a `bytes4[]` array of selectors._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| selectors_ | bytes4[] | An array of `bytes4` function selectors. |

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Gets the list of ERC-165 interface IDs the facet supports.

_A pure function that returns an array of supported `bytes4` IDs._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaces_ | bytes4[] | An array of supported interface identifiers. |



---

## SmartAccountFactoryInternal

Provides core internal functionality for deploying ERC-4337 smart accounts.

### _createAccount

```solidity
function _createAccount(address owner, bytes32 salt) internal returns (address)
```

Deploys a SmartAccount.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The owner of the to-be-deployed SmartAccount. |
| salt | bytes32 |  |

