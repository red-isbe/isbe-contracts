## ERC3643Freeze

External contract implementing ERC-3643 freeze functionality.

_Provides public methods to freeze/unfreeze addresses and token amounts.
Applies access control, validation, and emits events.
Uses granular FREEZE_ROLE instead of broad TOKEN_AGENT_ROLE for better permission management._

### setAddressFrozen

```solidity
function setAddressFrozen(address _userAddress, bool _freeze) external
```

_Sets the freeze status of a wallet_

#### Parameters

| Name          | Type    | Description                                                                                                                            |
| ------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| \_userAddress | address | The address for which to update frozen status                                                                                          |
| \_freeze      | bool    | Freeze status of the address Requirements: - Caller must have FREEZE_ROLE - Contract must not be paused Emits: - {AddressFrozen} event |

### freezePartialTokens

```solidity
function freezePartialTokens(address _userAddress, uint256 _amount) external
```

_Freezes a specified amount of tokens for a given address_

#### Parameters

| Name          | Type    | Description                                                                                                                                                                            |
| ------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_userAddress | address | The address for which to freeze tokens                                                                                                                                                 |
| \_amount      | uint256 | Amount of tokens to freeze Requirements: - Caller must have FREEZE_ROLE - Contract must not be paused - Amount must not exceed user's free token balance Emits: - {TokensFrozen} event |

### unfreezePartialTokens

```solidity
function unfreezePartialTokens(address _userAddress, uint256 _amount) external
```

_Unfreezes a specified amount of tokens for a given address_

#### Parameters

| Name          | Type    | Description                                                                                                                                                                                  |
| ------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_userAddress | address | The address for which to unfreeze tokens                                                                                                                                                     |
| \_amount      | uint256 | Amount of tokens to unfreeze Requirements: - Caller must have FREEZE_ROLE - Contract must not be paused - Amount must not exceed user's frozen token balance Emits: - {TokensUnfrozen} event |

### batchSetAddressFrozen

```solidity
function batchSetAddressFrozen(address[] _userAddresses, bool[] _freeze) external
```

_Batch sets the freeze status for multiple wallets_

#### Parameters

| Name            | Type      | Description                                                                                                                                                                                         |
| --------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_userAddresses | address[] | Array of addresses to update                                                                                                                                                                        |
| \_freeze        | bool[]    | Array of freeze statuses (true/false) Requirements: - Caller must have FREEZE_ROLE - Contract must not be paused - Arrays must have the same length Emits: - {AddressFrozen} event for each address |

### batchFreezePartialTokens

```solidity
function batchFreezePartialTokens(address[] _userAddresses, uint256[] _amounts) external
```

_Batch freezes specified amounts of tokens for multiple addresses_

#### Parameters

| Name            | Type      | Description                                                                                                                                                                             |
| --------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_userAddresses | address[] | Array of addresses to freeze tokens for                                                                                                                                                 |
| \_amounts       | uint256[] | Array of amounts to freeze Requirements: - Caller must have FREEZE_ROLE - Contract must not be paused - Arrays must have the same length Emits: - {TokensFrozen} event for each address |

### batchUnfreezePartialTokens

```solidity
function batchUnfreezePartialTokens(address[] _userAddresses, uint256[] _amounts) external
```

_Batch unfreezes specified amounts of tokens for multiple addresses_

#### Parameters

| Name            | Type      | Description                                                                                                                                                                                 |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_userAddresses | address[] | Array of addresses to unfreeze tokens for                                                                                                                                                   |
| \_amounts       | uint256[] | Array of amounts to unfreeze Requirements: - Caller must have FREEZE_ROLE - Contract must not be paused - Arrays must have the same length Emits: - {TokensUnfrozen} event for each address |

### isFrozen

```solidity
function isFrozen(address _userAddress) external view returns (bool)
```

_Returns the freeze status of a wallet_

#### Parameters

| Name          | Type    | Description                            |
| ------------- | ------- | -------------------------------------- |
| \_userAddress | address | The address to check freeze status for |

#### Return Values

| Name | Type | Description                                                                                                                                                                                 |
| ---- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [0]  | bool | bool True if the address is completely frozen, false otherwise Note: This returns the complete freeze status. An address can still have partially frozen tokens even if this returns false. |

### getFrozenTokens

```solidity
function getFrozenTokens(address _userAddress) external view returns (uint256)
```

_Returns the amount of partially frozen tokens for a given address_

#### Parameters

| Name          | Type    | Description                            |
| ------------- | ------- | -------------------------------------- |
| \_userAddress | address | The address to check frozen tokens for |

#### Return Values

| Name | Type    | Description                                                                                                                                                                                                                |
| ---- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [0]  | uint256 | uint256 The amount of tokens that are partially frozen Note: This only returns partially frozen tokens. If the address is completely frozen (isFrozen = true), all tokens are effectively frozen regardless of this value. |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

_Returns the interfaces implemented by this contract_

#### Return Values

| Name         | Type     | Description                    |
| ------------ | -------- | ------------------------------ |
| interfaces\_ | bytes4[] | Array of interface identifiers |

---

## ERC3643FreezeFacet

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

## ERC3643FreezeInternal

Internal contract for managing ERC-3643 freeze functionality.

_Provides internal functions to freeze/unfreeze addresses and partial balances.
This contract does not emit events or apply access control.
It is intended to be used by external contracts that handle authorization and event emission._

### ERC3643FreezeStorage

_Storage structure for ERC-3643 freeze._

```solidity
struct ERC3643FreezeStorage {
    mapping(address => bool) frozen;
    mapping(address => uint256) frozenTokens;
}
```

### \_setAddressFrozen

```solidity
function _setAddressFrozen(address _userAddress, bool _freeze) internal
```

_Internal function to set an address frozen or unfrozen._

#### Parameters

| Name          | Type    | Description                                              |
| ------------- | ------- | -------------------------------------------------------- |
| \_userAddress | address | The wallet address to update.                            |
| \_freeze      | bool    | The freeze status (`true` = frozen, `false` = unfrozen). |

### \_freezePartialTokens

```solidity
function _freezePartialTokens(address _userAddress, uint256 _amount) internal
```

_Internal function to increase the amount of frozen tokens for an address._

#### Parameters

| Name          | Type    | Description                              |
| ------------- | ------- | ---------------------------------------- |
| \_userAddress | address | The wallet address to freeze tokens for. |
| \_amount      | uint256 | The amount of tokens to freeze.          |

### \_unfreezePartialTokens

```solidity
function _unfreezePartialTokens(address _userAddress, uint256 _amount) internal
```

_Internal function to decrease the amount of frozen tokens for an address._

#### Parameters

| Name          | Type    | Description                                |
| ------------- | ------- | ------------------------------------------ |
| \_userAddress | address | The wallet address to unfreeze tokens for. |
| \_amount      | uint256 | The amount of tokens to unfreeze.          |

### \_isFrozen

```solidity
function _isFrozen(address _userAddress) internal view returns (bool)
```

_Internal view function to check if an address is fully frozen._

#### Parameters

| Name          | Type    | Description                  |
| ------------- | ------- | ---------------------------- |
| \_userAddress | address | The wallet address to check. |

#### Return Values

| Name | Type | Description                                     |
| ---- | ---- | ----------------------------------------------- |
| [0]  | bool | True if the address is frozen, false otherwise. |

### \_getFrozenTokens

```solidity
function _getFrozenTokens(address _userAddress) internal view returns (uint256)
```

_Internal view function to get the amount of partially frozen tokens for an address._

#### Parameters

| Name          | Type    | Description                  |
| ------------- | ------- | ---------------------------- |
| \_userAddress | address | The wallet address to check. |

#### Return Values

| Name | Type    | Description                  |
| ---- | ------- | ---------------------------- |
| [0]  | uint256 | The amount of frozen tokens. |

---

## IERC3643Freeze

Interface for freezing and unfreezing addresses and token balances in ERC-3643 tokens.

_Defines full address freeze and partial token freeze operations,
together with read-only inspection functions._

### AddressFrozen

```solidity
event AddressFrozen(address _userAddress, bool _isFrozen, address _owner)
```

this event is emitted when the wallet of an investor is frozen or unfrozen
the event is emitted by setAddressFrozen and batchSetAddressFrozen functions
`_userAddress` is the wallet of the investor that is concerned by the freezing status
`_isFrozen` is the freezing status of the wallet
if `_isFrozen` equals `true` the wallet is frozen after emission of the event
if `_isFrozen` equals `false` the wallet is unfrozen after emission of the event
`_owner` is the address of the agent who called the function to freeze the wallet

### TokensFrozen

```solidity
event TokensFrozen(address _userAddress, uint256 _amount)
```

this event is emitted when a certain amount of tokens is frozen on a wallet
the event is emitted by freezePartialTokens and batchFreezePartialTokens functions
`_userAddress` is the wallet of the investor that is concerned by the freezing status
`_amount` is the amount of tokens that are frozen

### TokensUnfrozen

```solidity
event TokensUnfrozen(address _userAddress, uint256 _amount)
```

this event is emitted when a certain amount of tokens is unfrozen on a wallet
the event is emitted by unfreezePartialTokens and batchUnfreezePartialTokens functions
`_userAddress` is the wallet of the investor that is concerned by the freezing status
`_amount` is the amount of tokens that are unfrozen

### UnfreezeAmountExceedsFrozen

```solidity
error UnfreezeAmountExceedsFrozen(address account, uint256 requested, uint256 available)
```

Error indicating that an attempt was made to unfreeze more tokens than are frozen

#### Parameters

| Name      | Type    | Description                               |
| --------- | ------- | ----------------------------------------- |
| account   | address | The address attempting to unfreeze tokens |
| requested | uint256 | The amount requested to unfreeze          |
| available | uint256 | The amount actually frozen                |

### InsufficientFreeBalance

```solidity
error InsufficientFreeBalance(address account, uint256 requested, uint256 freeBalance)
```

Error when attempting to transfer more tokens than available free balance

#### Parameters

| Name        | Type    | Description                                  |
| ----------- | ------- | -------------------------------------------- |
| account     | address | The address attempting the transfer          |
| requested   | uint256 | The amount requested to transfer             |
| freeBalance | uint256 | The actual free (unfrozen) balance available |

### SenderIsFrozen

```solidity
error SenderIsFrozen(address sender)
```

Error when sender account is completely frozen

#### Parameters

| Name   | Type    | Description               |
| ------ | ------- | ------------------------- |
| sender | address | The frozen sender address |

### RecipientIsFrozen

```solidity
error RecipientIsFrozen(address recipient)
```

Error when recipient account is completely frozen

#### Parameters

| Name      | Type    | Description                  |
| --------- | ------- | ---------------------------- |
| recipient | address | The frozen recipient address |

### setAddressFrozen

```solidity
function setAddressFrozen(address _userAddress, bool _freeze) external
```

@dev sets an address frozen status for this token.
@param \_userAddress The address for which to update frozen status
@param \_freeze Frozen status of the address
This function can only be called by a wallet set as agent of the token
emits an `AddressFrozen` event

### freezePartialTokens

```solidity
function freezePartialTokens(address _userAddress, uint256 _amount) external
```

@dev freezes token amount specified for given address.
@param \_userAddress The address for which to update frozen tokens
@param \_amount Amount of Tokens to be frozen
This function can only be called by a wallet set as agent of the token
emits a `TokensFrozen` event

### unfreezePartialTokens

```solidity
function unfreezePartialTokens(address _userAddress, uint256 _amount) external
```

@dev unfreezes token amount specified for given address
@param \_userAddress The address for which to update frozen tokens
@param \_amount Amount of Tokens to be unfrozen
This function can only be called by a wallet set as agent of the token
emits a `TokensUnfrozen` event

### batchSetAddressFrozen

```solidity
function batchSetAddressFrozen(address[] _userAddresses, bool[] _freeze) external
```

@dev function allowing to set frozen addresses in batch
IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_userAddresses.length` IS TOO HIGH,
USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
@param \_userAddresses The addresses for which to update frozen status
@param \_freeze Frozen status of the corresponding address
This function can only be called by a wallet set as agent of the token
emits \_userAddresses.length `AddressFrozen` events

### batchFreezePartialTokens

```solidity
function batchFreezePartialTokens(address[] _userAddresses, uint256[] _amounts) external
```

@dev function allowing to freeze tokens partially in batch
IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_userAddresses.length` IS TOO HIGH,
USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
@param \_userAddresses The addresses on which tokens need to be frozen
@param \_amounts the amount of tokens to freeze on the corresponding address
This function can only be called by a wallet set as agent of the token
emits \_userAddresses.length `TokensFrozen` events

### batchUnfreezePartialTokens

```solidity
function batchUnfreezePartialTokens(address[] _userAddresses, uint256[] _amounts) external
```

@dev function allowing to unfreeze tokens partially in batch
IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_userAddresses.length` IS TOO HIGH,
USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
@param \_userAddresses The addresses on which tokens need to be unfrozen
@param \_amounts the amount of tokens to unfreeze on the corresponding address
This function can only be called by a wallet set as agent of the token
emits \_userAddresses.length `TokensUnfrozen` events

### isFrozen

```solidity
function isFrozen(address _userAddress) external view returns (bool)
```

@dev Returns the freezing status of a wallet
if isFrozen returns `true` the wallet is frozen
if isFrozen returns `false` the wallet is not frozen
isFrozen returning `true` doesn't mean that the balance is free, tokens could be blocked by
a partial freeze or the whole token could be blocked by pause
@param \_userAddress the address of the wallet on which isFrozen is called

### getFrozenTokens

```solidity
function getFrozenTokens(address _userAddress) external view returns (uint256)
```

@dev Returns the amount of tokens that are partially frozen on a wallet
the amount of frozen tokens is always <= to the total balance of the wallet
@param \_userAddress the address of the wallet on which getFrozenTokens is called
