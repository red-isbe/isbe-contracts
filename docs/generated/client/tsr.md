## ITimeStampingRegistry

Interface for TimeStamping Registry contract providing hash registry services

_Defines the standard interface for timestamping registry operations including
hash stamping, signature-based operations, and data retrieval with originalHash as primary key_

### Stamped

```solidity
event Stamped(bytes32 originalHash, bytes32 tsaHash, bytes32 externalReferenceId)
```

Event emitted when a TSR hash set is successfully stamped

#### Parameters

| Name                | Type    | Description                                          |
| ------------------- | ------- | ---------------------------------------------------- |
| originalHash        | bytes32 | The original hash that was stamped (primary key)     |
| tsaHash             | bytes32 | The TSA hash that was stamped                        |
| externalReferenceId | bytes32 | The external reference ID associated with the hashes |

### HashNotFound

```solidity
error HashNotFound(bytes32 hash)
```

Error thrown when a hash is not found in the registry

#### Parameters

| Name | Type    | Description                 |
| ---- | ------- | --------------------------- |
| hash | bytes32 | The hash that was not found |

### HashAlreadyExists

```solidity
error HashAlreadyExists(bytes32 hash)
```

Error thrown when a hash already exists in the registry

#### Parameters

| Name | Type    | Description                  |
| ---- | ------- | ---------------------------- |
| hash | bytes32 | The hash that already exists |

### ExternalReferenceIdAlreadyExists

```solidity
error ExternalReferenceIdAlreadyExists(bytes32 externalReferenceId)
```

Error thrown when an external reference ID already exists in the registry

#### Parameters

| Name                | Type    | Description                                   |
| ------------------- | ------- | --------------------------------------------- |
| externalReferenceId | bytes32 | The external reference ID that already exists |

### stamp

```solidity
function stamp(bytes32 _originalHash, bytes32 _tsaHash, bytes32 _externalReferenceId) external
```

Stamp the provided hash set with direct method

_Creates a new timestamp record for the given hashes (authority = requester = msg.sender)_

#### Parameters

| Name                  | Type    | Description                                          |
| --------------------- | ------- | ---------------------------------------------------- |
| \_originalHash        | bytes32 | The original hash to be stamped (primary key)        |
| \_tsaHash             | bytes32 | The TimeStamping Authority response hash             |
| \_externalReferenceId | bytes32 | The external reference ID associated with the hashes |

### stampWithSignature

```solidity
function stampWithSignature(struct SignedTsrData _tsrData, bytes _signature) external
```

Stamp the provided TSR data with a signature

_Creates a new timestamp record using EIP712 signature verification
(authority = msg.sender, requester = SignedTsrData.sender)_

#### Parameters

| Name        | Type                 | Description                                  |
| ----------- | -------------------- | -------------------------------------------- |
| \_tsrData   | struct SignedTsrData | The TimeStamping Registry data to be stamped |
| \_signature | bytes                | The signature associated with the TSR data   |

### isOriginalHashRegistered

```solidity
function isOriginalHashRegistered(bytes32 _originalHash) external view returns (bool exists_)
```

Check if an original hash is registered

_Returns true if the original hash exists in the registry_

#### Parameters

| Name           | Type    | Description                |
| -------------- | ------- | -------------------------- |
| \_originalHash | bytes32 | The original hash to check |

#### Return Values

| Name     | Type | Description                                                  |
| -------- | ---- | ------------------------------------------------------------ |
| exists\_ | bool | A boolean indicating whether the original hash is registered |

### isTsaHashRegistered

```solidity
function isTsaHashRegistered(bytes32 _tsaHash) external view returns (bool exists_)
```

Check if a TSA hash is registered

_Returns true if the TSA hash exists in the registry_

#### Parameters

| Name      | Type    | Description                              |
| --------- | ------- | ---------------------------------------- |
| \_tsaHash | bytes32 | The TimeStamping Authority hash to check |

#### Return Values

| Name     | Type | Description                                             |
| -------- | ---- | ------------------------------------------------------- |
| exists\_ | bool | A boolean indicating whether the TSA hash is registered |

### getTsrRecordFromOriginalHash

```solidity
function getTsrRecordFromOriginalHash(bytes32 _originalHash) external view returns (struct TsrData tsrData, address authority, address requester)
```

Get the complete TSR record for a given original hash

_Returns the TSR data along with authority and requester information_

#### Parameters

| Name           | Type    | Description                              |
| -------------- | ------- | ---------------------------------------- |
| \_originalHash | bytes32 | The original hash to query (primary key) |

#### Return Values

| Name      | Type           | Description                             |
| --------- | -------------- | --------------------------------------- |
| tsrData   | struct TsrData | The TSR data associated with the hash   |
| authority | address        | The address that stamped the hash       |
| requester | address        | The address that requested the stamping |

### isExternalReferenceIdRegistered

```solidity
function isExternalReferenceIdRegistered(bytes32 _externalReferenceId) external view returns (bool exists_)
```

Check if an external reference ID is registered

_Returns true if the external reference ID exists in the registry_

#### Parameters

| Name                  | Type    | Description                        |
| --------------------- | ------- | ---------------------------------- |
| \_externalReferenceId | bytes32 | The external reference ID to check |

#### Return Values

| Name     | Type | Description                                                          |
| -------- | ---- | -------------------------------------------------------------------- |
| exists\_ | bool | A boolean indicating whether the external reference ID is registered |

### getStampedSize

```solidity
function getStampedSize() external view returns (uint256 size_)
```

Get the total number of stamped entries

_Returns the size of the stamped data registry_

#### Return Values

| Name   | Type    | Description                         |
| ------ | ------- | ----------------------------------- |
| size\_ | uint256 | The total number of stamped entries |

### getPaginatedStamped

```solidity
function getPaginatedStamped(uint256 _pageSize, uint256 _pageIndex) external view returns (struct TsrData[] datas_)
```

Get a paginated list of stamped TSR data

_Returns TSR data for the specified page with pagination support_

#### Parameters

| Name        | Type    | Description                                 |
| ----------- | ------- | ------------------------------------------- |
| \_pageSize  | uint256 | The number of items to retrieve per page    |
| \_pageIndex | uint256 | The index of the page to retrieve (0-based) |

#### Return Values

| Name    | Type             | Description                                                  |
| ------- | ---------------- | ------------------------------------------------------------ |
| datas\_ | struct TsrData[] | An array of TimeStamping Registry data on the specified page |

---

## TimeStampingRegistry

Abstract contract implementing timestamping registry with EIP712 support and originalHash as primary key

_Provides external interface for TSR operations including hash stamping,
signature-based operations, and data retrieval. Extends TimeStampingRegistryInternal
and implements ITimeStampingRegistry interface with optimized storage for originalHash queries_

### stamp

```solidity
function stamp(bytes32 _originalHash, bytes32 _tsaHash, bytes32 _externalReferenceId) external
```

Stamp the provided hash set with direct method

_Creates a new timestamp record with role-based access control (authority = requester = msg.sender)_

#### Parameters

| Name                  | Type    | Description                                          |
| --------------------- | ------- | ---------------------------------------------------- |
| \_originalHash        | bytes32 | The original hash to be stamped (primary key)        |
| \_tsaHash             | bytes32 | The TimeStamping Authority response hash             |
| \_externalReferenceId | bytes32 | The external reference ID associated with the hashes |

### stampWithSignature

```solidity
function stampWithSignature(struct SignedTsrData _tsrData, bytes _signature) external
```

Stamp the provided TSR data with a signature

_Creates a new timestamp record using EIP712 signature verification
(authority = msg.sender, requester = SignedTsrData.sender)_

#### Parameters

| Name        | Type                 | Description                                  |
| ----------- | -------------------- | -------------------------------------------- |
| \_tsrData   | struct SignedTsrData | The TimeStamping Registry data to be stamped |
| \_signature | bytes                | The signature associated with the TSR data   |

### isOriginalHashRegistered

```solidity
function isOriginalHashRegistered(bytes32 _originalHash) external view returns (bool exists_)
```

Check if an original hash is registered

_Returns true if the original hash exists in the registry_

#### Parameters

| Name           | Type    | Description                |
| -------------- | ------- | -------------------------- |
| \_originalHash | bytes32 | The original hash to check |

#### Return Values

| Name     | Type | Description                                                  |
| -------- | ---- | ------------------------------------------------------------ |
| exists\_ | bool | A boolean indicating whether the original hash is registered |

### isTsaHashRegistered

```solidity
function isTsaHashRegistered(bytes32 _tsaHash) external view returns (bool exists_)
```

Check if a TSA hash is registered

_Returns true if the TSA hash exists in the registry_

#### Parameters

| Name      | Type    | Description                              |
| --------- | ------- | ---------------------------------------- |
| \_tsaHash | bytes32 | The TimeStamping Authority hash to check |

#### Return Values

| Name     | Type | Description                                             |
| -------- | ---- | ------------------------------------------------------- |
| exists\_ | bool | A boolean indicating whether the TSA hash is registered |

### getTsrRecordFromOriginalHash

```solidity
function getTsrRecordFromOriginalHash(bytes32 _originalHash) external view returns (struct TsrData tsrData, address authority, address requester)
```

Get the complete TSR record for a given original hash

_Returns the TSR data along with authority and requester information_

#### Parameters

| Name           | Type    | Description                              |
| -------------- | ------- | ---------------------------------------- |
| \_originalHash | bytes32 | The original hash to query (primary key) |

#### Return Values

| Name      | Type           | Description                             |
| --------- | -------------- | --------------------------------------- |
| tsrData   | struct TsrData | The TSR data associated with the hash   |
| authority | address        | The address that stamped the hash       |
| requester | address        | The address that requested the stamping |

### isExternalReferenceIdRegistered

```solidity
function isExternalReferenceIdRegistered(bytes32 _externalReferenceId) external view returns (bool exists_)
```

Check if an external reference ID is registered

_Returns true if the external reference ID exists in the registry_

#### Parameters

| Name                  | Type    | Description                        |
| --------------------- | ------- | ---------------------------------- |
| \_externalReferenceId | bytes32 | The external reference ID to check |

#### Return Values

| Name     | Type | Description                                                          |
| -------- | ---- | -------------------------------------------------------------------- |
| exists\_ | bool | A boolean indicating whether the external reference ID is registered |

### getStampedSize

```solidity
function getStampedSize() external view returns (uint256 size_)
```

Get the total number of stamped entries

_Returns the size of the stamped data registry_

#### Return Values

| Name   | Type    | Description                         |
| ------ | ------- | ----------------------------------- |
| size\_ | uint256 | The total number of stamped entries |

### getPaginatedStamped

```solidity
function getPaginatedStamped(uint256 _pageSize, uint256 _pageIndex) external view returns (struct TsrData[] datas_)
```

Get a paginated list of stamped TSR data

_Returns TSR data for the specified page with pagination support_

#### Parameters

| Name        | Type    | Description                                 |
| ----------- | ------- | ------------------------------------------- |
| \_pageSize  | uint256 | The number of items to retrieve per page    |
| \_pageIndex | uint256 | The index of the page to retrieve (0-based) |

#### Return Values

| Name    | Type             | Description                                                  |
| ------- | ---------------- | ------------------------------------------------------------ |
| datas\_ | struct TsrData[] | An array of TimeStamping Registry data on the specified page |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

Returns the implemented interfaces

#### Return Values

| Name         | Type     | Description                      |
| ------------ | -------- | -------------------------------- |
| interfaces\_ | bytes4[] | Array of supported interface IDs |

---

## TimeStampingRegistryFacet

Diamond facet implementing timestamping registry with EIP712 support and originalHash primary key

_Provides external interface for TSR operations within the diamond architecture.
Inherits from TimeStampingRegistry and implements IEIP2535Introspection for
diamond introspection capabilities with optimized storage for originalHash queries_

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Returns the implemented interfaces for this facet

_Implements IEIP2535Introspection interface for diamond compatibility_

#### Return Values

| Name         | Type     | Description                      |
| ------------ | -------- | -------------------------------- |
| interfaces\_ | bytes4[] | Array of supported interface IDs |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Returns the business ID for this facet

_Returns the resolver key used to identify this facet in the diamond_

#### Return Values

| Name         | Type    | Description                     |
| ------------ | ------- | ------------------------------- |
| businessId\_ | bytes32 | The resolver key for this facet |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Returns the function selectors supported by this facet

_Implements IEIP2535Introspection to return all function selectors for TSR operations_

#### Return Values

| Name        | Type     | Description                                         |
| ----------- | -------- | --------------------------------------------------- |
| selectors\_ | bytes4[] | Array of function selectors supported by this facet |

---

## TimeStampingRegistryInternal

Internal logic for timestamping registry operations with originalHash as primary key

_Provides core functionality for TSR operations including optimized storage management,
signature verification, and data retrieval. Uses originalHash as primary key for efficient queries.
Enforces uniqueness on all three hash fields: originalHash, tsaHash, externalReferenceId._

### TimestampingRegistryStorage

Storage structure for timestamping registry data optimized for originalHash queries

_Contains all the mappings and sets needed for TSR operations with triple uniqueness enforcement_

```solidity
struct TimestampingRegistryStorage {
  struct EnumerableSet.Bytes32Set originalHashes;
  mapping(bytes32 => struct TimeStampingRegistryInternal.TsrRecord) records;
  mapping(bytes32 => bytes32) tsaHashToOriginal;
  mapping(bytes32 => bytes32) externalRefToOriginal;
  mapping(address => uint256) nonces;
}
```

### TsrRecord

Individual timestamp record structure with complete TSR data

_Contains all information about a stamped hash set with role tracking_

```solidity
struct TsrRecord {
  struct TsrData data;
  uint256 timestamp;
  address authority;
  address requester;
}
```

### onlyNonExistentOriginalHash

```solidity
modifier onlyNonExistentOriginalHash(bytes32 _originalHash)
```

Modifier to validate that provided original hash doesn't exist

_Reverts if the original hash already exists in the registry_

#### Parameters

| Name           | Type    | Description                |
| -------------- | ------- | -------------------------- |
| \_originalHash | bytes32 | The original hash to check |

### onlyNonExistentTsaHash

```solidity
modifier onlyNonExistentTsaHash(bytes32 _tsaHash)
```

Modifier to validate that provided TSA hash doesn't exist

_Reverts if the TSA hash already exists in the registry_

#### Parameters

| Name      | Type    | Description           |
| --------- | ------- | --------------------- |
| \_tsaHash | bytes32 | The TSA hash to check |

### onlyNonExistentExternalReferenceId

```solidity
modifier onlyNonExistentExternalReferenceId(bytes32 _externalReferenceId)
```

Modifier to validate that provided external reference ID doesn't exist

_Reverts if the external reference ID already exists in the registry_

#### Parameters

| Name                  | Type    | Description                        |
| --------------------- | ------- | ---------------------------------- |
| \_externalReferenceId | bytes32 | The external reference ID to check |

### \_stamp

```solidity
function _stamp(bytes32 _originalHash, bytes32 _tsaHash, bytes32 _externalReferenceId, address _authority, address _requester) internal
```

Internal function to stamp a complete hash set with role tracking

_Creates a new timestamp record and updates all relevant storage structures with triple uniqueness_

#### Parameters

| Name                  | Type    | Description                                                              |
| --------------------- | ------- | ------------------------------------------------------------------------ |
| \_originalHash        | bytes32 | The original hash (primary key)                                          |
| \_tsaHash             | bytes32 | The TSA hash to be stamped                                               |
| \_externalReferenceId | bytes32 | The external reference ID associated with the hashes                     |
| \_authority           | address | The address of the authority performing the stamp (msg.sender)           |
| \_requester           | address | The address requesting the stamping (msg.sender or SignedTsrData.sender) |

### \_stampWithSignature

```solidity
function _stampWithSignature(struct SignedTsrData _tsrData, bytes _signature) internal
```

Internal function to stamp TSR data with signature verification

_Validates signature and nonce before stamping, then increments nonce_

#### Parameters

| Name        | Type                 | Description                       |
| ----------- | -------------------- | --------------------------------- |
| \_tsrData   | struct SignedTsrData | The signed TSR data to be stamped |
| \_signature | bytes                | The signature to verify           |

### \_isOriginalHashRegistered

```solidity
function _isOriginalHashRegistered(bytes32 _originalHash) internal view returns (bool exists_)
```

Internal function to check if an original hash is registered

_Returns true if the original hash exists in the original hashes set_

#### Parameters

| Name           | Type    | Description                |
| -------------- | ------- | -------------------------- |
| \_originalHash | bytes32 | The original hash to check |

#### Return Values

| Name     | Type | Description                                              |
| -------- | ---- | -------------------------------------------------------- |
| exists\_ | bool | True if the original hash is registered, false otherwise |

### \_isTsaHashRegistered

```solidity
function _isTsaHashRegistered(bytes32 _tsaHash) internal view returns (bool exists_)
```

Internal function to check if a TSA hash is registered

_Returns true if the TSA hash exists in the reverse mapping_

#### Parameters

| Name      | Type    | Description           |
| --------- | ------- | --------------------- |
| \_tsaHash | bytes32 | The TSA hash to check |

#### Return Values

| Name     | Type | Description                                         |
| -------- | ---- | --------------------------------------------------- |
| exists\_ | bool | True if the TSA hash is registered, false otherwise |

### \_getTsrRecordFromOriginalHash

```solidity
function _getTsrRecordFromOriginalHash(bytes32 _originalHash) internal view returns (struct TsrData tsrData, address authority, address requester)
```

Internal function to get complete TSR record for a given original hash

_Returns the TSR data along with authority and requester information_

#### Parameters

| Name           | Type    | Description                              |
| -------------- | ------- | ---------------------------------------- |
| \_originalHash | bytes32 | The original hash to query (primary key) |

#### Return Values

| Name      | Type           | Description                             |
| --------- | -------------- | --------------------------------------- |
| tsrData   | struct TsrData | The TSR data associated with the hash   |
| authority | address        | The address that stamped the hash       |
| requester | address        | The address that requested the stamping |

### \_isExternalReferenceIdRegistered

```solidity
function _isExternalReferenceIdRegistered(bytes32 _externalReferenceId) internal view returns (bool exists_)
```

Internal function to check if an external reference ID is registered

_Returns true if the external reference ID exists in the reverse mapping_

#### Parameters

| Name                  | Type    | Description                        |
| --------------------- | ------- | ---------------------------------- |
| \_externalReferenceId | bytes32 | The external reference ID to check |

#### Return Values

| Name     | Type | Description                                                      |
| -------- | ---- | ---------------------------------------------------------------- |
| exists\_ | bool | True if the external reference ID is registered, false otherwise |

### \_getStampedSize

```solidity
function _getStampedSize() internal view returns (uint256 size_)
```

Internal function to get the total number of stamped entries

_Returns the length of the original hashes enumerable set_

#### Return Values

| Name   | Type    | Description                         |
| ------ | ------- | ----------------------------------- |
| size\_ | uint256 | The total number of stamped entries |

### \_getPaginatedStamped

```solidity
function _getPaginatedStamped(uint256 _pageSize, uint256 _pageIndex) internal view returns (struct TsrData[] datas_)
```

Internal function to get paginated list of stamped TSR data

_Uses LibCommon for pagination calculations and returns TSR data array based on originalHash enumeration_

#### Parameters

| Name        | Type    | Description                                 |
| ----------- | ------- | ------------------------------------------- |
| \_pageSize  | uint256 | The number of items to retrieve per page    |
| \_pageIndex | uint256 | The index of the page to retrieve (1-based) |

#### Return Values

| Name    | Type             | Description                                 |
| ------- | ---------------- | ------------------------------------------- |
| datas\_ | struct TsrData[] | An array of TSR data for the specified page |

### \_checkOriginalHash

```solidity
function _checkOriginalHash(bytes32 _originalHash) internal view
```

Internal function to validate that an original hash doesn't exist

_Reverts with HashAlreadyExists error if the hash is already registered_

#### Parameters

| Name           | Type    | Description                |
| -------------- | ------- | -------------------------- |
| \_originalHash | bytes32 | The original hash to check |

### \_checkTsaHash

```solidity
function _checkTsaHash(bytes32 _tsaHash) internal view
```

Internal function to validate that a TSA hash doesn't exist

_Reverts with HashAlreadyExists error if the hash is already registered_

#### Parameters

| Name      | Type    | Description           |
| --------- | ------- | --------------------- |
| \_tsaHash | bytes32 | The TSA hash to check |

### \_checkExternalReferenceId

```solidity
function _checkExternalReferenceId(bytes32 _externalReferenceId) internal view
```

Internal function to validate that an external reference ID doesn't exist

_Reverts with ExternalReferenceIdAlreadyExists error if the ID is already registered_

#### Parameters

| Name                  | Type    | Description                        |
| --------------------- | ------- | ---------------------------------- |
| \_externalReferenceId | bytes32 | The external reference ID to check |

### \_checkStampSignature

```solidity
function _checkStampSignature(struct SignedTsrData _tsrData, bytes _signature) internal view
```

Internal function to validate stamp signature and nonce

_Checks nonce, deadline, and signature validity for stamping operations_

#### Parameters

| Name        | Type                 | Description                     |
| ----------- | -------------------- | ------------------------------- |
| \_tsrData   | struct SignedTsrData | The signed TSR data to validate |
| \_signature | bytes                | The signature to verify         |

### \_isStampSignatureValid

```solidity
function _isStampSignatureValid(struct SignedTsrData _tsrData, bytes _signature) internal view returns (bool isValid_)
```

Internal function to validate stamp signature

_Creates message hash and verifies EIP712 signature_

#### Parameters

| Name        | Type                 | Description                     |
| ----------- | -------------------- | ------------------------------- |
| \_tsrData   | struct SignedTsrData | The signed TSR data to validate |
| \_signature | bytes                | The signature to verify         |

#### Return Values

| Name      | Type | Description                                     |
| --------- | ---- | ----------------------------------------------- |
| isValid\_ | bool | True if the signature is valid, false otherwise |
