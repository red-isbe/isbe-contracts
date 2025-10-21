## ERC3643Recovery

External contract implementing ERC-3643 recovery functionality.

_Allows authorized agents to recover tokens from lost wallets to new verified wallets._

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
