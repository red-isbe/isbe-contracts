## ERC20Burnable

Implements burn mechanism

_Inherits from IERC20Burnable and ERC203643InternalCommon_

### burn

```solidity
function burn(uint256 _amount) external
```

Burns a specific amount of tokens from the caller's account.

_Reduces the caller's token balance and the total supply by the specified `amount`.
The caller must have at least the specified `amount` of tokens in their account.
Implementations should emit a `Transfer` event to indicate tokens were burned._

#### Parameters

| Name     | Type    | Description                   |
| -------- | ------- | ----------------------------- |
| \_amount | uint256 | The amount of tokens to burn. |

### burnFrom

```solidity
function burnFrom(address _account, uint256 _amount) external
```

Burns a specific amount of tokens from another account, using an allowance.

_Reduces the balance of `account` and the total supply by the specified `amount`.
The caller must be allowed to spend at least `amount` of tokens on behalf of `account`.
Implementations should emit a `Transfer` event to indicate tokens were burned._

#### Parameters

| Name      | Type    | Description                                               |
| --------- | ------- | --------------------------------------------------------- |
| \_account | address | The address of the account whose tokens are to be burned. |
| \_amount  | uint256 | The amount of tokens to burn.                             |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## ERC20BurnableFacet

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

## IERC20Burnable

Interface for ERC20 tokens that support token burning.
Allows users or approved accounts to reduce the total token supply.

_This interface defines two methods: - `burn`: Burns a specific amount of tokens from the caller's account. - `burnFrom`: Burns a specific amount of tokens from another account, using an allowance mechanism.
Implementing contracts are expected to handle the necessary checks and emissions of events
like `Transfer` to reflect changes in token balances and total supply._

### burn

```solidity
function burn(uint256 _amount) external
```

Burns a specific amount of tokens from the caller's account.

_Reduces the caller's token balance and the total supply by the specified `amount`.
The caller must have at least the specified `amount` of tokens in their account.
Implementations should emit a `Transfer` event to indicate tokens were burned._

#### Parameters

| Name     | Type    | Description                   |
| -------- | ------- | ----------------------------- |
| \_amount | uint256 | The amount of tokens to burn. |

### burnFrom

```solidity
function burnFrom(address _account, uint256 _amount) external
```

Burns a specific amount of tokens from another account, using an allowance.

_Reduces the balance of `account` and the total supply by the specified `amount`.
The caller must be allowed to spend at least `amount` of tokens on behalf of `account`.
Implementations should emit a `Transfer` event to indicate tokens were burned._

#### Parameters

| Name      | Type    | Description                                               |
| --------- | ------- | --------------------------------------------------------- |
| \_account | address | The address of the account whose tokens are to be burned. |
| \_amount  | uint256 | The amount of tokens to burn.                             |
