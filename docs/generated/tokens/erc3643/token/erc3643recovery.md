## ERC3643Recovery

External contract implementing ERC-3643 recovery functionality.

_Allows authorized agents to recover tokens from lost wallets to new wallets.
     Extends ERC203643InternalCommon which aggregates all internal contracts,
     providing access to all necessary internal functions.

Architecture Note:
Unlike other ERC3643 modules (Freeze, Metadata, Regulatory), this contract does NOT have
a separate ERC3643RecoveryInternal contract because:

1. NO STORAGE: Recovery operations don't require dedicated storage. All state is managed
   through existing modules (balances in ERC20, frozen state in Freeze).

2. CROSS-MODULE DEPENDENCIES: All recovery helper functions need access to functions from
   multiple modules (_balanceOf, _transfer, _getFrozenTokens, _isFrozen, _setAddressFrozen,
   _freezePartialTokens). These are only available through
   ERC203643InternalCommon, not from a standalone internal contract extending Common.

3. ACCESSIBILITY: By placing internal helper functions directly in this external contract
   (which extends ERC203643InternalCommon), they have immediate access to all required
   cross-module functionality without violating the architectural pattern.

Internal contracts in the ERC3643 pattern (like ERC3643FreezeInternal) extend only Common
and manage their own isolated storage. Recovery has no storage of its own and orchestrates
operations across multiple existing modules, making it a special case where the internal
helpers belong in the external contract._

### FrozenState

Struct to hold frozen state information

```solidity
struct FrozenState {
  uint256 frozenTokens;
  bool wasAddressFrozen;
}
```

### onlyWithRecoveryPair

```solidity
modifier onlyWithRecoveryPair(address _lostWallet, address _newWallet)
```

### recoveryAddress

```solidity
function recoveryAddress(address _lostWallet, address _newWallet) external returns (bool)
```

Recovers tokens from a lost wallet to a new wallet.

_This function should only be callable by an authorized recovery agent.
     Performs comprehensive validation and transfers all tokens from lost to new wallet.

     If the lost wallet has frozen tokens, they will be automatically unfrozen
     before the transfer to ensure complete recovery.

Requirements:
- Caller must have RECOVERY_ROLE
- Contract must not be paused
- _lostWallet must not be zero address
- _newWallet must not be zero address
- _lostWallet and _newWallet must not be the same

Emits:
- {RecoverySuccess} event with lost and new wallet addresses_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _lostWallet | address | The wallet that was lost |
| _newWallet | address | The new wallet to which tokens will be transferred |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | success True if recovery was successful, false otherwise |

### _restoreFrozenState

```solidity
function _restoreFrozenState(address _newWallet, struct ERC3643Recovery.FrozenState _frozenState) internal
```

Restores frozen state to the new wallet.

_This function is used to restore the frozen state of the tokens after a recovery operation._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _newWallet | address | The wallet to restore frozen state to. |
| _frozenState | struct ERC3643Recovery.FrozenState | The frozen state to restore. |

### _checkRecoverableBalance

```solidity
function _checkRecoverableBalance(address _lostWallet) internal view returns (uint256 balance)
```

Checks if the lost wallet has tokens to recover.

_This function checks if the lost wallet has a non-zero balance before attempting recovery._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _lostWallet | address | The wallet to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| balance | uint256 | The balance of the lost wallet. Reverts: - {NoTokensToRecover} if the wallet has zero balance. |

### _captureFrozenState

```solidity
function _captureFrozenState(address _wallet) internal view returns (struct ERC3643Recovery.FrozenState frozenState)
```

Captures the current frozen state of a wallet.

_This function captures the frozen token count and freeze status of a wallet._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _wallet | address | The wallet to capture state from. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| frozenState | struct ERC3643Recovery.FrozenState | Struct containing frozen tokens count and freeze status. |

### _checkRecoveryPairAddresses

```solidity
function _checkRecoveryPairAddresses(address _lostWallet, address _newWallet) internal pure
```

Validates all recovery input parameters.

_This function validates the lost and new wallet addresses, ensuring they are valid and different._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _lostWallet | address | The lost wallet address to validate. |
| _newWallet | address | The new wallet address to validate. Reverts: - {InvalidLostWallet} if lost wallet is zero address. - {InvalidNewWallet} if new wallet is zero address. - {SameWalletAddress} if lost and new wallets are the same. |

### _implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

Declares the interfaces implemented by this facet.

_This function declares the interfaces implemented by the contract._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaces_ | bytes4[] | Array of supported interface identifiers. |



---

## ERC3643RecoveryFacet

Diamond facet for ERC3643 token recovery functionality

_Exposes recovery operations for lost wallets in regulated environments.
     Implements ERC3643Recovery and EIP-2535 introspection for modular architecture._

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Returns the interfaces implemented by this facet

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaces_ | bytes4[] | Array of interface identifiers |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Returns the business identifier for this facet

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| businessId_ | bytes32 | The resolver key for this facet |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Returns the function selectors exposed by this facet

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| selectors_ | bytes4[] | Array of function selectors |



---

## IERC3643Recovery

Interface for recovery operations in ERC-3643 tokens.

_Defines recovery functionality for lost wallets,
     allowing authorized agents to transfer tokens from lost wallets to new ones._

### RecoverySuccess

```solidity
event RecoverySuccess(address _lostWallet, address _newWallet)
```

Emitted when an investor successfully recovers their tokens.

_Emitted by the recoveryAddress function._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _lostWallet | address | The address of the wallet that was lost. |
| _newWallet | address | The address of the wallet provided for recovery. |

### SameWalletAddress

```solidity
error SameWalletAddress()
```

Thrown when the lost wallet and new wallet are the same address.

### NoTokensToRecover

```solidity
error NoTokensToRecover()
```

Thrown when the lost wallet has no tokens to recover.

### recoveryAddress

```solidity
function recoveryAddress(address _lostWallet, address _newWallet) external returns (bool)
```

Recovers tokens from a lost wallet to a new wallet.

_Can only be called by an authorized recovery agent.
Emits RecoverySuccess on success, RecoveryFails on failure._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _lostWallet | address | The wallet that was lost. |
| _newWallet | address | The new wallet to which tokens will be transferred. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | success True if recovery was successful, false otherwise. |

