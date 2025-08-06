## IDidController

Interface for managing decentralised identifier (DID) controllers and base documents

_Provides functionality to add, revoke, and query DID controllers with proper
authorisation mechanisms_

### ControllerAdded

```solidity
event ControllerAdded(string did, string controller)
```

Emitted when a new controller is added to a DID

#### Parameters

| Name       | Type   | Description                                               |
| ---------- | ------ | --------------------------------------------------------- |
| did        | string | The decentralised identifier receiving the new controller |
| controller | string | The controller identifier being added                     |

### ControllerRevoked

```solidity
event ControllerRevoked(string did, string controller)
```

Emitted when a controller is revoked from a DID

#### Parameters

| Name       | Type   | Description                                        |
| ---------- | ------ | -------------------------------------------------- |
| did        | string | The decentralised identifier losing the controller |
| controller | string | The controller identifier being revoked            |

### ControllerNotAuthorized

```solidity
error ControllerNotAuthorized(string did, address controller)
```

Raised when a controller is not authorized

#### Parameters

| Name       | Type    | Description                                        |
| ---------- | ------- | -------------------------------------------------- |
| did        | string  | The decentralised identifier losing the controller |
| controller | address | The controller identifier being revoked            |

### DidIsNotControlledBy

```solidity
error DidIsNotControlledBy(string did, string controller)
```

Raised when a DID is not controlled by

#### Parameters

| Name       | Type   | Description                  |
| ---------- | ------ | ---------------------------- |
| did        | string | The decentralised identifier |
| controller | string | The controller identifier    |

### DidIsControlledBy

```solidity
error DidIsControlledBy(string did, string controller)
```

Raised when a DID is controlled by

#### Parameters

| Name       | Type   | Description                  |
| ---------- | ------ | ---------------------------- |
| did        | string | The decentralised identifier |
| controller | string | The controller identifier    |

### addController

```solidity
function addController(string did, string controller) external returns (bool success)
```

Adds a new controller to the specified DID

_Requires appropriate authorisation to modify the DID_

#### Parameters

| Name       | Type   | Description                                                |
| ---------- | ------ | ---------------------------------------------------------- |
| did        | string | The decentralised identifier to receive the new controller |
| controller | string | The controller identifier to be added                      |

#### Return Values

| Name    | Type | Description                                                     |
| ------- | ---- | --------------------------------------------------------------- |
| success | bool | Boolean indicating whether the operation completed successfully |

### revokeController

```solidity
function revokeController(string did, string controller) external returns (bool success)
```

Revokes an existing controller from the specified DID

_Requires appropriate authorisation to modify the DID_

#### Parameters

| Name       | Type   | Description                                         |
| ---------- | ------ | --------------------------------------------------- |
| did        | string | The decentralised identifier to lose the controller |
| controller | string | The controller identifier to be revoked             |

#### Return Values

| Name    | Type | Description                                                     |
| ------- | ---- | --------------------------------------------------------------- |
| success | bool | Boolean indicating whether the operation completed successfully |

### getDidsByController

```solidity
function getDidsByController(string controller, uint256 page, uint256 pageSize) external view returns (string[] items, uint256 total, uint256 howMany, uint256 prev, uint256 next)
```

Retrieves paginated list of DIDs controlled by the specified controller

_Returns paginated results to handle large datasets efficiently_

#### Parameters

| Name       | Type    | Description                              |
| ---------- | ------- | ---------------------------------------- |
| controller | string  | The controller identifier to query for   |
| page       | uint256 | The page number to retrieve (zero-based) |
| pageSize   | uint256 | The maximum number of items per page     |

#### Return Values

| Name    | Type     | Description                                                 |
| ------- | -------- | ----------------------------------------------------------- |
| items   | string[] | Array of DID strings controlled by the specified controller |
| total   | uint256  | Total number of DIDs controlled by this controller          |
| howMany | uint256  | Number of items returned in current page                    |
| prev    | uint256  | Previous page number (zero if no previous page)             |
| next    | uint256  | Next page number (zero if no next page)                     |

### checkController

```solidity
function checkController(string did, address controller) external view returns (bool isController)
```

Checks if an address is authorised as a controller for the specified DID

_Validates controller permissions using string DID format_

#### Parameters

| Name       | Type    | Description                                   |
| ---------- | ------- | --------------------------------------------- |
| did        | string  | The decentralised identifier to check against |
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

## IDidDocumentDetailed

Core interface for comprehensive DID document operations and lifecycle management

_Provides functionality for creating, updating, and retrieving decentralised identifier
documents with cryptographic verification methods. Supports temporal validity
constraints and multiple elliptic curve algorithms for enhanced security_

### EllipticType

Enumeration of supported elliptic curve cryptographic algorithms

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
enum EllipticType {
    NONE,
    SECP_256_K1,
    SECP_256_R1
}
```

### VMethod

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct VMethod {
  bytes publicKey;
  enum IDidDocumentDetailed.EllipticType ellipticType;
  bool revoked;
}
```

### VRelationship

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct VRelationship {
    string name;
    string vMethodId;
    uint256 notBefore;
    uint256 notAfter;
    uint256 indexDid;
}
```

### DiDRegistryInitialized

```solidity
event DiDRegistryInitialized(enum IDidDocumentDetailed.EllipticType ellipticType)
```

Emitted when the DID registry is initialised with cryptographic parameters

#### Parameters

| Name         | Type                                   | Description                                              |
| ------------ | -------------------------------------- | -------------------------------------------------------- |
| ellipticType | enum IDidDocumentDetailed.EllipticType | The elliptic curve algorithm configured for the registry |

### DidDocumentInserted

```solidity
event DidDocumentInserted(string did, string baseDocument, string vMethodId, bytes publicKey, enum IDidDocumentDetailed.EllipticType ellipticType, uint256 notBefore, uint256 notAfter)
```

Emitted when a new DID document is successfully inserted into the registry

#### Parameters

| Name         | Type                                   | Description                                                   |
| ------------ | -------------------------------------- | ------------------------------------------------------------- |
| did          | string                                 | The decentralised identifier string that was registered       |
| baseDocument | string                                 | The base JSON-LD document content for the DID                 |
| vMethodId    | string                                 | The unique identifier for the initial verification method     |
| publicKey    | bytes                                  | The public key material for the initial verification method   |
| ellipticType | enum IDidDocumentDetailed.EllipticType | The elliptic curve algorithm used for the initial key         |
| notBefore    | uint256                                | The timestamp before which the verification method is invalid |
| notAfter     | uint256                                | The timestamp after which the verification method expires     |

### BaseDocumentUpdated

```solidity
event BaseDocumentUpdated(string did, string baseDocument)
```

Emitted when the base document content of a DID is updated

#### Parameters

| Name         | Type   | Description                                                   |
| ------------ | ------ | ------------------------------------------------------------- |
| did          | string | The decentralised identifier whose base document was modified |
| baseDocument | string | The new base JSON-LD document content                         |

### InvalidEllipticCurve

```solidity
error InvalidEllipticCurve()
```

Thrown when an invalid or unsupported elliptic curve type is specified

### FirstPublicKeyMustBeTheSameThanTheNetwork

```solidity
error FirstPublicKeyMustBeTheSameThanTheNetwork(enum IDidDocumentDetailed.EllipticType ellipticType)
```

Thrown when the first public key does not match the configured network type

#### Parameters

| Name         | Type                                   | Description                                                  |
| ------------ | -------------------------------------- | ------------------------------------------------------------ |
| ellipticType | enum IDidDocumentDetailed.EllipticType | The elliptic curve type that was provided but does not match |

### DidAlreadyExists

```solidity
error DidAlreadyExists(string did)
```

Thrown when attempting to register a DID that already exists in the registry

#### Parameters

| Name | Type   | Description                                             |
| ---- | ------ | ------------------------------------------------------- |
| did  | string | The decentralised identifier string that already exists |

### DidNotExists

```solidity
error DidNotExists(string did)
```

Thrown when attempting to use a DID that not exists in the registry

#### Parameters

| Name | Type   | Description                                         |
| ---- | ------ | --------------------------------------------------- |
| did  | string | The decentralised identifier string that not exists |

### InvalidControlBytes

```solidity
error InvalidControlBytes()
```

Thrown when provided control bytes are malformed or invalid

### InvalidPubKeyLength

```solidity
error InvalidPubKeyLength()
```

Thrown when public key length does not match expected format requirements

### InvalidVerificationMethod

```solidity
error InvalidVerificationMethod(string method)
```

Thrown when an unsupported verification method type is specified

#### Parameters

| Name   | Type   | Description                                           |
| ------ | ------ | ----------------------------------------------------- |
| method | string | The verification method string that is not recognised |

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
function insertDidDocument(string did, string baseDocument, string vMethodId, bytes publicKey, enum IDidDocumentDetailed.EllipticType ellipticType, uint256 notBefore, uint256 notAfter) external returns (bool success)
```

Creates a new DID document with initial verification method

_Requires that the DID does not already exist in the registry. The initial
verification method must use a supported elliptic curve algorithm_

#### Parameters

| Name         | Type                                   | Description                                                       |
| ------------ | -------------------------------------- | ----------------------------------------------------------------- |
| did          | string                                 | The unique decentralised identifier string to register            |
| baseDocument | string                                 | The base JSON-LD document content conforming to DID specification |
| vMethodId    | string                                 | The unique identifier for the initial verification method         |
| publicKey    | bytes                                  | The cryptographic public key material encoded as bytes            |
| ellipticType | enum IDidDocumentDetailed.EllipticType | The elliptic curve algorithm for the verification method          |
| notBefore    | uint256                                | The timestamp before which the verification method is not valid   |
| notAfter     | uint256                                | The timestamp after which the verification method expires         |

#### Return Values

| Name    | Type | Description                                               |
| ------- | ---- | --------------------------------------------------------- |
| success | bool | Whether the DID document insertion completed successfully |

### updateBaseDocument

```solidity
function updateBaseDocument(string did, string baseDocument) external returns (bool success)
```

Updates the base document content for an existing DID

_Only authorised controllers can modify the base document. The DID must exist
and be in an active state for updates to be permitted_

#### Parameters

| Name         | Type   | Description                                                      |
| ------------ | ------ | ---------------------------------------------------------------- |
| did          | string | The decentralised identifier whose base document will be updated |
| baseDocument | string | The new base JSON-LD document content                            |

#### Return Values

| Name    | Type | Description                                             |
| ------- | ---- | ------------------------------------------------------- |
| success | bool | Whether the base document update completed successfully |

### getDids

```solidity
function getDids(uint256 page, uint256 pageSize) external view returns (string[] items, uint256 total, uint256 howMany, uint256 prev, uint256 next)
```

Retrieves a paginated list of all registered DIDs in the system

_Returns DIDs in registration order with pagination support for large datasets_

#### Parameters

| Name     | Type    | Description                                   |
| -------- | ------- | --------------------------------------------- |
| page     | uint256 | The zero-based page number for pagination     |
| pageSize | uint256 | The maximum number of DIDs to return per page |

#### Return Values

| Name    | Type     | Description                                                          |
| ------- | -------- | -------------------------------------------------------------------- |
| items   | string[] | Array of decentralised identifier strings for the requested page     |
| total   | uint256  | The total number of DIDs registered in the system                    |
| howMany | uint256  | The actual number of DIDs returned in this response                  |
| prev    | uint256  | The previous page number, or current page if no previous page exists |
| next    | uint256  | The next page number, or current page if no next page exists         |

### getDidDocument

```solidity
function getDidDocument(string did) external view returns (string baseDocument, string[] controllers, string[] vMethodIds, struct IDidDocumentDetailed.VMethod[] vMethods, struct IDidDocumentDetailed.VRelationship[] vRelationships)
```

Retrieves complete DID document details for a specified identifier

_Returns all components of the DID document including controllers, verification
methods, and verification relationships in their current state_

#### Parameters

| Name | Type   | Description                                                   |
| ---- | ------ | ------------------------------------------------------------- |
| did  | string | The decentralised identifier to retrieve document details for |

#### Return Values

| Name           | Type                                        | Description                                                        |
| -------------- | ------------------------------------------- | ------------------------------------------------------------------ |
| baseDocument   | string                                      | The base JSON-LD document content                                  |
| controllers    | string[]                                    | Array of controller identifier strings                             |
| vMethodIds     | string[]                                    | Array of verification method identifier strings                    |
| vMethods       | struct IDidDocumentDetailed.VMethod[]       | Array of verification method structures with cryptographic details |
| vRelationships | struct IDidDocumentDetailed.VRelationship[] | Array of verification relationship structures                      |

### getDidDocumentByTimestamp

```solidity
function getDidDocumentByTimestamp(string did, uint256 timestamp) external view returns (string baseDocument, string[] controllers, string[] vMethodIds, struct IDidDocumentDetailed.VMethod[] vMethods, struct IDidDocumentDetailed.VRelationship[] vRelationships)
```

Retrieves DID document state as it existed at a specific timestamp

_Provides historical view of DID document configuration, useful for audit
trails and temporal verification of identity claims_

#### Parameters

| Name      | Type    | Description                                                   |
| --------- | ------- | ------------------------------------------------------------- |
| did       | string  | The decentralised identifier to retrieve historical state for |
| timestamp | uint256 | The specific timestamp to query document state at             |

#### Return Values

| Name           | Type                                        | Description                                                      |
| -------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| baseDocument   | string                                      | The base JSON-LD document content at the specified time          |
| controllers    | string[]                                    | Array of controller identifiers active at the timestamp          |
| vMethodIds     | string[]                                    | Array of verification method identifiers active at the timestamp |
| vMethods       | struct IDidDocumentDetailed.VMethod[]       | Array of verification method structures valid at the timestamp   |
| vRelationships | struct IDidDocumentDetailed.VRelationship[] | Array of verification relationships active at the timestamp      |
