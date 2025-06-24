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

Retrieves the interfaces supported by the EIP-2535 Diamond Standard.

_Returns a static list of interfaces supported by the contract. It is a view function and does not
modify or depend on contract state._

#### Return Values

| Name         | Type     | Description                                                                         |
| ------------ | -------- | ----------------------------------------------------------------------------------- |
| interfaces\_ | bytes4[] | An array of interface identifiers (`bytes4[]`) compliant with the EIP-165 standard. |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Retrieves the function selectors supported by the EIP-2535 Diamond Standard.

_Returns a static list of function selectors supported by the interface. It is a pure function and does not
modify or depend on contract state._

#### Return Values

| Name        | Type     | Description                                                                       |
| ----------- | -------- | --------------------------------------------------------------------------------- |
| selectors\_ | bytes4[] | An array of function selectors (`bytes4[]`) compliant with the EIP-2535 standard. |

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
