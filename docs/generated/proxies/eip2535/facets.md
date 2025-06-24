## DiamondCutAccessControlFacet

### diamondCut

```solidity
function diamondCut(struct IDiamond.FacetCut[] _facetCuts, address _init, bytes _calldata) external
```

Add/replace/remove any number of functions and optionally execute
a function with delegatecall

#### Parameters

| Name        | Type                       | Description                                                                                                   |
| ----------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| \_facetCuts | struct IDiamond.FacetCut[] | Contains the facet addresses and function selectors                                                           |
| \_init      | address                    | The address of the contract or facet to execute \_calldata                                                    |
| \_calldata  | bytes                      | A function call, including function selector and arguments \_calldata is executed with delegatecall on \_init |

### facetUpdates

```solidity
function facetUpdates(address[] _facetAddresses, address _init, bytes _calldata) external
```

Update the facets of the diamond by specifying facet addresses,
optionally executing a function with `delegatecall` for initialization or other purposes.

#### Parameters

| Name             | Type      | Description                                                                                                                                                                                |
| ---------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| \_facetAddresses | address[] | An array of facet addresses to be updated or initialized.                                                                                                                                  |
| \_init           | address   | The address of the contract or facet to execute `_calldata` with `delegatecall`. If `_init` is the zero address, no initialization function is called.                                     |
| \_calldata       | bytes     | The data for the function call, including the function selector and arguments. This is executed using `delegatecall` on the `_init` address. If `_calldata` is empty, no call is executed. |

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

## DiamondCutOwnableFacet

### diamondCut

```solidity
function diamondCut(struct IDiamond.FacetCut[] _facetCuts, address _init, bytes _calldata) external
```

Add/replace/remove any number of functions and optionally execute
a function with delegatecall

#### Parameters

| Name        | Type                       | Description                                                                                                   |
| ----------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| \_facetCuts | struct IDiamond.FacetCut[] | Contains the facet addresses and function selectors                                                           |
| \_init      | address                    | The address of the contract or facet to execute \_calldata                                                    |
| \_calldata  | bytes                      | A function call, including function selector and arguments \_calldata is executed with delegatecall on \_init |

### facetUpdates

```solidity
function facetUpdates(address[] _facetAddresses, address _init, bytes _calldata) external
```

Update the facets of the diamond by specifying facet addresses,
optionally executing a function with `delegatecall` for initialization or other purposes.

#### Parameters

| Name             | Type      | Description                                                                                                                                                                                |
| ---------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| \_facetAddresses | address[] | An array of facet addresses to be updated or initialized.                                                                                                                                  |
| \_init           | address   | The address of the contract or facet to execute `_calldata` with `delegatecall`. If `_init` is the zero address, no initialization function is called.                                     |
| \_calldata       | bytes     | The data for the function call, including the function selector and arguments. This is executed using `delegatecall` on the `_init` address. If `_calldata` is empty, no call is executed. |

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

## DiamondLoupeFacet

### facets

```solidity
function facets() external view returns (struct IDiamondLoupe.Facet[] facets_)
```

Gets all facets and their selectors.

#### Return Values

| Name     | Type                         | Description |
| -------- | ---------------------------- | ----------- |
| facets\_ | struct IDiamondLoupe.Facet[] | Facet       |

### facetFunctionSelectors

```solidity
function facetFunctionSelectors(address _facet) external view returns (bytes4[] functionSelectors_)
```

Gets all the function selectors supported by a specific facet.

#### Parameters

| Name    | Type    | Description        |
| ------- | ------- | ------------------ |
| \_facet | address | The facet address. |

#### Return Values

| Name                | Type     | Description                                    |
| ------------------- | -------- | ---------------------------------------------- |
| functionSelectors\_ | bytes4[] | The selectors associated with a facet address. |

### facetAddresses

```solidity
function facetAddresses() external view returns (address[] facetAddresses_)
```

Get all the facet addresses used by a diamond.

#### Return Values

| Name             | Type      | Description |
| ---------------- | --------- | ----------- |
| facetAddresses\_ | address[] |             |

### facetAddress

```solidity
function facetAddress(bytes4 _functionSelector) external view returns (address facetAddress_)
```

Gets the facet address that supports the given selector.

_If facet is not found return address(0)._

#### Parameters

| Name               | Type   | Description            |
| ------------------ | ------ | ---------------------- |
| \_functionSelector | bytes4 | The function selector. |

#### Return Values

| Name           | Type    | Description        |
| -------------- | ------- | ------------------ |
| facetAddress\_ | address | The facet address. |

### supportsInterface

```solidity
function supportsInterface(bytes4 _interfaceId) external view returns (bool)
```

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
