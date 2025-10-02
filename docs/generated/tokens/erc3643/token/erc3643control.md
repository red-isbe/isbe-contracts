## ERC3643Control

External contract implementing ERC-3643 control operations (forced transfers, mint, burn).

_Provides public methods to manage balances under regulatory rules.
Applies access control, validation, and emits events._

### forcedTransfer

```solidity
function forcedTransfer(address _from, address _to, uint256 _amount) external returns (bool success)
```

Forces a token transfer from `_from` to `_to`.

\_Restricted to token agent.
Requires `_to` to be a verified address in the IdentityRegistry.
If `_from` lacks enough free (unfrozen) balance but has sufficient total
balance, it automatically unfreezes the missing portion to complete the transfer.

     Emits a {TokensUnfrozen} event if `_amount` exceeds the free balance of `_from`.
     Emits a {Transfer} event via {_transfer}._

#### Parameters

| Name     | Type    | Description                                         |
| -------- | ------- | --------------------------------------------------- |
| \_from   | address | The address to debit tokens from.                   |
| \_to     | address | The address to credit tokens to (must be verified). |
| \_amount | uint256 | The number of tokens to transfer.                   |

#### Return Values

| Name    | Type | Description                                         |
| ------- | ---- | --------------------------------------------------- |
| success | bool | `true` if the transfer succeeds, otherwise reverts. |

### mint

```solidity
function mint(address _to, uint256 _amount) external
```

@dev mint tokens on a wallet
Improved version of default mint method. Tokens can be minted
to an address if only it is a verified address as per the security token.
@param \_to Address to mint the tokens to.
@param \_amount Amount of tokens to mint.
This function can only be called by a wallet set as agent of the token
emits a `Transfer` event

### burn

```solidity
function burn(address _userAddress, uint256 _amount) external
```

Burn tokens from a wallet.

\_Restricted to token agent.
If `_userAddress` lacks enough free balance but has sufficient total balance,
the missing portion is automatically unfrozen to complete the burn.

     Emits a {TokensUnfrozen} event if `_amount` exceeds the free balance of `_userAddress`.
     Emits a {Transfer} event to 0x0 via {_burn}._

#### Parameters

| Name          | Type    | Description                                   |
| ------------- | ------- | --------------------------------------------- |
| \_userAddress | address | The address from which tokens will be burned. |
| \_amount      | uint256 | The number of tokens to burn.                 |

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

## ERC3643ControlFacet

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

## IERC3643Control

Interface for controlling ERC-3643 token operations such as forced transfers, minting, and burning,
including automatic unfreezing of tokens when necessary.
@dev

### RecipientNotVerified

```solidity
error RecipientNotVerified(address account)
```

Error indicating that the recipient address is not verified in the Identity Registry.

#### Parameters

| Name    | Type    | Description                       |
| ------- | ------- | --------------------------------- |
| account | address | The unverified recipient address. |

### forcedTransfer

```solidity
function forcedTransfer(address _from, address _to, uint256 _amount) external returns (bool)
```

@dev force a transfer of tokens between 2 whitelisted wallets
In case the `from` address has not enough free tokens (unfrozen tokens)
but has a total balance higher or equal to the `amount`
the amount of frozen tokens is reduced in order to have enough free tokens
to proceed the transfer, in such a case, the remaining balance on the `from`
account is 100% composed of frozen tokens post-transfer.
Require that the `to` address is a verified address,
`_from` The address of the sender
`_to` The address of the receiver
`_amount` The number of tokens to transfer
@return `true` if successful and revert if unsuccessful
This function can only be called by a wallet set as agent of the token
emits a `TokensUnfrozen` event if `_amount` is higher than the free balance of `_from`
emits a `Transfer` event

### mint

```solidity
function mint(address _to, uint256 _amount) external
```

@dev mint tokens on a wallet
Improved version of default mint method. Tokens can be minted
to an address if only it is a verified address as per the security token.
@param \_to Address to mint the tokens to.
@param \_amount Amount of tokens to mint.
This function can only be called by a wallet set as agent of the token
emits a `Transfer` event

### burn

```solidity
function burn(address _userAddress, uint256 _amount) external
```

@dev burn tokens on a wallet
In case the `account` address has not enough free tokens (unfrozen tokens)
but has a total balance higher or equal to the `value` amount
the amount of frozen tokens is reduced in order to have enough free tokens
to proceed the burn, in such a case, the remaining balance on the `account`
is 100% composed of frozen tokens post-transaction.
@param \_userAddress Address to burn the tokens from.
@param \_amount Amount of tokens to burn.
This function can only be called by a wallet set as agent of the token
emits a `TokensUnfrozen` event if `_amount` is higher than the free balance of `_userAddress`
emits a `Transfer` event
