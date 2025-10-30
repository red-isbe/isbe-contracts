## ERC3643Metadata

External contract implementing ERC-3643 metadata management.

_Provides public methods to update and retrieve token metadata such as name, symbol,
onchain identity, and version. Uses METADATA_ROLE for granular permission control._

### constructor

```solidity
constructor() internal
```

_Disables further initializations for this facet using its resolver key._

### initializeERC3643Metadata

```solidity
function initializeERC3643Metadata(string _newVersion) external
```

Initializes the metadata fields of the token.

_Can only be called once via the initializer modifier.
Emits a {UpdatedTokenInformation} event._

#### Parameters

| Name         | Type   | Description                                    |
| ------------ | ------ | ---------------------------------------------- |
| \_newVersion | string | The initial version string. Must be non-empty. |

### setName

```solidity
function setName(string _newName) external
```

Updates the token name.

_Restricted to metadata role. Requires non-empty input and unpaused state.
Updates the ERC20 name storage and emits regulatory compliance event._

#### Parameters

| Name      | Type   | Description                                                                                                                                                                                                              |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| \_newName | string | The new name to assign to the token. Requirements: - Caller must have METADATA_ROLE - Contract must not be paused - \_newName must not be empty Emits: - {UpdatedTokenInformation} event with all current token metadata |

### setSymbol

```solidity
function setSymbol(string _newSymbol) external
```

Updates the token symbol.

_Restricted to metadata role. Requires non-empty input and unpaused state.
Updates the ERC20 symbol storage and emits regulatory compliance event._

#### Parameters

| Name        | Type   | Description                                                                                                                                                                                                                  |
| ----------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_newSymbol | string | The new symbol to assign to the token. Requirements: - Caller must have METADATA_ROLE - Contract must not be paused - \_newSymbol must not be empty Emits: - {UpdatedTokenInformation} event with all current token metadata |

### version

```solidity
function version() external view returns (string)
```

Returns the current version string of the token.

#### Return Values

| Name | Type   | Description                                                                                                                                                             |
| ---- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [0]  | string | string The ERC3643/TREX version string (e.g., "4.0.0"). Note: Version follows semantic versioning and indicates the ERC3643 protocol version implemented by this token. |

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

## ERC3643MetadataFacet

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

## ERC3643MetadataInternal

Internal contract for managing ERC-3643 metadata: onchain identity and version.

_Provides internal functions to read and write metadata fields.
This contract does not emit events or apply access control.
It is intended to be used by external contracts that handle authorization and event emission._

### ERC3643MetadataStorage

_Storage structure for ERC-3643 metadata._

```solidity
struct ERC3643MetadataStorage {
    string version;
}
```

### \_initialize

```solidity
function _initialize(string _newVersion) internal
```

_Internal function to initialize the onchain identity and version metadata in storage.
Sets the initial values for the token's onchain ID and version._

#### Parameters

| Name         | Type   | Description                                              |
| ------------ | ------ | -------------------------------------------------------- |
| \_newVersion | string | The initial version string of the token (e.g., "3.0.0"). |

### \_setVersion

```solidity
function _setVersion(string _newVersion) internal
```

_Internal function to update the version string in storage.
The version should follow semantic versioning (e.g., "3.0.0")._

#### Parameters

| Name         | Type   | Description                       |
| ------------ | ------ | --------------------------------- |
| \_newVersion | string | The new version string to assign. |

### \_version

```solidity
function _version() internal view returns (string)
```

_Internal view function to retrieve the current version string from storage._

#### Return Values

| Name | Type   | Description                      |
| ---- | ------ | -------------------------------- |
| [0]  | string | The version string of the token. |

---

## IERC3643Metadata

Interface for updating and retrieving extended metadata in ERC-3643 tokens.

_Provides setter functions for name, symbol, and onchain identity.
Includes read-only access to version and onchainID.
This interface does not expose getters for name or symbol; those are expected
to be available via the base ERC-20 interface._

### UpdatedTokenInformation

```solidity
event UpdatedTokenInformation(string _newName, string _newSymbol, uint8 _newDecimals, string _newVersion)
```

this event is emitted when the token information is updated.
the event is emitted by the token init function and by the setTokenInformation function
`_newName` is the name of the token
`_newSymbol` is the symbol of the token
`_newDecimals` is the decimals of the token
`_newVersion` is the version of the token, current version is 3.0

### setName

```solidity
function setName(string _name) external
```

@dev sets the token name
@param \_name the name of token to set
Only the owner of the token smart contract can call this function
emits a `UpdatedTokenInformation` event

### setSymbol

```solidity
function setSymbol(string _symbol) external
```

@dev sets the token symbol
@param \_symbol the token symbol to set
Only the owner of the token smart contract can call this function
emits a `UpdatedTokenInformation` event

### initializeERC3643Metadata

```solidity
function initializeERC3643Metadata(string _newVersion) external
```

Initializes the ERC-3643 metadata fields of the token.

_Sets the initial onchain identity and version string.
Emits a {UpdatedTokenInformation} event._

#### Parameters

| Name         | Type   | Description                                                 |
| ------------ | ------ | ----------------------------------------------------------- |
| \_newVersion | string | The initial version string of the token. Must be non-empty. |

### version

```solidity
function version() external view returns (string)
```

_Returns the TREX version of the token.
current version is 3.0.0_
