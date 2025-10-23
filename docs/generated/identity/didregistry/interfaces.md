## IDidController

Interface for managing decentralised identifier (DID) controllers and base documents

_Provides functionality to add, revoke, and query DID controllers with proper
authorisation mechanisms_

### ControllerAdded

```solidity
event ControllerAdded(bytes32 did, bytes32 controller)
```

Emitted when a new controller is added to a DID

#### Parameters

| Name       | Type    | Description                                               |
| ---------- | ------- | --------------------------------------------------------- |
| did        | bytes32 | The decentralised identifier receiving the new controller |
| controller | bytes32 | The controller identifier being added                     |

### ControllerRevoked

```solidity
event ControllerRevoked(bytes32 did, bytes32 controller)
```

Emitted when a controller is revoked from a DID

#### Parameters

| Name       | Type    | Description                                        |
| ---------- | ------- | -------------------------------------------------- |
| did        | bytes32 | The decentralised identifier losing the controller |
| controller | bytes32 | The controller identifier being revoked            |

### ControllerNotAuthorized

```solidity
error ControllerNotAuthorized(bytes32 did, address controller)
```

Raised when a controller is not authorized

#### Parameters

| Name       | Type    | Description                                        |
| ---------- | ------- | -------------------------------------------------- |
| did        | bytes32 | The decentralised identifier losing the controller |
| controller | address | The controller identifier being revoked            |

### DidIsNotControlledBy

```solidity
error DidIsNotControlledBy(bytes32 did, bytes32 controller)
```

Raised when a DID is not controlled by

#### Parameters

| Name       | Type    | Description                  |
| ---------- | ------- | ---------------------------- |
| did        | bytes32 | The decentralised identifier |
| controller | bytes32 | The controller identifier    |

### DidIsControlledBy

```solidity
error DidIsControlledBy(bytes32 did, bytes32 controller)
```

Raised when a DID is controlled by

#### Parameters

| Name       | Type    | Description                  |
| ---------- | ------- | ---------------------------- |
| did        | bytes32 | The decentralised identifier |
| controller | bytes32 | The controller identifier    |

### CannotLeaveDidWithoutControllers

```solidity
error CannotLeaveDidWithoutControllers(bytes32 did, bytes32 controller)
```

Raised when attempting to revoke the last controller from a DID

_Prevents DIDs from becoming unmanageable by ensuring at least one controller remains_

#### Parameters

| Name       | Type    | Description                                                         |
| ---------- | ------- | ------------------------------------------------------------------- |
| did        | bytes32 | The decentralised identifier that would be left without controllers |
| controller | bytes32 | The controller identifier being revoked                             |

### addController

```solidity
function addController(bytes32 did, bytes32 controller) external returns (bool success)
```

Adds a new controller to the specified DID

_Requires appropriate authorisation to modify the DID_

#### Parameters

| Name       | Type    | Description                                                |
| ---------- | ------- | ---------------------------------------------------------- |
| did        | bytes32 | The decentralised identifier to receive the new controller |
| controller | bytes32 | The controller identifier to be added                      |

#### Return Values

| Name    | Type | Description                                                     |
| ------- | ---- | --------------------------------------------------------------- |
| success | bool | Boolean indicating whether the operation completed successfully |

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

Structure representing a cryptographic verification method

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

Structure representing a verification relationship with temporal validity

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct VRelationship {
    string name;
    bytes32 vMethodId;
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
event DidDocumentInserted(bytes32 did, string baseDocument, bytes32 vMethodId, bytes publicKey, enum IDidDocumentDetailed.EllipticType ellipticType, uint256 notBefore, uint256 notAfter)
```

Emitted when a new DID document is successfully inserted into the registry

#### Parameters

| Name         | Type                                   | Description                                                   |
| ------------ | -------------------------------------- | ------------------------------------------------------------- |
| did          | bytes32                                | The decentralised identifier string that was registered       |
| baseDocument | string                                 | The base JSON-LD document content for the DID                 |
| vMethodId    | bytes32                                | The unique identifier for the initial verification method     |
| publicKey    | bytes                                  | The public key material for the initial verification method   |
| ellipticType | enum IDidDocumentDetailed.EllipticType | The elliptic curve algorithm used for the initial key         |
| notBefore    | uint256                                | The timestamp before which the verification method is invalid |
| notAfter     | uint256                                | The timestamp after which the verification method expires     |

### BaseDocumentUpdated

```solidity
event BaseDocumentUpdated(bytes32 did, string baseDocument)
```

Emitted when the base document content of a DID is updated

#### Parameters

| Name         | Type    | Description                                                   |
| ------------ | ------- | ------------------------------------------------------------- |
| did          | bytes32 | The decentralised identifier whose base document was modified |
| baseDocument | string  | The new base JSON-LD document content                         |

### InvalidEllipticCurve

```solidity
error InvalidEllipticCurve()
```

Raised when an invalid or unsupported elliptic curve type is specified

_This error ensures only supported cryptographic algorithms are used within
the DID registry to maintain security and compatibility standards_

### FirstPublicKeyMustBeTheSameThanTheNetwork

```solidity
error FirstPublicKeyMustBeTheSameThanTheNetwork(enum IDidDocumentDetailed.EllipticType ellipticType)
```

Raised when the first public key does not match the configured network type

_This error ensures cryptographic consistency across the network by requiring
the initial verification method to use the network's configured algorithm_

#### Parameters

| Name         | Type                                   | Description                                                  |
| ------------ | -------------------------------------- | ------------------------------------------------------------ |
| ellipticType | enum IDidDocumentDetailed.EllipticType | The elliptic curve type that was provided but does not match |

### DidAlreadyExists

```solidity
error DidAlreadyExists(bytes32 did)
```

Raised when attempting to register a DID that already exists in the registry

_This error prevents duplicate DID registration and maintains registry integrity_

#### Parameters

| Name | Type    | Description                                             |
| ---- | ------- | ------------------------------------------------------- |
| did  | bytes32 | The decentralised identifier string that already exists |

### DidNotExists

```solidity
error DidNotExists(bytes32 did)
```

Raised when attempting to use a DID that does not exist in the registry

_This error ensures operations target valid DIDs and prevents unauthorised access_

#### Parameters

| Name | Type    | Description                                             |
| ---- | ------- | ------------------------------------------------------- |
| did  | bytes32 | The decentralised identifier string that does not exist |

### InvalidControlBytes

```solidity
error InvalidControlBytes()
```

Raised when provided control bytes are malformed or invalid

_This error ensures proper formatting of cryptographic control parameters
used in verification and authentication operations_

### InvalidPubKeyLength

```solidity
error InvalidPubKeyLength()
```

Raised when public key length does not match expected format requirements

_This error ensures cryptographic keys conform to expected byte lengths for
the specified elliptic curve algorithm to prevent malformed key usage_

### InvalidVerificationMethodName

```solidity
error InvalidVerificationMethodName(string methodName)
```

Raised when attempting to operate with an invalid verification method

_This error prevents operations on malformed or non-existent verification
methods to maintain document integrity and security_

#### Parameters

| Name       | Type   | Description                                        |
| ---------- | ------ | -------------------------------------------------- |
| methodName | string | The verification method identifier that is invalid |

### VerificationRelationshipExists

```solidity
error VerificationRelationshipExists(bytes32 did, string name, bytes32 vMethodId)
```

Raised when attempting to create a verification relationship that already exists

_This error prevents duplicate relationships between DIDs and verification methods
to maintain data consistency and prevent conflicting permissions_

#### Parameters

| Name      | Type    | Description                                                           |
| --------- | ------- | --------------------------------------------------------------------- |
| did       | bytes32 | The decentralised identifier containing the existing relationship     |
| name      | string  | The verification relationship name that already exists                |
| vMethodId | bytes32 | The verification method identifier that already has this relationship |

### initializeDiDRegistry

```solidity
function initializeDiDRegistry(enum IDidDocumentDetailed.EllipticType ellipticType) external
```

Initialises the DID registry with the specified elliptic curve algorithm

_Sets the network-wide cryptographic standard and prepares the registry for
DID document operations. This function can only be called once per deployment_

#### Parameters

| Name         | Type                                   | Description                                                |
| ------------ | -------------------------------------- | ---------------------------------------------------------- |
| ellipticType | enum IDidDocumentDetailed.EllipticType | The elliptic curve algorithm to use for the entire network |

### insertDidDocument

```solidity
function insertDidDocument(bytes32 did, string baseDocument, bytes32 vMethodId, bytes publicKey, enum IDidDocumentDetailed.EllipticType ellipticType, uint256 notBefore, uint256 notAfter) external returns (bool success)
```

Inserts a new DID document with initial verification method into the registry

_Creates a complete DID document with cryptographic verification capabilities
and temporal validity constraints for secure identity management_

#### Parameters

| Name         | Type                                   | Description                                               |
| ------------ | -------------------------------------- | --------------------------------------------------------- |
| did          | bytes32                                | The decentralised identifier string to register           |
| baseDocument | string                                 | The base JSON-LD document content containing DID metadata |
| vMethodId    | bytes32                                | The unique identifier for the initial verification method |
| publicKey    | bytes                                  | The public key bytes for cryptographic verification       |
| ellipticType | enum IDidDocumentDetailed.EllipticType | The elliptic curve algorithm for the verification method  |
| notBefore    | uint256                                | Unix timestamp when the verification method becomes valid |
| notAfter     | uint256                                | Unix timestamp when the verification method expires       |

#### Return Values

| Name    | Type | Description                                                     |
| ------- | ---- | --------------------------------------------------------------- |
| success | bool | Boolean indicating whether the insertion completed successfully |

### updateBaseDocument

```solidity
function updateBaseDocument(bytes32 did, string baseDocument) external returns (bool success)
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

| Name    | Type | Description                                                  |
| ------- | ---- | ------------------------------------------------------------ |
| success | bool | Boolean indicating whether the update completed successfully |

### getDids

```solidity
function getDids(uint256 page, uint256 pageSize) external view returns (bytes32[] items, uint256 total, uint256 howMany, uint256 prev, uint256 next)
```

Retrieves a paginated list of registered decentralised identifiers

_Provides efficient enumeration of all DIDs in the registry with pagination
support for large datasets and optimised gas usage_

#### Parameters

| Name     | Type    | Description                                    |
| -------- | ------- | ---------------------------------------------- |
| page     | uint256 | The page number to retrieve (starting from 0)  |
| pageSize | uint256 | The maximum number of items to return per page |

#### Return Values

| Name    | Type      | Description                                            |
| ------- | --------- | ------------------------------------------------------ |
| items   | bytes32[] | Array of DID strings for the requested page            |
| total   | uint256   | Total number of DIDs registered in the entire registry |
| howMany | uint256   | Actual number of DIDs returned in this response        |
| prev    | uint256   | Previous page number (0 if on first page)              |
| next    | uint256   | Next page number (0 if on last page)                   |

### getDidDocument

```solidity
function getDidDocument(bytes32 did) external view returns (string baseDocument, bytes32[] controllers, bytes32[] vMethodIds, struct IDidDocumentDetailed.VMethod[] vMethods, struct IDidDocumentDetailed.VRelationship[] vRelationships)
```

Retrieves the complete current DID document with all verification methods

_Returns the full document structure including base content, controllers,
verification methods, and relationships as they exist at the current timestamp_

#### Parameters

| Name | Type    | Description                              |
| ---- | ------- | ---------------------------------------- |
| did  | bytes32 | The decentralised identifier to retrieve |

#### Return Values

| Name           | Type                                        | Description                                                      |
| -------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| baseDocument   | string                                      | The base JSON-LD document content                                |
| controllers    | bytes32[]                                   | Array of DID strings authorised to control this document         |
| vMethodIds     | bytes32[]                                   | Array of verification method identifiers                         |
| vMethods       | struct IDidDocumentDetailed.VMethod[]       | Array of verification method structures with keys and algorithms |
| vRelationships | struct IDidDocumentDetailed.VRelationship[] | Array of verification relationships with temporal validity       |

### getDidDocumentByTimestamp

```solidity
function getDidDocumentByTimestamp(bytes32 did, uint256 timestamp) external view returns (string baseDocument, bytes32[] controllers, bytes32[] vMethodIds, struct IDidDocumentDetailed.VMethod[] vMethods, struct IDidDocumentDetailed.VRelationship[] vRelationships)
```

Retrieves the DID document as it existed at a specific historical timestamp

_Returns the document structure with temporal filtering applied to show only
verification methods and relationships that were valid at the specified time_

#### Parameters

| Name      | Type    | Description                                            |
| --------- | ------- | ------------------------------------------------------ |
| did       | bytes32 | The decentralised identifier to retrieve               |
| timestamp | uint256 | Unix timestamp for historical document state retrieval |

#### Return Values

| Name           | Type                                        | Description                                                 |
| -------------- | ------------------------------------------- | ----------------------------------------------------------- |
| baseDocument   | string                                      | The base JSON-LD document content at the specified time     |
| controllers    | bytes32[]                                   | Array of DID strings authorised to control this document    |
| vMethodIds     | bytes32[]                                   | Array of verification method identifiers valid at timestamp |
| vMethods       | struct IDidDocumentDetailed.VMethod[]       | Array of verification methods that were active at timestamp |
| vRelationships | struct IDidDocumentDetailed.VRelationship[] | Array of relationships that were valid at timestamp         |

---

## IDidVerificationMethod

Interface for managing cryptographic verification methods within decentralised
identity documents

_Provides functionality to add, revoke, expire, and roll verification methods with
support for different cryptographic key types and temporal validity periods.
Implements W3C DID specification verification method management with enhanced
security controls and lifecycle operations_

### RollArgs

Arguments structure for rolling verification methods from old to new keys

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct RollArgs {
  bytes32 did;
  bytes32 vMethodId;
  bytes publicKey;
  enum IDidDocumentDetailed.EllipticType ellipticType;
  uint256 notBefore;
  uint256 notAfter;
  bytes32 oldVMethodId;
  uint256 duration;
}
```

### VerificationMethodAdded

```solidity
event VerificationMethodAdded(bytes32 did, bytes32 vMethodId, bytes publicKey, enum IDidDocumentDetailed.EllipticType ellipticType)
```

Emitted when a new verification method is successfully added to a DID document

#### Parameters

| Name         | Type                                   | Description                                                        |
| ------------ | -------------------------------------- | ------------------------------------------------------------------ |
| did          | bytes32                                | The decentralised identifier receiving the new verification method |
| vMethodId    | bytes32                                | The unique identifier assigned to the verification method          |
| publicKey    | bytes                                  | The public key bytes associated with the verification method       |
| ellipticType | enum IDidDocumentDetailed.EllipticType | Cryptographic algorithm specification for signature verification   |

### VerificationMethodRevoked

```solidity
event VerificationMethodRevoked(bytes32 did, bytes32 vMethodId, uint256 notAfter)
```

Emitted when a verification method is revoked and permanently disabled

#### Parameters

| Name      | Type    | Description                                                 |
| --------- | ------- | ----------------------------------------------------------- |
| did       | bytes32 | The decentralised identifier losing the verification method |
| vMethodId | bytes32 | The identifier of the verification method being revoked     |
| notAfter  | uint256 | Unix timestamp when the revocation becomes effective        |

### VerificationMethodExpired

```solidity
event VerificationMethodExpired(bytes32 did, bytes32 vMethodId, uint256 notAfter)
```

Emitted when a verification method reaches its expiration timestamp

#### Parameters

| Name      | Type    | Description                                                        |
| --------- | ------- | ------------------------------------------------------------------ |
| did       | bytes32 | The decentralised identifier with the expiring verification method |
| vMethodId | bytes32 | The identifier of the verification method expiring                 |
| notAfter  | uint256 | Unix timestamp when the method expires and becomes invalid         |

### VerificationMethodRolled

```solidity
event VerificationMethodRolled(bytes32 did, bytes32 vMethodId, bytes publicKey, enum IDidDocumentDetailed.EllipticType ellipticType, uint256 notBefore, uint256 notAfter, bytes32 oldVMethodId, uint256 duration)
```

Emitted when a verification method is rolled over to a new cryptographic key

#### Parameters

| Name         | Type                                   | Description                                                          |
| ------------ | -------------------------------------- | -------------------------------------------------------------------- |
| did          | bytes32                                | The decentralised identifier undergoing verification method rollover |
| vMethodId    | bytes32                                | The new verification method identifier being created                 |
| publicKey    | bytes                                  | The new public key bytes for cryptographic verification              |
| ellipticType | enum IDidDocumentDetailed.EllipticType | Cryptographic algorithm specification for signature verification     |
| notBefore    | uint256                                | Unix timestamp when the new verification method becomes valid        |
| notAfter     | uint256                                | Unix timestamp when the new verification method expires              |
| oldVMethodId | bytes32                                | The identifier of the verification method being replaced             |
| duration     | uint256                                | The validity period in seconds for the new verification method       |

### VerificationMethodExists

```solidity
error VerificationMethodExists(bytes32 did, bytes32 vMethodId)
```

Raised when attempting to add a verification method that already exists

_This error prevents duplicate verification methods within the same DID document
to maintain document integrity and prevent conflicting method identifiers_

#### Parameters

| Name      | Type    | Description                                                              |
| --------- | ------- | ------------------------------------------------------------------------ |
| did       | bytes32 | The decentralised identifier containing the existing verification method |
| vMethodId | bytes32 | The verification method identifier that already exists                   |

### VerificationMethodNotExists

```solidity
error VerificationMethodNotExists(bytes32 did, bytes32 vMethodId)
```

Raised when attempting to operate on a non-existent verification method

_This error ensures operations target valid verification methods within DID
documents and prevents unauthorised access attempts_

#### Parameters

| Name      | Type    | Description                                                              |
| --------- | ------- | ------------------------------------------------------------------------ |
| did       | bytes32 | The decentralised identifier that should contain the verification method |
| vMethodId | bytes32 | The verification method identifier that does not exist                   |

### PublicKeyAlreadyInUse

```solidity
error PublicKeyAlreadyInUse(bytes publicKey)
```

Raised when attempting to register a public key that is already in use

_This error prevents cryptographic key reuse across verification methods to
maintain security and prevent key compromise scenarios across the network_

#### Parameters

| Name      | Type  | Description                                                      |
| --------- | ----- | ---------------------------------------------------------------- |
| publicKey | bytes | The public key bytes that are already assigned to another method |

### InvalidNotAfter

```solidity
error InvalidNotAfter()
```

Raised when the notAfter timestamp is invalid for the requested operation

_This error ensures temporal validity constraints are met for verification
method lifecycle operations such as expiration, revocation, or rollover_

### addVerificationMethod

```solidity
function addVerificationMethod(bytes32 did, bytes32 vMethodId, bytes publicKey, enum IDidDocumentDetailed.EllipticType ellipticType) external returns (bool success)
```

Adds a new verification method to the specified decentralised identifier

_Creates a new cryptographic verification method with the provided key material
and associates it with the DID document for authentication purposes_

#### Parameters

| Name         | Type                                   | Description                                                      |
| ------------ | -------------------------------------- | ---------------------------------------------------------------- |
| did          | bytes32                                | The decentralised identifier to receive the verification method  |
| vMethodId    | bytes32                                | The unique identifier for the new verification method            |
| publicKey    | bytes                                  | The public key bytes for cryptographic verification operations   |
| ellipticType | enum IDidDocumentDetailed.EllipticType | Cryptographic algorithm specification for signature verification |

#### Return Values

| Name    | Type | Description                                                     |
| ------- | ---- | --------------------------------------------------------------- |
| success | bool | Boolean indicating whether the operation completed successfully |

### revokeVerificationMethod

```solidity
function revokeVerificationMethod(bytes32 did, bytes32 vMethodId, uint256 notAfter) external returns (bool success)
```

Revokes an existing verification method from the specified DID document

_Permanently disables the verification method from the specified timestamp,
preventing any future use for authentication or authorisation purposes_

#### Parameters

| Name      | Type    | Description                                                 |
| --------- | ------- | ----------------------------------------------------------- |
| did       | bytes32 | The decentralised identifier losing the verification method |
| vMethodId | bytes32 | The identifier of the verification method to revoke         |
| notAfter  | uint256 | Unix timestamp when the revocation becomes effective        |

#### Return Values

| Name    | Type | Description                                                     |
| ------- | ---- | --------------------------------------------------------------- |
| success | bool | Boolean indicating whether the operation completed successfully |

### expireVerificationMethod

```solidity
function expireVerificationMethod(bytes32 did, bytes32 vMethodId, uint256 notAfter) external returns (bool success)
```

Sets an expiration timestamp for a verification method

_Configures the verification method to become invalid at the specified
timestamp, allowing for planned key rotation and temporal access control_

#### Parameters

| Name      | Type    | Description                                                        |
| --------- | ------- | ------------------------------------------------------------------ |
| did       | bytes32 | The decentralised identifier with the expiring verification method |
| vMethodId | bytes32 | The identifier of the verification method to expire                |
| notAfter  | uint256 | Unix timestamp when the method should expire and become invalid    |

#### Return Values

| Name    | Type | Description                                                     |
| ------- | ---- | --------------------------------------------------------------- |
| success | bool | Boolean indicating whether the operation completed successfully |

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

## IDidVerificationRelationship

Interface for managing verification relationships between DIDs and verification methods

_Provides functionality to establish temporal relationships between DIDs and their
verification methods with validity periods_

### DidWithPeriod

Structure representing a DID with its validity period

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct DidWithPeriod {
    bytes32 did;
    uint256 notBefore;
    uint256 notAfter;
}
```

### VerificationRelationshipAdded

```solidity
event VerificationRelationshipAdded(bytes32 did, string name, bytes32 vMethodId, uint256 notBefore, uint256 notAfter)
```

Emitted when a new verification relationship is established

#### Parameters

| Name      | Type    | Description                                               |
| --------- | ------- | --------------------------------------------------------- |
| did       | bytes32 | The decentralised identifier involved in the relationship |
| name      | string  | The name of the verification relationship type            |
| vMethodId | bytes32 | The verification method identifier being linked           |
| notBefore | uint256 | Unix timestamp when the relationship becomes valid        |
| notAfter  | uint256 | Unix timestamp when the relationship expires              |

### VerificationMethodIsRevoked

```solidity
error VerificationMethodIsRevoked(bytes32 did, bytes32 vMethodId)
```

Raised when attempting to create a verification relationship with a revoked method

_This error prevents operations on revoked verification methods to maintain
security and prevent use of compromised or invalidated cryptographic keys_

#### Parameters

| Name      | Type    | Description                                                             |
| --------- | ------- | ----------------------------------------------------------------------- |
| did       | bytes32 | The decentralised identifier containing the revoked verification method |
| vMethodId | bytes32 | The verification method identifier that has been revoked                |

### addVerificationRelationship

```solidity
function addVerificationRelationship(bytes32 did, string name, bytes32 vMethodId, uint256 notBefore, uint256 notAfter) external returns (bool success)
```

Establishes a new verification relationship between a DID and verification method

_Creates a temporal link with specified validity period_

#### Parameters

| Name      | Type    | Description                                                    |
| --------- | ------- | -------------------------------------------------------------- |
| did       | bytes32 | The decentralised identifier to establish the relationship for |
| name      | string  | The type of verification relationship (e.g., "authentication") |
| vMethodId | bytes32 | The verification method identifier to link with                |
| notBefore | uint256 | Unix timestamp when the relationship becomes active            |
| notAfter  | uint256 | Unix timestamp when the relationship expires                   |

#### Return Values

| Name    | Type | Description                                                     |
| ------- | ---- | --------------------------------------------------------------- |
| success | bool | Boolean indicating whether the operation completed successfully |

### getDidsByVerificationRelationship

```solidity
function getDidsByVerificationRelationship(bytes32 vMethodId, string name, uint256 page, uint256 pageSize) external view returns (struct IDidVerificationRelationship.DidWithPeriod[] items, uint256 total, uint256 howMany, uint256 prev, uint256 next)
```

Retrieves paginated list of DIDs associated with a verification relationship

_Returns DIDs that have the specified verification method and relationship type_

#### Parameters

| Name      | Type    | Description                                     |
| --------- | ------- | ----------------------------------------------- |
| vMethodId | bytes32 | The verification method identifier to query for |
| name      | string  | The verification relationship name to filter by |
| page      | uint256 | The page number to retrieve (zero-based)        |
| pageSize  | uint256 | The maximum number of items per page            |

#### Return Values

| Name    | Type                                                | Description                                              |
| ------- | --------------------------------------------------- | -------------------------------------------------------- |
| items   | struct IDidVerificationRelationship.DidWithPeriod[] | Array of DidWithPeriod structures matching the criteria  |
| total   | uint256                                             | Total number of DIDs with this verification relationship |
| howMany | uint256                                             | Number of items returned in current page                 |
| prev    | uint256                                             | Previous page number (zero if no previous page)          |
| next    | uint256                                             | Next page number (zero if no next page)                  |
