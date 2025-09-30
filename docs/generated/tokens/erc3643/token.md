## IBatches

### batchTransfer

```solidity
function batchTransfer(address[] _toList, uint256[] _amounts) external
```

@dev function allowing to issue transfers in batch
Require that the msg.sender and `to` addresses are not frozen.
Require that the total value should not exceed available balance.
Require that the `to` addresses are all verified addresses,
IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_toList.length` IS TOO HIGH,
USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
@param \_toList The addresses of the receivers
@param \_amounts The number of tokens to transfer to the corresponding receiver
emits \_toList.length `Transfer` events

### batchForcedTransfer

```solidity
function batchForcedTransfer(address[] _fromList, address[] _toList, uint256[] _amounts) external
```

@dev function allowing to issue forced transfers in batch
Require that `_amounts[i]` should not exceed available balance of `_fromList[i]`.
Require that the `_toList` addresses are all verified addresses
IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_fromList.length` IS TOO HIGH,
USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
@param \_fromList The addresses of the senders
@param \_toList The addresses of the receivers
@param \_amounts The number of tokens to transfer to the corresponding receiver
This function can only be called by a wallet set as agent of the token
emits `TokensUnfrozen` events if `_amounts[i]` is higher than the free balance of `_fromList[i]`
emits \_fromList.length `Transfer` events

### batchMint

```solidity
function batchMint(address[] _toList, uint256[] _amounts) external
```

@dev function allowing to mint tokens in batch
Require that the `_toList` addresses are all verified addresses
IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_toList.length` IS TOO HIGH,
USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
@param \_toList The addresses of the receivers
@param \_amounts The number of tokens to mint to the corresponding receiver
This function can only be called by a wallet set as agent of the token
emits \_toList.length `Transfer` events

### batchBurn

```solidity
function batchBurn(address[] _userAddresses, uint256[] _amounts) external
```

@dev function allowing to burn tokens in batch
Require that the `_userAddresses` addresses are all verified addresses
IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_userAddresses.length` IS TOO HIGH,
USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
@param \_userAddresses The addresses of the wallets concerned by the burn
@param \_amounts The number of tokens to burn from the corresponding wallets
This function can only be called by a wallet set as agent of the token
emits \_userAddresses.length `Transfer` events

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

---

## IERC3643

Interface for ERC-3643 compliant tokens supporting regulatory features.

\_This interface extends the ERC-20 standard with additional modules for identity,
compliance, recovery, freezing, pausing, batch operations, and extended metadata.

The interface is composed of modular sub-interfaces, each responsible for a specific
functional domain.

This interface serves as the unified entry point for ERC-3643 functionality.
It is intended to be implemented by security tokens requiring regulatory compliance.\_

---

## IRecovery

### RecoverySuccess

```solidity
event RecoverySuccess(address _lostWallet, address _newWallet, address _investorOnchainID)
```

this event is emitted when an investor successfully recovers his tokens
the event is emitted by the recoveryAddress function
`_lostWallet` is the address of the wallet that the investor lost access to
`_newWallet` is the address of the wallet that the investor provided for the recovery
`_investorOnchainID` is the address of the onchainID of the investor who asked for a recovery

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
