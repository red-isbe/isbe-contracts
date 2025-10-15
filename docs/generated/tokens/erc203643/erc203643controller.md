## ERC203643Controller

Implements unified force mechanism for both ERC20 and ERC3643 tokens

_Inherits from IERC203643Controller and ERC203643InternalCommon
Behavior adapts automatically based on token type through internal logic_

### forceTransfer

```solidity
function forceTransfer(address _from, address _to, uint256 _amount) external returns (bool success)
```

Forces a transfer of tokens between two addresses

\_Works for both ERC20 and ERC3643 tokens with automatic behavior adaptation.
For ERC3643: If `_from` lacks enough free (unfrozen) balance but has sufficient total
balance, it automatically unfreezes the missing portion to complete the transfer.

     Emits a {ForceTransfer} event.
     Emits a {TokensUnfrozen} event if `_amount` exceeds the free balance of `_from` (ERC3643 only).
     Emits a {Transfer} event via {_transfer}._

#### Parameters

| Name     | Type    | Description                                                      |
| -------- | ------- | ---------------------------------------------------------------- |
| \_from   | address | The address to transfer tokens from                              |
| \_to     | address | The address to transfer tokens to (must be verified for ERC3643) |
| \_amount | uint256 | The number of tokens to transfer                                 |

#### Return Values

| Name    | Type | Description                              |
| ------- | ---- | ---------------------------------------- |
| success | bool | Always returns true (reverts on failure) |

### forceBurn

```solidity
function forceBurn(address _from, uint256 _amount) external
```

Forces a burn of tokens from an address

\_Works for both ERC20 and ERC3643 tokens with automatic behavior adaptation.
For ERC3643: If `_from` lacks enough free (unfrozen) balance but has sufficient total
balance, it automatically unfreezes the missing portion to complete the burn.

     Emits a {ForceBurn} event.
     Emits a {TokensUnfrozen} event if `_amount` exceeds the free balance of `_from` (ERC3643 only).
     Emits a {Transfer} event to 0x0 via {_burn}._

#### Parameters

| Name     | Type    | Description                     |
| -------- | ------- | ------------------------------- |
| \_from   | address | The address to burn tokens from |
| \_amount | uint256 | The number of tokens to burn    |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

_Declares the interfaces implemented by this facet._

#### Return Values

| Name         | Type     | Description                               |
| ------------ | -------- | ----------------------------------------- |
| interfaces\_ | bytes4[] | Array of supported interface identifiers. |

---

## ERC203643ControllerFacet

Diamond facet for unified ERC20/ERC3643 controller operations

_Provides force transfer and burn capabilities for both token standards_

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

_Returns the interfaces implemented by this facet_

#### Return Values

| Name         | Type     | Description                    |
| ------------ | -------- | ------------------------------ |
| interfaces\_ | bytes4[] | Array of interface identifiers |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

_Returns the business identifier for this facet_

#### Return Values

| Name         | Type    | Description                     |
| ------------ | ------- | ------------------------------- |
| businessId\_ | bytes32 | The resolver key for this facet |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

_Returns the function selectors exposed by this facet_

#### Return Values

| Name        | Type     | Description                 |
| ----------- | -------- | --------------------------- |
| selectors\_ | bytes4[] | Array of function selectors |

---

## IERC203643Controller

Interface for administrative control over ERC20 and ERC3643 tokens, allowing forced transfers and burns

_Intended for use in regulated environments or asset-backed tokens where such functionality is required.
Behavior adapts automatically based on token type (ERC20 vs ERC3643)._

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
function forceTransfer(address _from, address _to, uint256 _amount) external returns (bool)
```

Transfers tokens from one account to another by an authorized controller

\_This function should only be callable by an authorized controller (e.g., regulator or admin contract).
No approval required from token holder.

     For ERC3643 tokens: recipient must be verified and tokens may be unfrozen if needed.
     In case the `_from` address has not enough free tokens (unfrozen tokens)
     but has a total balance higher or equal to the `_amount`
     the tokens will be unfrozen to complete the transfer._

#### Parameters

| Name     | Type    | Description                         |
| -------- | ------- | ----------------------------------- |
| \_from   | address | The address to transfer tokens from |
| \_to     | address | The address to transfer tokens to   |
| \_amount | uint256 | The number of tokens to transfer    |

#### Return Values

| Name | Type | Description                                                                                                                                                                                          |
| ---- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [0]  | bool | `true` if successful, otherwise reverts Emits a `ForceTransfer` event Emits a `TokensUnfrozen` event if `_amount` is higher than the free balance of `_from` (ERC3643 only) Emits a `Transfer` event |

### forceBurn

```solidity
function forceBurn(address _from, uint256 _amount) external
```

Burns tokens from an account by an authorized controller

\_This function should only be callable by an authorized controller (e.g., regulator or admin contract).
No approval required from token holder.

     For ERC3643 tokens: tokens may be unfrozen if needed.
     In case the `_from` address has not enough free tokens (unfrozen tokens)
     but has a total balance higher or equal to the `_amount`
     the tokens will be unfrozen to complete the burn._

#### Parameters

| Name     | Type    | Description                                                                                                                                                                                         |
| -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_from   | address | The address to burn tokens from                                                                                                                                                                     |
| \_amount | uint256 | The number of tokens to burn Emits a `ForceBurn` event Emits a `TokensUnfrozen` event if `_amount` is higher than the free balance of `_from` (ERC3643 only) Emits a `Transfer` event to address(0) |
