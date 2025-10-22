## ERC3643Recovery

External contract implementing ERC-3643 recovery functionality.

\_Allows authorized agents to recover tokens from lost wallets to new verified wallets.
Extends ERC203643InternalCommon which aggregates all internal contracts,
providing access to all necessary internal functions.

Architecture Note:
Unlike other ERC3643 modules (Freeze, Metadata, Regulatory), this contract does NOT have
a separate ERC3643RecoveryInternal contract because:

1. NO STORAGE: Recovery operations don't require dedicated storage. All state is managed
   through existing modules (balances in ERC20, frozen state in Freeze, identities in Registry).

2. CROSS-MODULE DEPENDENCIES: All recovery helper functions need access to functions from
   multiple modules (\_balanceOf, \_transfer, \_getFrozenTokens, \_isFrozen, \_setAddressFrozen,
   \_freezePartialTokens, \_identityRegistry). These are only available through
   ERC203643InternalCommon, not from a standalone internal contract extending Common.

3. ACCESSIBILITY: By placing internal helper functions directly in this external contract
   (which extends ERC203643InternalCommon), they have immediate access to all required
   cross-module functionality without violating the architectural pattern.

Internal contracts in the ERC3643 pattern (like ERC3643FreezeInternal) extend only Common
and manage their own isolated storage. Recovery has no storage of its own and orchestrates
operations across multiple existing modules, making it a special case where the internal
helpers belong in the external contract.\_

### FrozenState

_Struct to hold frozen state information_

```solidity
struct FrozenState {
    uint256 frozenTokens;
    bool wasAddressFrozen;
}
```

### recoveryAddress

```solidity
function recoveryAddress(address _lostWallet, address _newWallet, address _investorOnchainID) external returns (bool)
```

Recovers tokens from a lost wallet to a new wallet for an investor

\_This function should only be callable by an authorized recovery agent.
Performs comprehensive validation and transfers all tokens from lost to new wallet.

     If the lost wallet has frozen tokens, they will be automatically unfrozen
     before the transfer to ensure complete recovery._

#### Parameters

| Name                | Type    | Description                                                      |
| ------------------- | ------- | ---------------------------------------------------------------- |
| \_lostWallet        | address | The wallet that the investor lost                                |
| \_newWallet         | address | The newly provided wallet on which tokens have to be transferred |
| \_investorOnchainID | address | The onchainID of the investor asking for a recovery              |

#### Return Values

| Name | Type | Description                                              |
| ---- | ---- | -------------------------------------------------------- |
| [0]  | bool | success True if recovery was successful, false otherwise |

### \_registerNewWallet

```solidity
function _registerNewWallet(address _lostWallet, address _newWallet, contract IIdentity _onchainID) internal
```

_Registers a new wallet in the Identity Registry with investor's information_

#### Parameters

| Name         | Type               | Description                                    |
| ------------ | ------------------ | ---------------------------------------------- |
| \_lostWallet | address            | The lost wallet (used to get investor country) |
| \_newWallet  | address            | The new wallet to register                     |
| \_onchainID  | contract IIdentity | The investor's onchain ID                      |

### \_restoreFrozenState

```solidity
function _restoreFrozenState(address _newWallet, struct ERC3643Recovery.FrozenState _frozenState) internal
```

_Restores frozen state to the new wallet_

#### Parameters

| Name          | Type                               | Description                           |
| ------------- | ---------------------------------- | ------------------------------------- |
| \_newWallet   | address                            | The wallet to restore frozen state to |
| \_frozenState | struct ERC3643Recovery.FrozenState | The frozen state to restore           |

### \_removeFromIdentityRegistry

```solidity
function _removeFromIdentityRegistry(address _lostWallet) internal
```

_Removes the lost wallet from the Identity Registry_

#### Parameters

| Name         | Type    | Description          |
| ------------ | ------- | -------------------- |
| \_lostWallet | address | The wallet to remove |

### \_checkRecoverableBalance

```solidity
function _checkRecoverableBalance(address _lostWallet) internal view returns (uint256 balance)
```

_Checks if the lost wallet has tokens to recover_

#### Parameters

| Name         | Type    | Description         |
| ------------ | ------- | ------------------- |
| \_lostWallet | address | The wallet to check |

#### Return Values

| Name    | Type    | Description                                                                                  |
| ------- | ------- | -------------------------------------------------------------------------------------------- |
| balance | uint256 | The balance of the lost wallet Reverts: - {NoTokensToRecover} if the wallet has zero balance |

### \_validateWalletOwnership

```solidity
function _validateWalletOwnership(address _newWallet, contract IIdentity _onchainID) internal view
```

_Validates that the new wallet belongs to the investor_

#### Parameters

| Name        | Type               | Description                                                                                                                                                                                                                                 |
| ----------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_newWallet | address            | The wallet to validate                                                                                                                                                                                                                      |
| \_onchainID | contract IIdentity | The investor's onchain ID NOTE: Currently commented out - pending final IIdentity interface implementation Once IIdentity.keyHasPurpose is available, uncomment the implementation below Reverts or emits RecoveryFails if validation fails |

### \_captureFrozenState

```solidity
function _captureFrozenState(address _wallet) internal view returns (struct ERC3643Recovery.FrozenState frozenState)
```

_Captures the current frozen state of a wallet_

#### Parameters

| Name     | Type    | Description                      |
| -------- | ------- | -------------------------------- |
| \_wallet | address | The wallet to capture state from |

#### Return Values

| Name        | Type                               | Description                                             |
| ----------- | ---------------------------------- | ------------------------------------------------------- |
| frozenState | struct ERC3643Recovery.FrozenState | Struct containing frozen tokens count and freeze status |

### \_validateRecoveryInputs

```solidity
function _validateRecoveryInputs(address _lostWallet, address _newWallet, address _investorOnchainID) internal pure
```

_Validates all recovery input parameters_

#### Parameters

| Name                | Type    | Description                                                                                                                                                                                                                                                                  |
| ------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_lostWallet        | address | The lost wallet address to validate                                                                                                                                                                                                                                          |
| \_newWallet         | address | The new wallet address to validate                                                                                                                                                                                                                                           |
| \_investorOnchainID | address | The investor's onchain ID to validate Reverts: - {InvalidLostWallet} if lost wallet is zero address - {InvalidNewWallet} if new wallet is zero address - {InvalidInvestorOnchainID} if onchain ID is zero address - {SameWalletAddress} if lost and new wallets are the same |

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

| Name         | Type     | Description                    |
| ------------ | -------- | ------------------------------ |
| interfaces\_ | bytes4[] | Array of interface identifiers |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Returns the business identifier for this facet

#### Return Values

| Name         | Type    | Description                     |
| ------------ | ------- | ------------------------------- |
| businessId\_ | bytes32 | The resolver key for this facet |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Returns the function selectors exposed by this facet

#### Return Values

| Name        | Type     | Description                 |
| ----------- | -------- | --------------------------- |
| selectors\_ | bytes4[] | Array of function selectors |

---

## IERC3643Recovery

Interface for recovery operations in ERC-3643 tokens.

_Defines recovery functionality for lost wallets,
allowing authorized agents to transfer tokens from lost wallets to new ones._

### RecoverySuccess

```solidity
event RecoverySuccess(address _lostWallet, address _newWallet, address _investorOnchainID)
```

this event is emitted when an investor successfully recovers his tokens
the event is emitted by the recoveryAddress function
`_lostWallet` is the address of the wallet that the investor
lost access to
`_newWallet` is the address of the wallet that the investor
provided for the recovery
`_investorOnchainID` is the address of the onchainID
of the investor who asked for a recovery

### RecoveryFails

```solidity
event RecoveryFails(address _lostWallet, address _newWallet, address _investorOnchainID)
```

this event is emitted when the recovery process fails
the event is emitted by the recoveryAddress function
`_lostWallet` is the address of the wallet that the investor lost access to
`_newWallet` is the address of the wallet that the investor provided for the recovery
`_investorOnchainID` is the address of the onchainID of the investor who asked for a recovery

### InvalidLostWallet

```solidity
error InvalidLostWallet()
```

Thrown when the lost wallet address is zero.

### InvalidNewWallet

```solidity
error InvalidNewWallet()
```

Thrown when the new wallet address is zero.

### InvalidInvestorOnchainID

```solidity
error InvalidInvestorOnchainID()
```

Thrown when the investor onchain ID address is zero.

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
function recoveryAddress(address _lostWallet, address _newWallet, address _investorOnchainID) external returns (bool)
```

@dev recovery function used to force transfer tokens from a
lost wallet to a new wallet for an investor.
@param \_lostWallet the wallet that the investor lost
@param \_newWallet the newly provided wallet on which tokens have to be transferred
@param \_investorOnchainID the onchainID of the investor asking for a recovery
This function can only be called by a wallet set as agent of the token
emits a `TokensUnfrozen` event if there is some frozen tokens on the lost wallet if the recov process success
emits a `Transfer` event if the recovery process is successful
emits a `RecoverySuccess` event if the recovery process is successful
emits a `RecoveryFails` event if the recovery process fails
