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
    mapping(string => string[]) didsByController;
    mapping(string => mapping(string => uint256)) didsByControllerIndex;
}
```

### \_linkDidToController

```solidity
function _linkDidToController(string did, string controller) internal returns (bool)
```

---

## DidDocumentDetailed

Provides comprehensive management of W3C-compliant DID documents with cryptographic
verification methods and temporal validity periods

_Implements the complete DID specification including document creation, verification
method management, and cryptographic controller relationships. Supports multiple
elliptic curve types for enhanced cryptographic flexibility and interoperability_

### initializeDiDRegistry

```solidity
function initializeDiDRegistry(enum IDidDocumentDetailed.EllipticType _ellipticType) external
```

Initialises the DID registry with the specified elliptic curve configuration

_Sets the cryptographic parameters for the entire registry. Must be called once
before any DID operations can be performed. Only valid elliptic curve types
are accepted, excluding NONE which represents an invalid state_

#### Parameters

| Name           | Type                                   | Description                                                 |
| -------------- | -------------------------------------- | ----------------------------------------------------------- |
| \_ellipticType | enum IDidDocumentDetailed.EllipticType | The elliptic curve algorithm to configure for this registry |

### insertDidDocument

```solidity
function insertDidDocument(string _did, string _baseDocument, string _vMethodId, bytes _publicKey, enum IDidDocumentDetailed.EllipticType _ellipticType, uint256 _notBefore, uint256 _notAfter) external returns (bool)
```

### getDidDocument

```solidity
function getDidDocument(string _did) external view returns (string baseDocument_, string[] controllers_, string[] vMethodIds_, struct IDidDocumentDetailed.VMethod[] vMethods_, struct IDidDocumentDetailed.VRelationship[] vRelationships_)
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
  string[] controllers;
  mapping(string => bool) controllerExist;
  mapping(string => struct IDidDocumentDetailed.VMethod) vMethods;
  struct IDidDocumentDetailed.VRelationship[] vRelationships;
  struct IDidDocumentDetailed.VRelationship[] capabilityInvocations;
  mapping(bytes32 => bool) vRelationshipsNameAndMethodIdTuple;
  mapping(string => uint256[]) vRelationshipsIndexes;
  mapping(string => bool) capabilityInvocationMethodIdExist;
  mapping(string => uint256) capabilityInvocationMethodIdIndex;
  mapping(address => string) vMethodIdOfAddress;
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
  mapping(string => struct DidDocumentDetailedInternal.DidDocument) didList;
  string[] dids;
  mapping(address => string) invocationAddressToDidResolver;
}
```

### onlyValidDid

```solidity
modifier onlyValidDid(string _did)
```

### onlyValidEllipticType

```solidity
modifier onlyValidEllipticType(enum IDidDocumentDetailed.EllipticType _ellipticType)
```

### validateEllipticType

```solidity
modifier validateEllipticType(enum IDidDocumentDetailed.EllipticType _ellipticType)
```

### \_setEllipticType

```solidity
function _setEllipticType(enum IDidDocumentDetailed.EllipticType _ellipticType) internal
```

### \_insertDidDocument

```solidity
function _insertDidDocument(string _did, string _baseDocument, string _vMethodId, bytes _publicKey, enum IDidDocumentDetailed.EllipticType _ellipticType, uint256 _notBefore, uint256 _notAfter) internal returns (bool)
```

### \_addVerificationRelationship

```solidity
function _addVerificationRelationship(string _method, string _vMethodId, string _did, uint256 _notBefore, uint256 _notAfter) internal returns (uint256)
```

### \_getDidDocument

```solidity
function _getDidDocument(string _did) internal view returns (string baseDocument_, string[] controllers_, string[] vMethodIds_, struct IDidDocumentDetailed.VMethod[] vMethods_, struct IDidDocumentDetailed.VRelationship[] vRelationships_)
```

### \_getDidDocumentByTimestamp

```solidity
function _getDidDocumentByTimestamp(string _did, uint256 _timestamp) internal view returns (string baseDocument_, string[] controllers_, string[] vMethodIds_, struct IDidDocumentDetailed.VMethod[] vMethods_, struct IDidDocumentDetailed.VRelationship[] vRelationships_)
```

### \_checkEllipticType

```solidity
function _checkEllipticType(enum IDidDocumentDetailed.EllipticType _ellipticType) internal view
```

### \_checkValidDid

```solidity
function _checkValidDid(string _did) internal view
```

### \_notExistDid

```solidity
function _notExistDid(string _did) internal view returns (bool)
```

---

## IDidRegistry

Comprehensive interface for decentralised identifier (DID) registry operations

_Aggregates all DID management interfaces into a single, unified interface for
complete DID document lifecycle management including controllers, verification
methods, and verification relationships_

---

## VRelationshipsInternal

Core internal logic for managing DID verification relationships with temporal
validity periods and cryptographic method associations

_Abstract contract providing internal verification relationship management functionality
including temporal validation, relationship type verification, and storage operations.
Supports W3C DID specification relationship types with enhanced period management_

### DidWithPeriod

DID identifier with temporal validity period structure

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct DidWithPeriod {
    string did;
    uint256 notBefore;
    uint256 notAfter;
}
```

### VRelationshipsStorage

Storage structure for verification relationships organised by relationship ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct VRelationshipsStorage {
  mapping(uint256 => struct VRelationshipsInternal.DidWithPeriod[]) didsByVRelationship;
}
```

### \_addVerificationRelationship

```solidity
function _addVerificationRelationship(uint256 _vrId, string _did, uint256 _notBefore, uint256 _notAfter) internal returns (uint256)
```

### \_checkValidRelationshipName

```solidity
function _checkValidRelationshipName(string _method) internal pure
```

### \_buildVerificationRelationshipId

```solidity
function _buildVerificationRelationshipId(string _method, string _vMethodId) internal pure returns (uint256 vrId_)
```
