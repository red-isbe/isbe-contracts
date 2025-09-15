## ERC20

This contract implements the standard ERC20 token functionality, including initialization,
token transfers, allowances, and balance queries.

_This contract extends from `ERC20Internal` and adheres to the ERC20 standard defined in the
OpenZeppelin interfaces. It includes additional helper functions such as `increaseAllowance` and
`decreaseAllowance` for more granular control over token allowances._

### constructor

```solidity
constructor() internal
```

Constructor that assigns the deployer as the default admin

### initializeErc20

```solidity
function initializeErc20(string _newName, string _newSymbol, uint8 _newDecimals) external
```

Initializes the ERC20 token with the given name, symbol, and decimals.

#### Parameters

| Name          | Type   | Description                                       |
| ------------- | ------ | ------------------------------------------------- |
| \_newName     | string | The name of the ERC20 token to be initialized.    |
| \_newSymbol   | string | The symbol of the ERC20 token to be initialized.  |
| \_newDecimals | uint8  | The number of decimal places for the ERC20 token. |

### transfer

```solidity
function transfer(address _to, uint256 _amount) external returns (bool)
```

\_See {IERC20-transfer}.

Requirements:

- `to` cannot be the zero address.
- the caller must have a balance of at least `amount`.\_

### approve

```solidity
function approve(address _spender, uint256 _amount) external returns (bool)
```

\_See {IERC20-approve}.

NOTE: If `amount` is the maximum `uint256`, the allowance is not updated on
`transferFrom`. This is semantically equivalent to an infinite approval.

Requirements:

- `spender` cannot be the zero address.\_

### transferFrom

```solidity
function transferFrom(address _from, address _to, uint256 _amount) external returns (bool)
```

\_See {IERC20-transferFrom}.

Emits an {Approval} event indicating the updated allowance. This is not
required by the EIP. See the note at the beginning of {ERC20}.

NOTE: Does not update the allowance if the current allowance
is the maximum `uint256`.

Requirements:

- `from` and `to` cannot be the zero address.
- `from` must have a balance of at least `amount`.
- the caller must have allowance for `from`'s tokens of at least
  `amount`.\_

### increaseAllowance

```solidity
function increaseAllowance(address _spender, uint256 _addedValue) external returns (bool)
```

\_Atomically increases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address.\_

### decreaseAllowance

```solidity
function decreaseAllowance(address _spender, uint256 _subtractedValue) external returns (bool)
```

\_Atomically decreases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address.
- `spender` must have allowance for the caller of at least
  `subtractedValue`.\_

### allowance

```solidity
function allowance(address _owner, address _spender) external view returns (uint256)
```

### decimals

```solidity
function decimals() external view returns (uint8)
```

_Returns the decimals places of the token._

### symbol

```solidity
function symbol() external view returns (string)
```

_Returns the symbol of the token._

### name

```solidity
function name() external view returns (string)
```

_Returns the name of the token._

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

_Returns the amount of tokens in existence._

### balanceOf

```solidity
function balanceOf(address _account) external view returns (uint256)
```

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## ERC20Facet

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

## ERC20Internal

Abstract contract providing internal functionality for ERC20 tokens.
Contains common mechanisms for transferring, minting, burning, and managing allowances.
This is not a deployable contract but serves as a helper for extending ERC20 logic.

_This contract defines internal functions that form the backbone of ERC20 token operations.
It adheres to the ERC20 standard and provides reusable methods for advanced token management._

### ERC20Storage

```solidity
struct ERC20Storage {
    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowances;
    uint256 totalSupply;
    uint8 decimals;
    string name;
    string symbol;
}
```

### \_initialize

```solidity
function _initialize(string _newName, string _newSymbol, uint8 _newDecimals) internal
```

### \_setName

```solidity
function _setName(string _newName) internal
```

_Internal function to update the token name in storage.
Applies the {emptyString} modifier to ensure the input is not an empty string._

#### Parameters

| Name      | Type   | Description                          |
| --------- | ------ | ------------------------------------ |
| \_newName | string | The new name to assign to the token. |

### \_setSymbol

```solidity
function _setSymbol(string _newSymbol) internal
```

_Internal function to update the token symbol in storage.
Applies the {emptyString} modifier to ensure the input is not an empty string._

#### Parameters

| Name        | Type   | Description                            |
| ----------- | ------ | -------------------------------------- |
| \_newSymbol | string | The new symbol to assign to the token. |

### \_transfer

```solidity
function _transfer(address _from, address _to, uint256 _amount) internal virtual
```

\_Moves `amount` of tokens from `from` to `to`.

This internal function is equivalent to {transfer}, and can be used to
e.g. implement automatic token fees, slashing mechanisms, etc.

Emits a {Transfer} event.

Requirements:

- `from` cannot be the zero address.
- `to` cannot be the zero address.
- `from` must have a balance of at least `amount`.\_

### \_mint

```solidity
function _mint(address _account, uint256 _amount) internal virtual
```

\_Creates `amount` tokens and assigns them to `account`, increasing
the total supply.

Emits a {Transfer} event with `from` set to the zero address.

Requirements:

- `account` cannot be the zero address.\_

### \_burn

```solidity
function _burn(address _account, uint256 _amount) internal virtual
```

\_Destroys `amount` tokens from `account`, reducing the
total supply.

Emits a {Transfer} event with `to` set to the zero address.

Requirements:

- `account` cannot be the zero address.
- `account` must have at least `amount` tokens.\_

### \_approve

```solidity
function _approve(address _owner, address _spender, uint256 _amount) internal virtual
```

\_Sets `amount` as the allowance of `spender` over the `owner` s tokens.

This internal function is equivalent to `approve`, and can be used to
e.g. set automatic allowances for certain subsystems, etc.

Emits an {Approval} event.

Requirements:

- `owner` cannot be the zero address.
- `spender` cannot be the zero address.\_

### \_spendAllowance

```solidity
function _spendAllowance(address _owner, address _spender, uint256 _amount) internal virtual
```

\_Updates `owner` s allowance for `spender` based on spent `amount`.

Does not update the allowance amount in case of infinite allowance.
Revert if not enough allowance is available.

Might emit an {Approval} event.\_

### \_beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address _from, address _to, uint256 _amount) internal virtual
```

\_Hook that is called before any transfer of tokens. This includes
minting and burning.

Calling conditions:

- when `from` and `to` are both non-zero, `amount` of `from`'s tokens
  will be transferred to `to`.
- when `from` is zero, `amount` tokens will be minted for `to`.
- when `to` is zero, `amount` of `from`'s tokens will be burned.
- `from` and `to` are never both zero.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].\_

### \_afterTokenTransfer

```solidity
function _afterTokenTransfer(address _from, address _to, uint256 _amount) internal virtual
```

\_Hook that is called after any transfer of tokens. This includes
minting and burning.

Calling conditions:

- when `from` and `to` are both non-zero, `amount` of `from`'s tokens
  has been transferred to `to`.
- when `from` is zero, `amount` tokens have been minted for `to`.
- when `to` is zero, `amount` of `from`'s tokens have been burned.
- `from` and `to` are never both zero.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].\_

### \_decimals

```solidity
function _decimals() internal view returns (uint8)
```

### \_symbol

```solidity
function _symbol() internal view returns (string)
```

### \_name

```solidity
function _name() internal view returns (string)
```

### \_totalSupply

```solidity
function _totalSupply() internal view returns (uint256)
```

### \_balanceOf

```solidity
function _balanceOf(address account) internal view returns (uint256)
```

### \_allowance

```solidity
function _allowance(address owner, address spender) internal view returns (uint256)
```

---

## IERC20Isbe

This interface defines the standard functions, events, and errors for an ERC20 token,
extending the standard ERC20 and ERC20Metadata interfaces.

_This interface introduces the `initializeErc20` function and custom errors specific to
this implementation. It serves as a blueprint for implementing contract functionality while
adhering to the ERC20 specification._

### Erc20Initialized

```solidity
event Erc20Initialized(string name, string symbol, uint8 decimals)
```

Emitted when the ERC20 token is initialized with a name, symbol, and decimals.

#### Parameters

| Name     | Type   | Description                                                   |
| -------- | ------ | ------------------------------------------------------------- |
| name     | string | The name of the initialized ERC20 token.                      |
| symbol   | string | The symbol of the initialized ERC20 token.                    |
| decimals | uint8  | The number of decimal places for the initialized ERC20 token. |

### DecreasedAllowanceBellowZero

```solidity
error DecreasedAllowanceBellowZero()
```

Error thrown when an operation tries to decrease the allowance, resulting in a negative value.

### TransferAmountExceedsBalance

```solidity
error TransferAmountExceedsBalance()
```

Error thrown when a transfer amount exceeds the sender's available balance.

### BurnAmountExceedsBalance

```solidity
error BurnAmountExceedsBalance()
```

Error thrown when a burn amount exceeds the sender's available balance.

### InsufficientAllowance

```solidity
error InsufficientAllowance()
```

Error thrown when an operation tries to spend more tokens than the assigned allowance.

### initializeErc20

```solidity
function initializeErc20(string _newName, string _newSymbol, uint8 _newDecimals) external
```

Initializes the ERC20 token with the given name, symbol, and decimals.

#### Parameters

| Name          | Type   | Description                                       |
| ------------- | ------ | ------------------------------------------------- |
| \_newName     | string | The name of the ERC20 token to be initialized.    |
| \_newSymbol   | string | The symbol of the ERC20 token to be initialized.  |
| \_newDecimals | uint8  | The number of decimal places for the ERC20 token. |
