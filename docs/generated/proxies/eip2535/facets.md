## DiamondCutAccessControlFacet

Manages the diamond's structure via role-based facet updates.

_A facet for EIP-2535 diamond cuts, secured by access control.
     It implements `IDiamondCut` and uses `AccessControlInternal`.
     Only accounts with `DEFAULT_ADMIN_ROLE` can perform modifications.
     It also complies with `IEIP2535Introspection` for discovery._

### diamondCut

```solidity
function diamondCut(struct IDiamond.ItemCut[] _facetCuts, address _init, bytes _calldata) external
```

Add/replace/remove any number of functions and optionally execute
        a function with delegatecall

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _facetCuts | struct IDiamond.ItemCut[] | Contains the facet addresses and function selectors |
| _init | address | The address of the contract or facet to execute _calldata |
| _calldata | bytes | A function call, including function selector and arguments                  _calldata is executed with delegatecall on _init |

### interfaceCut

```solidity
function interfaceCut(struct IDiamond.ItemCut[] _interfaceCuts) external
```

### facetUpdates

```solidity
function facetUpdates(address[] _facetAddresses, address _init, bytes _calldata) external
```

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Gets the list of ERC-165 interface IDs the facet supports.

_A pure function that returns an array of supported `bytes4` IDs._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaces_ | bytes4[] | An array of supported interface identifiers. |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Retrieves the unique business identifier for this facet.

_Returns a `bytes32` key identifying the facet's purpose._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| businessId_ | bytes32 | The `bytes32` ID for the business logic. |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Gets all function selectors implemented by this facet.

_A pure function that returns a `bytes4[]` array of selectors._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| selectors_ | bytes4[] | An array of `bytes4` function selectors. |



---

## DiamondCutOwnableFacet

Manages diamond cuts, restricting modifications to the owner.

_A dedicated facet for EIP-2535 diamond cuts, secured by ownership.
     It implements `IDiamondCut` and uses the `onlyOwner` modifier.
     Only the owner can add, replace, or remove facets.
     It also complies with `IEIP2535Introspection` for discovery._

### diamondCut

```solidity
function diamondCut(struct IDiamond.ItemCut[] _facetCuts, address _init, bytes _calldata) external
```

Add/replace/remove any number of functions and optionally execute
        a function with delegatecall

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _facetCuts | struct IDiamond.ItemCut[] | Contains the facet addresses and function selectors |
| _init | address | The address of the contract or facet to execute _calldata |
| _calldata | bytes | A function call, including function selector and arguments                  _calldata is executed with delegatecall on _init |

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

| Name | Type | Description |
| ---- | ---- | ----------- |
| _newFacetAddresses | address[] | An array of facet addresses to be updated or initialized. |
| _init | address | The address of the contract or facet to execute `_calldata` with `delegatecall`.              If `_init` is the zero address, no initialization function is called. |
| _calldata | bytes | The data for the function call, including the function selector and arguments.                  This is executed using `delegatecall` on the `_init` address.                  If `_calldata` is empty, no call is executed. |

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Gets the list of ERC-165 interface IDs the facet supports.

_A pure function that returns an array of supported `bytes4` IDs._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaces_ | bytes4[] | An array of supported interface identifiers. |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Retrieves the unique business identifier for this facet.

_Returns a `bytes32` key identifying the facet's purpose._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| businessId_ | bytes32 | The `bytes32` ID for the business logic. |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Gets all function selectors implemented by this facet.

_A pure function that returns a `bytes4[]` array of selectors._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| selectors_ | bytes4[] | An array of `bytes4` function selectors. |



---

## DiamondLoupeFacet

Offers standard EIP-2535 "loupe" functions for inspection.

_An essential facet for inspecting a diamond's structure.
     It implements `IDiamondLoupe` and `IERC165` for discovery.
     Callers can view facets, their functions, and addresses.
     It also supports `IEIP2535Introspection` to declare its role._

### constructor

```solidity
constructor() public
```

### facets

```solidity
function facets() external view returns (struct IDiamondLoupe.Facet[] facets_)
```

Gets all facets and their selectors.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| facets_ | struct IDiamondLoupe.Facet[] | Facet |

### facetFunctionSelectors

```solidity
function facetFunctionSelectors(address _facet) external view returns (bytes4[] functionSelectors_)
```

Gets all the function selectors supported by a specific facet.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _facet | address | The facet address. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| functionSelectors_ | bytes4[] | The selectors associated with a facet address. |

### facetAddresses

```solidity
function facetAddresses() external view returns (address[] facetAddresses_)
```

Get all the facet addresses used by a diamond.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| facetAddresses_ | address[] |  |

### facetAddress

```solidity
function facetAddress(bytes4 _functionSelector) external view returns (address facetAddress_)
```

Gets the facet address that supports the given selector.

_If facet is not found return address(0)._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _functionSelector | bytes4 | The function selector. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| facetAddress_ | address | The facet address. |

### facetVersion

```solidity
function facetVersion(bytes32 _facetKey) external view returns (uint256 version_)
```

Retrieves the version of a specific facet key.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _facetKey | bytes32 | The target facet key for which to retrieve the version. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| version_ | uint256 | The initialized version of the specified facet key. |

### supportsInterface

```solidity
function supportsInterface(bytes4 _interfaceId) external view virtual returns (bool)
```

Checks if a contract supports an interface.
        Returns false for forbidden interfaces, otherwise checks using ERC-165 method.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _interfaceId | bytes4 | The target interface ID to check support for. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if the contract supports the provided interface ID, otherwise false. |

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Gets the list of ERC-165 interface IDs the facet supports.

_A pure function that returns an array of supported `bytes4` IDs._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaces_ | bytes4[] | An array of supported interface identifiers. |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Retrieves the unique business identifier for this facet.

_Returns a `bytes32` key identifying the facet's purpose._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| businessId_ | bytes32 | The `bytes32` ID for the business logic. |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Gets all function selectors implemented by this facet.

_A pure function that returns a `bytes4[]` array of selectors._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| selectors_ | bytes4[] | An array of `bytes4` function selectors. |

### _implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

