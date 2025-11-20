## DidController

Provides comprehensive management of W3C-compliant DID controllers with cryptographic
verification methods and temporal validity periods

_Implements the complete DID specification including cryptographic controller relationships._

### addController

```solidity
function addController(bytes32 did, bytes32 controller) external returns (bool)
```

Adds a new controller to the specified DID

_Requires appropriate authorisation to modify the DID_

#### Parameters

| Name       | Type    | Description                                                |
| ---------- | ------- | ---------------------------------------------------------- |
| did        | bytes32 | The decentralised identifier to receive the new controller |
| controller | bytes32 | The controller identifier to be added                      |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0]  | bool |             |

### revokeController

```solidity
function revokeController(bytes32 did, bytes32 controller) external returns (bool success)
```

Revokes an existing controller from the specified DID

_Requires appropriate authorisation to modify the DID_

#### Parameters

| Name       | Type    | Description                                         |
| ---------- | ------- | --------------------------------------------------- |
| did        | bytes32 | The decentralised identifier to lose the controller |
| controller | bytes32 | The controller identifier to be revoked             |

#### Return Values

| Name    | Type | Description                                                     |
| ------- | ---- | --------------------------------------------------------------- |
| success | bool | Boolean indicating whether the operation completed successfully |

### getDidsByController

```solidity
function getDidsByController(bytes32 controller, uint256 page, uint256 pageSize) external view returns (bytes32[] items, uint256 total, uint256 howMany, uint256 prev, uint256 next)
```

Retrieves paginated list of DIDs controlled by the specified controller

_Returns paginated results to handle large datasets efficiently_

#### Parameters

| Name       | Type    | Description                              |
| ---------- | ------- | ---------------------------------------- |
| controller | bytes32 | The controller identifier to query for   |
| page       | uint256 | The page number to retrieve (zero-based) |
| pageSize   | uint256 | The maximum number of items per page     |

#### Return Values

| Name    | Type      | Description                                                 |
| ------- | --------- | ----------------------------------------------------------- |
| items   | bytes32[] | Array of DID strings controlled by the specified controller |
| total   | uint256   | Total number of DIDs controlled by this controller          |
| howMany | uint256   | Number of items returned in current page                    |
| prev    | uint256   | Previous page number (zero if no previous page)             |
| next    | uint256   | Next page number (zero if no next page)                     |

### checkController

```solidity
function checkController(bytes32 did, address controller) external view returns (bool isController)
```

Checks if an address is authorised as a controller for the specified DID

_Validates controller permissions using bytes32 did format_

#### Parameters

| Name       | Type    | Description                                   |
| ---------- | ------- | --------------------------------------------- |
| did        | bytes32 | The decentralised identifier to check against |
| controller | address | The address to verify as a controller         |

#### Return Values

| Name         | Type | Description                                                   |
| ------------ | ---- | ------------------------------------------------------------- |
| isController | bool | Boolean indicating if the address is an authorised controller |

### checkController

```solidity
function checkController(bytes did, address controller) external view returns (bool isController)
```

Checks if an address is authorised as a controller for the specified DID

_Validates controller permissions using bytes DID format for optimised operations_

#### Parameters

| Name       | Type    | Description                                                   |
| ---------- | ------- | ------------------------------------------------------------- |
| did        | bytes   | The decentralised identifier in bytes format to check against |
| controller | address | The address to verify as a controller                         |

#### Return Values

| Name         | Type | Description                                                   |
| ------------ | ---- | ------------------------------------------------------------- |
| isController | bool | Boolean indicating if the address is an authorised controller |

---

## DidControllerFacet

Diamond pattern facet implementation providing DID controller management capabilities
within the EIP-2535 modular proxy architecture

_Combines DID controller functionality with diamond introspection capabilities to enable
dynamic contract composition. Implements interface discovery and selector enumeration
for seamless integration with diamond proxy systems and external contract analysis_

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

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## DidControllerInternal

Internal abstract contract for managing DID controller relationships and mappings

_Provides foundational functionality for linking and managing relationships between
decentralised identifiers and their controlling entities. Implements efficient
storage patterns for controller-to-DID mappings with indexed access capabilities_

### ControllersStorage

Storage structure for managing controller-to-DID relationships

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct ControllersStorage {
    mapping(bytes32 => bytes32[]) didsByController;
    mapping(bytes32 => mapping(bytes32 => uint256)) didsByControllerIndex;
}
```

### onlyControllerOrAuth

```solidity
modifier onlyControllerOrAuth(bytes32 did)
```

### onlyNotController

```solidity
modifier onlyNotController(bytes32 did, bytes32 controller)
```

### onlyController

```solidity
modifier onlyController(bytes32 did, bytes32 controller)
```

### onlyNotLastController

```solidity
modifier onlyNotLastController(bytes32 did, bytes32 controller)
```

### \_linkDidToController

```solidity
function _linkDidToController(bytes32 did, bytes32 controller) internal returns (bool)
```

### \_unlinkDidFromController

```solidity
function _unlinkDidFromController(bytes32 _did, bytes32 _controller) internal returns (bool)
```

### \_getDidsByController

```solidity
function _getDidsByController(bytes32 controller, uint256 _page, uint256 _pageSize) internal view returns (bytes32[] items_, uint256 total_, uint256 howMany_, uint256 prev_, uint256 next_)
```

---

## DidDocumentDetailed

Provides comprehensive management of W3C-compliant DID documents with cryptographic
verification methods and temporal validity periods

_Implements the complete DID specification including document creation, verification
method management, and cryptographic controller relationships. Supports multiple
elliptic curve types for enhanced cryptographic flexibility and interoperability_

### constructor

```solidity
constructor() internal
```

Constructor that disables the initializer

### initializeDiDRegistry

```solidity
function initializeDiDRegistry(enum IDidDocumentDetailed.EllipticType _ellipticType) external
```

### insertFirstDidDocument

```solidity
function insertFirstDidDocument(bytes32 _did, string _baseDocument, bytes32 _vMethodId, bytes _proof, bytes _publicKey, enum IDidDocumentDetailed.EllipticType _ellipticType, uint256 _notBefore, uint256 _notAfter, string _alsoKnownAs) external returns (bool)
```

### insertDidDocument

```solidity
function insertDidDocument(bytes32 _did, string _baseDocument, bytes32 _vMethodId, bytes _publicKey, enum IDidDocumentDetailed.EllipticType _ellipticType, uint256 _notBefore, uint256 _notAfter) external returns (bool)
```

### updateBaseDocument

```solidity
function updateBaseDocument(bytes32 did, string baseDocument) external returns (bool)
```

Updates the base document content of an existing DID

_Modifies the JSON-LD document content whilst preserving verification methods
and relationships. Requires appropriate authorisation to prevent unauthorised changes_

#### Parameters

| Name         | Type    | Description                                                        |
| ------------ | ------- | ------------------------------------------------------------------ |
| did          | bytes32 | The decentralised identifier whose base document should be updated |
| baseDocument | string  | The new base JSON-LD document content to set                       |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0]  | bool |             |

### updateAlsoKnownAs

```solidity
function updateAlsoKnownAs(bytes32 _did, string _alsoKnownAs) external returns (bool)
```

### getDids

```solidity
function getDids(uint256 _page, uint256 _pageSize) external view returns (bytes32[] items_, uint256 total_, uint256 howMany_, uint256 prev_, uint256 next_)
```

### getDidDocument

```solidity
function getDidDocument(bytes32 _did) external view returns (string baseDocument_, string alsoKnownAs_, bytes32[] controllers_, bytes32[] vMethodIds_, struct IDidDocumentDetailed.VMethod[] vMethods_, struct IDidDocumentDetailed.VRelationship[] vRelationships_)
```

### getDidDocumentByTimestamp

```solidity
function getDidDocumentByTimestamp(bytes32 _did, uint256 _timestamp) external view returns (string baseDocument_, string alsoKnownAs_, bytes32[] controllers_, bytes32[] vMethodIds_, struct IDidDocumentDetailed.VMethod[] vMethods_, struct IDidDocumentDetailed.VRelationship[] vRelationships_)
```

---

## DidDocumentDetailedFacet

Diamond pattern facet implementation providing DID document management capabilities
within the EIP-2535 modular proxy architecture

_Combines DID document functionality with diamond introspection capabilities to enable
dynamic contract composition. Implements interface discovery and selector enumeration
for seamless integration with diamond proxy systems and external contract analysis_

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

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## DidDocumentDetailedInternal

Core internal logic for managing W3C-compliant DID documents with cryptographic
verification methods and temporal validation periods

_Abstract contract providing internal DID document management functionality including
storage operations, verification method handling, and relationship management.
Implements temporal filtering and cryptographic key validation for enhanced security_

### DidDocument

Complete DID document structure with verification methods and relationships

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct DidDocument {
  string baseDocument;
  string alsoKnownAs;
  bytes32[] controllers;
  mapping(bytes32 => bool) controllerExist;
  mapping(bytes32 => struct IDidDocumentDetailed.VMethod) vMethods;
  struct IDidDocumentDetailed.VRelationship[] vRelationships;
  struct IDidDocumentDetailed.VRelationship[] capabilityInvocations;
  mapping(bytes32 => bool) vRelationshipsNameAndMethodIdTuple;
  mapping(bytes32 => uint256[]) vRelationshipsIndexes;
  mapping(bytes32 => bool) capabilityInvocationMethodIdExist;
  mapping(bytes32 => uint256) capabilityInvocationMethodIdIndex;
  mapping(address => bytes32) vMethodIdOfAddress;
  bool exists;
}
```

### DidDocumentsStorage

Global storage structure for all DID documents and network configuration

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct DidDocumentsStorage {
  enum IDidDocumentDetailed.EllipticType networkEllipticType;
  mapping(bytes32 => struct DidDocumentDetailedInternal.DidDocument) didList;
  bytes32[] dids;
  mapping(address => bytes32) invocationAddressToDid;
}
```

### onlyValidDid

```solidity
modifier onlyValidDid(bytes32 _did)
```

### onlyDidExists

```solidity
modifier onlyDidExists(bytes32 _did)
```

### onlyValidEllipticType

```solidity
modifier onlyValidEllipticType(enum IDidDocumentDetailed.EllipticType _ellipticType)
```

### validateEllipticType

```solidity
modifier validateEllipticType(enum IDidDocumentDetailed.EllipticType _ellipticType)
```

### onlyEmptyVMethodAndPublicKey

```solidity
modifier onlyEmptyVMethodAndPublicKey(bytes32 _did, bytes32 _vMethodId, bytes _publicKey, enum IDidDocumentDetailed.EllipticType _ellipticType)
```

### onlyVMethodIdExists

```solidity
modifier onlyVMethodIdExists(bytes32 _did, bytes32 _vMethodId)
```

### validateRollArgs

```solidity
modifier validateRollArgs(struct IDidVerificationMethod.RollArgs _args)
```

### onlyGoodRollArgs

```solidity
modifier onlyGoodRollArgs(struct IDidVerificationMethod.RollArgs _args)
```

### onlyKnownDid

```solidity
modifier onlyKnownDid(address _address)
```

Validates that an address is registered in the DID registry with active capability invocation

#### Parameters

| Name      | Type    | Description                      |
| --------- | ------- | -------------------------------- |
| \_address | address | The Ethereum address to validate |

### \_setEllipticType

```solidity
function _setEllipticType(enum IDidDocumentDetailed.EllipticType _ellipticType) internal
```

### \_insertDidDocument

```solidity
function _insertDidDocument(bytes32 _did, string _baseDocument, bytes32 _vMethodId, bytes _publicKey, enum IDidDocumentDetailed.EllipticType _ellipticType, uint256 _notBefore, uint256 _notAfter, string _alsoKnownAs) internal returns (bool)
```

### \_addVerificationRelationshipToDocument

```solidity
function _addVerificationRelationshipToDocument(bytes32 _did, string _name, bytes32 _vMethodId, uint256 _notBefore, uint256 _notAfter) internal returns (bool)
```

### \_addVerificationMethod

```solidity
function _addVerificationMethod(bytes32 _did, bytes32 _vMethodId, bytes _publicKey, enum IDidDocumentDetailed.EllipticType _ellipticType) internal returns (bool)
```

### \_revokeVerificationMethod

```solidity
function _revokeVerificationMethod(bytes32 _did, bytes32 _vMethodId, uint256 _notAfter) internal returns (bool)
```

### \_expireVerificationMethod

```solidity
function _expireVerificationMethod(bytes32 _did, bytes32 _vMethodId, uint256 _notAfter) internal returns (bool)
```

### \_addControllerToDocument

```solidity
function _addControllerToDocument(bytes32 _did, bytes32 _controller) internal returns (bool)
```

### \_removeControllerToDocument

```solidity
function _removeControllerToDocument(bytes32 _did, bytes32 _controller) internal returns (bool)
```

### \_rollVerificationMethod

```solidity
function _rollVerificationMethod(struct IDidVerificationMethod.RollArgs _args) internal returns (bool)
```

### \_rollExistingVerificationRelationships

```solidity
function _rollExistingVerificationRelationships(struct DidDocumentDetailedInternal.DidDocument document, struct IDidVerificationMethod.RollArgs _args, uint256 newNotAfter) internal
```

### \_rollCapabilityInvocation

```solidity
function _rollCapabilityInvocation(struct DidDocumentDetailedInternal.DidDocument document, struct IDidVerificationMethod.RollArgs _args, uint256 newNotAfter) internal
```

### \_updateBaseDocument

```solidity
function _updateBaseDocument(bytes32 _did, string baseDocument) internal returns (bool)
```

### \_updateAlsoKnownAs

```solidity
function _updateAlsoKnownAs(bytes32 _did, string _alsoKnownAs) internal returns (bool)
```

### \_getDids

```solidity
function _getDids(uint256 _page, uint256 _pageSize) internal view returns (bytes32[] items_, uint256 total_, uint256 howMany_, uint256 prev_, uint256 next_)
```

### \_getDidDocument

```solidity
function _getDidDocument(bytes32 _did) internal view returns (string baseDocument_, string alsoKnownAs_, bytes32[] controllers_, bytes32[] vMethodIds_, struct IDidDocumentDetailed.VMethod[] vMethods_, struct IDidDocumentDetailed.VRelationship[] vRelationships_)
```

### \_getDidDocumentByTimestamp

```solidity
function _getDidDocumentByTimestamp(bytes32 _did, uint256 _timestamp) internal view returns (string baseDocument_, string alsoKnownAs_, bytes32[] controllers_, bytes32[] vMethodIds_, struct IDidDocumentDetailed.VMethod[] vMethods_, struct IDidDocumentDetailed.VRelationship[] vRelationships_)
```

### \_checkEllipticType

```solidity
function _checkEllipticType(enum IDidDocumentDetailed.EllipticType _ellipticType) internal view
```

### \_checkValidDid

```solidity
function _checkValidDid(bytes32 _did) internal view
```

### \_checkDidExists

```solidity
function _checkDidExists(bytes32 _did) internal view
```

### \_checkEmptyVMethod

```solidity
function _checkEmptyVMethod(bytes32 _did, bytes32 _vMethodId) internal view
```

### \_checkVMethodExists

```solidity
function _checkVMethodExists(bytes32 _did, bytes32 _vMethodId) internal view
```

### \_checkVMethodNotRevoked

```solidity
function _checkVMethodNotRevoked(bytes32 _did, bytes32 _vMethodId) internal view
```

### \_checkPublicKeyNotAssigned

```solidity
function _checkPublicKeyNotAssigned(bytes32 _did, bytes _publicKey, enum IDidDocumentDetailed.EllipticType _ellipticType) internal view
```

### \_checkKnownDid

```solidity
function _checkKnownDid(address _address) internal view
```

Validates that an address is known in the DID registry with active capability invocation

#### Parameters

| Name      | Type    | Description             |
| --------- | ------- | ----------------------- |
| \_address | address | The address to validate |

### \_notExistDid

```solidity
function _notExistDid(bytes32 _did) internal view returns (bool)
```

### \_existsDid

```solidity
function _existsDid(bytes32 _did) internal view returns (bool)
```

### \_notExistsVMethod

```solidity
function _notExistsVMethod(bytes32 _did, bytes32 _vMethodId) internal view returns (bool)
```

### \_existsVMethod

```solidity
function _existsVMethod(bytes32 _did, bytes32 _vMethodId) internal view returns (bool)
```

### \_isController

```solidity
function _isController(bytes32 _did, address controller) internal view returns (bool)
```

### \_getControllerCount

```solidity
function _getControllerCount(bytes32 did) internal view returns (uint256)
```

### \_isController

```solidity
function _isController(bytes32 _did, bytes32 _controller) internal view returns (bool)
```

### \_isNotController

```solidity
function _isNotController(bytes32 _did, bytes32 _controller) internal view returns (bool)
```

### \_isKnownDid

```solidity
function _isKnownDid(address _address) internal view returns (bool)
```

Checks if an address is registered in the DID registry with active capability invocation

_Performs O(1) lookup and validates: - Address is mapped to a DID - Verification method exists and is not revoked - Capability invocation relationship exists and is temporally valid_

#### Parameters

| Name      | Type    | Description                   |
| --------- | ------- | ----------------------------- |
| \_address | address | The Ethereum address to check |

#### Return Values

| Name | Type | Description                                                                      |
| ---- | ---- | -------------------------------------------------------------------------------- |
| [0]  | bool | bool True if address is known with active capability invocation, false otherwise |

### \_getDidFromAddress

```solidity
function _getDidFromAddress(address _address) internal view returns (bytes32)
```

Gets the DID associated with an address

#### Parameters

| Name      | Type    | Description           |
| --------- | ------- | --------------------- |
| \_address | address | The address to lookup |

#### Return Values

| Name | Type    | Description                                 |
| ---- | ------- | ------------------------------------------- |
| [0]  | bytes32 | bytes32 The DID associated with the address |

### \_getAlsoKnownAs

```solidity
function _getAlsoKnownAs(bytes32 _did) internal view returns (string)
```

Gets the alsoKnownAs field from a DID document

#### Parameters

| Name  | Type    | Description       |
| ----- | ------- | ----------------- |
| \_did | bytes32 | The DID to lookup |

#### Return Values

| Name | Type   | Description                         |
| ---- | ------ | ----------------------------------- |
| [0]  | string | string memory The alsoKnownAs value |

### \_didOf

```solidity
function _didOf(address account) internal view returns (bytes32 did_)
```

### \_localDidOf

```solidity
function _localDidOf(address _account) internal view virtual returns (bytes32)
```

Override of AccessControlInternal.\_localDidOf for local DID resolution

#### Parameters

| Name      | Type    | Description            |
| --------- | ------- | ---------------------- |
| \_account | address | The address to resolve |

#### Return Values

| Name | Type    | Description                                                    |
| ---- | ------- | -------------------------------------------------------------- |
| [0]  | bytes32 | bytes32 The DID hash if found and active, otherwise bytes32(0) |

### \_checkEmptyVerificationRelationship

```solidity
function _checkEmptyVerificationRelationship(bytes32 _did, string _name, bytes32 _vMethodId) internal view
```

### \_validateProof

```solidity
function _validateProof(bytes _proof, bytes _publicKey) internal pure
```

Validates cryptographic proof of ownership for a DID

_Validates that the signature (proof) was created by the private key corresponding
to the provided public key. Currently only supports secp256k1 (standard ECDSA).
Elliptic curve type validation is performed by modifiers before this function._

#### Parameters

| Name        | Type  | Description                                          |
| ----------- | ----- | ---------------------------------------------------- |
| \_proof     | bytes | The signature proving ownership (65 bytes for ECDSA) |
| \_publicKey | bytes | The public key to validate against                   |

---

## DidVerificationMethod

Abstract contract for managing cryptographic verification methods within DID documents

_Provides external interface implementations for adding, revoking, expiring, and rolling
verification methods with comprehensive access control and temporal validation. Integrates
with controller management to ensure authorised operations on DID documents_

### addVerificationMethod

```solidity
function addVerificationMethod(bytes32 _did, bytes32 _vMethodId, bytes _publicKey, enum IDidDocumentDetailed.EllipticType _ellipticType) external returns (bool success)
```

### revokeVerificationMethod

```solidity
function revokeVerificationMethod(bytes32 _did, bytes32 _vMethodId, uint256 _notAfter) external returns (bool success)
```

### expireVerificationMethod

```solidity
function expireVerificationMethod(bytes32 _did, bytes32 _vMethodId, uint256 _notAfter) external returns (bool success)
```

### rollVerificationMethod

```solidity
function rollVerificationMethod(struct IDidVerificationMethod.RollArgs args) external returns (bool success)
```

Rolls over a verification method to a new cryptographic key pair

_Replaces an existing verification method with a new one in a single atomic
operation, ensuring continuity of authentication capabilities during key rotation_

#### Parameters

| Name | Type                                   | Description                                                         |
| ---- | -------------------------------------- | ------------------------------------------------------------------- |
| args | struct IDidVerificationMethod.RollArgs | The RollArgs structure containing all necessary rollover parameters |

#### Return Values

| Name    | Type | Description                                                     |
| ------- | ---- | --------------------------------------------------------------- |
| success | bool | Boolean indicating whether the operation completed successfully |

---

## DidVerificationMethodFacet

Diamond facet providing external access to cryptographic verification method management
for decentralised identifier documents with introspection capabilities

_Concrete implementation of the diamond facet pattern for verification method operations.
Combines verification method functionality with EIP-2535 interface introspection to
support dynamic discovery of supported interfaces and function selectors_

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

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## DidVerificationRelationship

Abstract contract for managing verification relationships between decentralised
identifiers and their cryptographic verification methods

_Provides external interface implementations for creating and querying verification
relationships with temporal validity constraints. Integrates with controller
management to ensure authorised operations and implements W3C DID specification
relationship types for authentication and authorisation purposes_

### addVerificationRelationship

```solidity
function addVerificationRelationship(bytes32 _did, string _name, bytes32 _vMethodId, uint256 _notBefore, uint256 _notAfter) external returns (bool success)
```

### getDidsByVerificationRelationship

```solidity
function getDidsByVerificationRelationship(bytes32 _vMethodId, string _name, uint256 _page, uint256 _pageSize) external view returns (struct IDidVerificationRelationship.DidWithPeriod[] items_, uint256 total_, uint256 howMany_, uint256 prev_, uint256 next_)
```

---

## DidVerificationRelationshipFacet

Diamond facet implementation for managing verification relationships between
decentralised identifiers and cryptographic verification methods

_Extends DidVerificationRelationship functionality with EIP-2535 Diamond Standard
introspection capabilities. Provides interface discovery and selector enumeration
for verification relationship management operations within the diamond proxy_

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

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## IDidRegistry

Comprehensive interface for decentralised identifier (DID) registry operations

_Aggregates all DID management interfaces into a single, unified interface for
complete DID document lifecycle management including controllers, verification
methods, verification relationships and registry query._

---

## VRelationshipsInternal

Core internal logic for managing DID verification relationships with temporal
validity periods and cryptographic method associations

_Abstract contract providing internal verification relationship management functionality
including temporal validation, relationship type verification, and storage operations.
Supports W3C DID specification relationship types with enhanced period management_

### VRelationshipsStorage

Storage structure for verification relationships organised by relationship ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct VRelationshipsStorage {
  mapping(uint256 => struct IDidVerificationRelationship.DidWithPeriod[]) didsByVRelationship;
}
```

### \_addVerificationRelationship

```solidity
function _addVerificationRelationship(bytes32 _vMethodId, string _name, bytes32 _did, uint256 _notBefore, uint256 _notAfter) internal returns (uint256)
```

### \_updateVerificationRelationship

```solidity
function _updateVerificationRelationship(bytes32 _vMethodId, string _name, uint256 _indexDid, uint256 _notAfter) internal
```

### \_getDidsByVerificationRelationship

```solidity
function _getDidsByVerificationRelationship(bytes32 _vMethodId, string _name, uint256 _page, uint256 _pageSize) internal view returns (struct IDidVerificationRelationship.DidWithPeriod[] items_, uint256 total_, uint256 howMany_, uint256 prev_, uint256 next_)
```

### \_checkNotAfterRevocation

```solidity
function _checkNotAfterRevocation(uint256 _notAfter) internal view
```

### \_checkNotAfterExpiration

```solidity
function _checkNotAfterExpiration(uint256 _notAfter) internal view
```

### \_checkValidRelationshipName

```solidity
function _checkValidRelationshipName(string _method) internal pure
```

### \_buildVerificationRelationshipId

```solidity
function _buildVerificationRelationshipId(string _method, bytes32 _vMethodId) internal pure returns (uint256 vrId_)
```
