## ERC3643Metadata

External contract implementing ERC-3643 metadata management.

_Provides public methods to update and retrieve token metadata such as name, symbol,
onchain identity, and version. Applies access control, validation, and emits events._

### constructor

```solidity
constructor() internal
```

_Disables further initializations for this facet using its resolver key._

### initializeERC3643Metadata

```solidity
function initializeERC3643Metadata(address _newOnchainID, string _newVersion) external
```

Initializes the metadata fields of the token.

_Can only be called once via the initializer modifier.
Emits a {UpdatedTokenInformation} event._

#### Parameters

| Name           | Type    | Description                                                   |
| -------------- | ------- | ------------------------------------------------------------- |
| \_newOnchainID | address | The initial onchain identity address. Can be zero if not set. |
| \_newVersion   | string  | The initial version string. Must be non-empty.                |

### setName

```solidity
function setName(string _newName) external
```

Updates the token name.

_Restricted to token owner. Requires non-empty input and unpaused state.
Emits a {UpdatedTokenInformation} event._

#### Parameters

| Name      | Type   | Description                          |
| --------- | ------ | ------------------------------------ |
| \_newName | string | The new name to assign to the token. |

### setSymbol

```solidity
function setSymbol(string _newSymbol) external
```

Updates the token symbol.

_Restricted to token owner. Requires non-empty input and unpaused state.
Emits a {UpdatedTokenInformation} event._

#### Parameters

| Name        | Type   | Description                            |
| ----------- | ------ | -------------------------------------- |
| \_newSymbol | string | The new symbol to assign to the token. |

### setOnchainID

```solidity
function setOnchainID(address _newOnchainID) external
```

Updates the onchain identity address.

_Restricted to token owner. Can be set to zero. Requires unpaused state.
Emits a {UpdatedTokenInformation} event._

#### Parameters

| Name           | Type    | Description                                 |
| -------------- | ------- | ------------------------------------------- |
| \_newOnchainID | address | The new onchain identity address to assign. |

### onchainID

```solidity
function onchainID() external view returns (address)
```

Returns the current onchain identity address.

#### Return Values

| Name | Type    | Description                                  |
| ---- | ------- | -------------------------------------------- |
| [0]  | address | The address of the token's onchain identity. |

### version

```solidity
function version() external view returns (string)
```

Returns the current version string of the token.

#### Return Values

| Name | Type   | Description                              |
| ---- | ------ | ---------------------------------------- |
| [0]  | string | The TREX version string (e.g., "3.0.0"). |

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
    address onchainid;
    string version;
}
```

### \_initialize

```solidity
function _initialize(address _newOnchainID, string _newVersion) internal
```

_Internal function to initialize the onchain identity and version metadata in storage.
Sets the initial values for the token's onchain ID and version._

#### Parameters

| Name           | Type    | Description                                              |
| -------------- | ------- | -------------------------------------------------------- |
| \_newOnchainID | address | The initial onchain identity address to assign.          |
| \_newVersion   | string  | The initial version string of the token (e.g., "3.0.0"). |

### \_setOnchainID

```solidity
function _setOnchainID(address _newOnchainID) internal
```

_Internal function to update the onchain identity address in storage.
Setting the address to zero indicates that no onchain identity is currently bound to the token._

#### Parameters

| Name           | Type    | Description                                 |
| -------------- | ------- | ------------------------------------------- |
| \_newOnchainID | address | The new onchain identity address to assign. |

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

### \_onchainID

```solidity
function _onchainID() internal view returns (address)
```

_Internal view function to retrieve the current onchain identity address from storage._

#### Return Values

| Name | Type    | Description                                  |
| ---- | ------- | -------------------------------------------- |
| [0]  | address | The address of the token's onchain identity. |

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
event UpdatedTokenInformation(string _newName, string _newSymbol, uint8 _newDecimals, string _newVersion, address _newOnchainID)
```

this event is emitted when the token information is updated.
the event is emitted by the token init function and by the setTokenInformation function
`_newName` is the name of the token
`_newSymbol` is the symbol of the token
`_newDecimals` is the decimals of the token
`_newVersion` is the version of the token, current version is 3.0
`_newOnchainID` is the address of the onchainID of the token

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

### setOnchainID

```solidity
function setOnchainID(address _onchainID) external
```

@dev sets the onchain ID of the token
@param \_onchainID the address of the onchain ID to set
Only the owner of the token smart contract can call this function
emits a `UpdatedTokenInformation` event

### initializeERC3643Metadata

```solidity
function initializeERC3643Metadata(address _newOnchainID, string _newVersion) external
```

Initializes the ERC-3643 metadata fields of the token.

_Sets the initial onchain identity and version string.
Emits a {UpdatedTokenInformation} event._

#### Parameters

| Name           | Type    | Description                                                               |
| -------------- | ------- | ------------------------------------------------------------------------- |
| \_newOnchainID | address | The initial onchain identity address. Can be the zero address if not set. |
| \_newVersion   | string  | The initial version string of the token. Must be non-empty.               |

### onchainID

```solidity
function onchainID() external view returns (address)
```

_Returns the address of the onchainID of the token.
the onchainID of the token gives all the information available
about the token and is managed by the token issuer or his agent._

### version

```solidity
function version() external view returns (string)
```

_Returns the TREX version of the token.
current version is 3.0.0_
