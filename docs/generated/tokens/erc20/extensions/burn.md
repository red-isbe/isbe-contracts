## ERC20Burnable

Implements burn mechanism

_Inherits from IERC20Burnable and ERC20InternalCommon_

### burn

```solidity
function burn(uint256 amount) external
```

Burns a specific amount of tokens from the caller's account.

_Reduces the caller's token balance and the total supply by the specified `amount`.
The caller must have at least the specified `amount` of tokens in their account.
Implementations should emit a `Transfer` event to indicate tokens were burned._

#### Parameters

| Name   | Type    | Description                   |
| ------ | ------- | ----------------------------- |
| amount | uint256 | The amount of tokens to burn. |

### burnFrom

```solidity
function burnFrom(address account, uint256 amount) external
```

Burns a specific amount of tokens from another account, using an allowance.

_Reduces the balance of `account` and the total supply by the specified `amount`.
The caller must be allowed to spend at least `amount` of tokens on behalf of `account`.
Implementations should emit a `Transfer` event to indicate tokens were burned._

#### Parameters

| Name    | Type    | Description                                               |
| ------- | ------- | --------------------------------------------------------- |
| account | address | The address of the account whose tokens are to be burned. |
| amount  | uint256 | The amount of tokens to burn.                             |

---

## ERC20BurnableFacet

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

## IERC20Burnable

Interface for ERC20 tokens that support token burning.
Allows users or approved accounts to reduce the total token supply.

_This interface defines two methods: - `burn`: Burns a specific amount of tokens from the caller's account. - `burnFrom`: Burns a specific amount of tokens from another account, using an allowance mechanism.
Implementing contracts are expected to handle the necessary checks and emissions of events
like `Transfer` to reflect changes in token balances and total supply._

### burn

```solidity
function burn(uint256 amount) external
```

Burns a specific amount of tokens from the caller's account.

_Reduces the caller's token balance and the total supply by the specified `amount`.
The caller must have at least the specified `amount` of tokens in their account.
Implementations should emit a `Transfer` event to indicate tokens were burned._

#### Parameters

| Name   | Type    | Description                   |
| ------ | ------- | ----------------------------- |
| amount | uint256 | The amount of tokens to burn. |

### burnFrom

```solidity
function burnFrom(address account, uint256 amount) external
```

Burns a specific amount of tokens from another account, using an allowance.

_Reduces the balance of `account` and the total supply by the specified `amount`.
The caller must be allowed to spend at least `amount` of tokens on behalf of `account`.
Implementations should emit a `Transfer` event to indicate tokens were burned._

#### Parameters

| Name    | Type    | Description                                               |
| ------- | ------- | --------------------------------------------------------- |
| account | address | The address of the account whose tokens are to be burned. |
| amount  | uint256 | The amount of tokens to burn.                             |
