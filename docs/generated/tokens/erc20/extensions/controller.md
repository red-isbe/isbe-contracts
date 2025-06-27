## ERC20Controller

Implements force mechanism

_Inherits from IERC20Controller and ERC20InternalCommon_

### forceTransfer

```solidity
function forceTransfer(address from, address to, uint256 amount) external
```

Transfers tokens from one account to another without requiring approval

_This function should only be callable by an authorized controller (e.g., regulator or admin contract)_

#### Parameters

| Name   | Type    | Description                         |
| ------ | ------- | ----------------------------------- |
| from   | address | The address to transfer tokens from |
| to     | address | The address to transfer tokens to   |
| amount | uint256 | The number of tokens to transfer    |

### forceBurn

```solidity
function forceBurn(address from, uint256 amount) external
```

Burns tokens from an account without requiring approval

_This function should only be callable by an authorized controller (e.g., regulator or admin contract)_

#### Parameters

| Name   | Type    | Description                     |
| ------ | ------- | ------------------------------- |
| from   | address | The address to burn tokens from |
| amount | uint256 | The number of tokens to burn    |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## ERC20ControllerFacet

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

## IERC20Controller

Interface for administrative control over ERC-20 tokens, allowing forced transfers and burns

_Intended for use in regulated environments or asset-backed tokens where such functionality is required_

### ForceTransfer

```solidity
event ForceTransfer(address operator, address from, address to, uint256 amount)
```

Emitted when tokens are forcefully transferred from one account to another

#### Parameters

| Name     | Type    | Description                                |
| -------- | ------- | ------------------------------------------ |
| operator | address | The address performing the forced transfer |
| from     | address | The address the tokens are taken from      |
| to       | address | The address the tokens are sent to         |
| amount   | uint256 | The number of tokens transferred           |

### ForceBurn

```solidity
event ForceBurn(address operator, address from, uint256 amount)
```

Emitted when tokens are forcefully burned from an account

#### Parameters

| Name     | Type    | Description                            |
| -------- | ------- | -------------------------------------- |
| operator | address | The address performing the forced burn |
| from     | address | The address the tokens are burned from |
| amount   | uint256 | The number of tokens burned            |

### forceTransfer

```solidity
function forceTransfer(address from, address to, uint256 amount) external
```

Transfers tokens from one account to another without requiring approval

_This function should only be callable by an authorized controller (e.g., regulator or admin contract)_

#### Parameters

| Name   | Type    | Description                         |
| ------ | ------- | ----------------------------------- |
| from   | address | The address to transfer tokens from |
| to     | address | The address to transfer tokens to   |
| amount | uint256 | The number of tokens to transfer    |

### forceBurn

```solidity
function forceBurn(address from, uint256 amount) external
```

Burns tokens from an account without requiring approval

_This function should only be callable by an authorized controller (e.g., regulator or admin contract)_

#### Parameters

| Name   | Type    | Description                     |
| ------ | ------- | ------------------------------- |
| from   | address | The address to burn tokens from |
| amount | uint256 | The number of tokens to burn    |
