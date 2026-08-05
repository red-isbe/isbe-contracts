## ERC3643Metadata

External contract implementing ERC-3643 metadata management.

_Provides public methods to update and retrieve token metadata such as name, symbol,
     onchain identity, and version. Uses METADATA_ROLE for granular permission control._

### setName

```solidity
function setName(string _newName) external
```

Updates the token name.

_Restricted to metadata role. Requires non-empty input and unpaused state.
     Updates the ERC20 name storage and emits regulatory compliance event._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _newName | string | The new name to assign to the token. Requirements: - Caller must have METADATA_ROLE - Contract must not be paused - _newName must not be empty Emits: - {UpdatedTokenInformation} event with all current token metadata |

### setSymbol

```solidity
function setSymbol(string _newSymbol) external
```

Updates the token symbol.

_Restricted to metadata role. Requires non-empty input and unpaused state.
     Updates the ERC20 symbol storage and emits regulatory compliance event._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _newSymbol | string | The new symbol to assign to the token. Requirements: - Caller must have METADATA_ROLE - Contract must not be paused - _newSymbol must not be empty Emits: - {UpdatedTokenInformation} event with all current token metadata |

### _implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

_Declares the interfaces implemented by this facet._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaces_ | bytes4[] | Array of supported interface identifiers. |



---

## ERC3643MetadataFacet

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

## IERC3643Metadata

Interface for updating and retrieving extended metadata in ERC-3643 tokens.

_Provides setter functions for name, symbol, and onchain identity.
     Includes read-only access to version and onchainID.
     This interface does not expose getters for name or symbol; those are expected
     to be available via the base ERC-20 interface._

### UpdatedTokenInformation

```solidity
event UpdatedTokenInformation(string _newName, string _newSymbol, uint8 _newDecimals)
```

this event is emitted when the token information is updated.
 the event is emitted by the token init function and by the setTokenInformation function
 `_newName` is the name of the token
 `_newSymbol` is the symbol of the token
 `_newDecimals` is the decimals of the token

### NameSet

```solidity
event NameSet(address operator, string newName)
```

Emitted when the token name is updated via {setName}.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operator | address | The account performing the update. |
| newName | string | The new token name. |

### SymbolSet

```solidity
event SymbolSet(address operator, string newSymbol)
```

Emitted when the token symbol is updated via {setSymbol}.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operator | address | The account performing the update. |
| newSymbol | string | The new token symbol. |

### setName

```solidity
function setName(string _name) external
```

@dev sets the token name
 @param _name the name of token to set
 Only the owner of the token smart contract can call this function
 emits `UpdatedTokenInformation` and `NameSet` events

### setSymbol

```solidity
function setSymbol(string _symbol) external
```

@dev sets the token symbol
 @param _symbol the token symbol to set
 Only the owner of the token smart contract can call this function
 emits `UpdatedTokenInformation` and `SymbolSet` events

