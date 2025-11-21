## IDiamond

_Defines the interface for the Diamond Standard (EIP-2535).
This interface provides structures, enums, and events required for managing facets
in a diamond (a modular and upgradable contract system)._

### ItemCutAction

\_Enum that defines the type of action to perform on a facet.

- Add: Add a new facet or selectors to the diamond.
- Replace: Replace an existing facet's selectors with new ones.
- Remove: Remove a facet's selectors from the diamond.\_

```solidity
enum ItemCutAction {
    Add,
    Replace,
    Remove
}
```

### ItemsType

```solidity
enum ItemsType {
    Selectors,
    Interfaces
}
```

### ItemCut

```solidity
struct ItemCut {
  address facetAddress;
  enum IDiamond.ItemCutAction action;
  bytes4[] items;
}
```

### DiamondCut

```solidity
event DiamondCut(struct IDiamond.ItemCut[] _diamondCut, address _init, bytes _calldata)
```

_Emitted when the diamond's facets are updated.
This event signals changes to the diamond's state (e.g., adding, replacing, or removing facets)._

#### Parameters

| Name         | Type                      | Description                                                        |
| ------------ | ------------------------- | ------------------------------------------------------------------ |
| \_diamondCut | struct IDiamond.ItemCut[] | An array of FacetCut defining the actions performed on facets.     |
| \_init       | address                   | The address of a contract or facet to execute initialization code. |
| \_calldata   | bytes                     | The calldata for the initialization function called on `_init`.    |

### InterfacesUpdate

```solidity
event InterfacesUpdate(struct IDiamond.ItemCut[] _interfaceCut)
```

_Emitted when the diamond's interfaces are updated.
This event signals changes to the diamond's state (e.g., adding, replacing or removing interfaces)._

#### Parameters

| Name           | Type                      | Description                                                            |
| -------------- | ------------------------- | ---------------------------------------------------------------------- |
| \_interfaceCut | struct IDiamond.ItemCut[] | An array of InterfaceCut defining the actions performed on interfaces. |

---

## IDiamondCut

_Extends the IDiamond interface and defines functions for adding, replacing, or removing facets
in a modular contract system (Diamond Standard, EIP-2535)._

### diamondCut

```solidity
function diamondCut(struct IDiamond.ItemCut[] _diamondCut, address _init, bytes _calldata) external
```

Add, replace, or remove any number of functions, and optionally execute
a function with `delegatecall` for initialization or other purposes.

#### Parameters

| Name         | Type                      | Description                                                                                                                                                                                                            |
| ------------ | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_diamondCut | struct IDiamond.ItemCut[] | An array of FacetCut structures, each containing: - The facet address to add, replace, or remove. - The type of action to perform (add, replace, remove). - An array of function selectors to add, replace, or remove. |
| \_init       | address                   | The address of the contract or facet to execute `_calldata` with `delegatecall`. Can be used for initialization or setup after a diamond update. If `_init` is the zero address, no initialization function is called. |
| \_calldata   | bytes                     | The data for the function call, including the function selector and arguments. This is executed using `delegatecall` on the `_init` address. If `_calldata` is empty, no call is executed.                             |

### interfaceCut

```solidity
function interfaceCut(struct IDiamond.ItemCut[] _interfaceCuts) external
```

### facetUpdates

```solidity
function facetUpdates(address[] _newFacetAddresses, address _init, bytes _calldata) external
```

Update the facets of the diamond by specifying facet addresses,
optionally executing a function with `delegatecall` for initialization or other purposes.

#### Parameters

| Name                | Type      | Description                                                                                                                                                                                |
| ------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| \_newFacetAddresses | address[] | An array of facet addresses to be updated or initialized.                                                                                                                                  |
| \_init              | address   | The address of the contract or facet to execute `_calldata` with `delegatecall`. If `_init` is the zero address, no initialization function is called.                                     |
| \_calldata          | bytes     | The data for the function call, including the function selector and arguments. This is executed using `delegatecall` on the `_init` address. If `_calldata` is empty, no call is executed. |

---

## IDiamondLoupe

This interface is a required part of the Diamond Standard (EIP-2535).

_Implements a set of view-only functions to inspect and analyze the structure of a diamond contract.
Inspired by the concept of a loupe—a magnifying glass used to examine diamonds.
These functions allow tools and developers to retrieve information about diamond facets and their selectors._

### Facet

_Represents a facet in the diamond._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Facet {
    address facetAddress;
    bytes4[] functionSelectors;
}
```

### facets

```solidity
function facets() external view returns (struct IDiamondLoupe.Facet[] facets_)
```

Retrieves all facet addresses along with their respective four-byte function selectors.

#### Return Values

| Name     | Type                         | Description                                                                                                                                       |
| -------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| facets\_ | struct IDiamondLoupe.Facet[] | An array of `Facet` structures containing: - `facetAddress`: The address of the facet. - `functionSelectors`: The function selectors it supports. |

### facetFunctionSelectors

```solidity
function facetFunctionSelectors(address _facet) external view returns (bytes4[] facetFunctionSelectors_)
```

Retrieves all function selectors supported by a specific facet.

#### Parameters

| Name    | Type    | Description                        |
| ------- | ------- | ---------------------------------- |
| \_facet | address | The address of the facet to query. |

#### Return Values

| Name                     | Type     | Description                                                                    |
| ------------------------ | -------- | ------------------------------------------------------------------------------ |
| facetFunctionSelectors\_ | bytes4[] | An array of function selectors (as `bytes4`) supported by the specified facet. |

### facetAddresses

```solidity
function facetAddresses() external view returns (address[] facetAddresses_)
```

Retrieves all facet addresses currently used by the diamond.

#### Return Values

| Name             | Type      | Description                                                   |
| ---------------- | --------- | ------------------------------------------------------------- |
| facetAddresses\_ | address[] | An array of addresses representing the facets in the diamond. |

### facetAddress

```solidity
function facetAddress(bytes4 _functionSelector) external view returns (address facetAddress_)
```

Retrieves the facet address associated with a given function selector.

_If no facet supports the selector, the function will return the zero address (`address(0)`)._

#### Parameters

| Name               | Type   | Description                     |
| ------------------ | ------ | ------------------------------- |
| \_functionSelector | bytes4 | The function selector to query. |

#### Return Values

| Name           | Type    | Description                                                                        |
| -------------- | ------- | ---------------------------------------------------------------------------------- |
| facetAddress\_ | address | The address of the facet that supports the selector, or `address(0)` if not found. |

### facetVersion

```solidity
function facetVersion(bytes32 _facetKey) external view returns (uint256 version_)
```

Retrieves the version of a specific facet key.

#### Parameters

| Name       | Type    | Description                                             |
| ---------- | ------- | ------------------------------------------------------- |
| \_facetKey | bytes32 | The target facet key for which to retrieve the version. |

#### Return Values

| Name      | Type    | Description                                         |
| --------- | ------- | --------------------------------------------------- |
| version\_ | uint256 | The initialized version of the specified facet key. |

---

## IEIP2535Introspection

Defines introspection functions for EIP-2535 diamonds.

_Allows callers to discover supported interfaces, selectors,
and a unique business ID, enhancing discoverability._

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
