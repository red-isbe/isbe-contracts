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

Interface for comprehensive decentralised identifier document management with
verification methods and temporal relationships

_Provides advanced functionality for DID document creation, updates, retrieval,
and historical queries with support for verification methods and relationships_

### VMethod

Structure representing a verification method for cryptographic operations

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct VMethod {
    bytes publicKey;
    bool isSecp256k1;
    bool revoked;
}
```

### VRelationship

Structure representing a verification relationship with temporal constraints

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

### DidDocumentInserted

```solidity
event DidDocumentInserted(string did, string baseDocument, string vMethodId, bytes publicKey, bool isSecp256k1, uint256 notBefore, uint256 notAfter)
```

Emitted when a new DID document is inserted into the registry

#### Parameters

| Name         | Type    | Description                                           |
| ------------ | ------- | ----------------------------------------------------- |
| did          | string  | The decentralised identifier being registered         |
| baseDocument | string  | The base DID document content in JSON format          |
| vMethodId    | string  | The initial verification method identifier            |
| publicKey    | bytes   | The initial public key for cryptographic verification |
| isSecp256k1  | bool    | Boolean indicating secp256k1 elliptic curve usage     |
| notBefore    | uint256 | Unix timestamp when the DID becomes valid             |
| notAfter     | uint256 | Unix timestamp when the DID expires                   |

### BaseDocumentUpdated

```solidity
event BaseDocumentUpdated(string did, string baseDocument)
```

Emitted when a DID's base document is updated

#### Parameters

| Name         | Type   | Description                                  |
| ------------ | ------ | -------------------------------------------- |
| did          | string | The decentralised identifier being updated   |
| baseDocument | string | The new base document content in JSON format |

### insertDidDocument

```solidity
function insertDidDocument(string did, string baseDocument, string vMethodId, bytes publicKey, bool isSecp256k1, uint256 notBefore, uint256 notAfter) external returns (bool success)
```

Inserts a new DID document with initial verification method

_Creates a complete DID document entry with cryptographic verification capability_

#### Parameters

| Name         | Type    | Description                                               |
| ------------ | ------- | --------------------------------------------------------- |
| did          | string  | The decentralised identifier to register                  |
| baseDocument | string  | The base DID document content in standardised JSON format |
| vMethodId    | string  | The unique identifier for the initial verification method |
| publicKey    | bytes   | The public key bytes for cryptographic operations         |
| isSecp256k1  | bool    | Boolean flag indicating secp256k1 elliptic curve usage    |
| notBefore    | uint256 | Unix timestamp when the DID document becomes active       |
| notAfter     | uint256 | Unix timestamp when the DID document expires              |

#### Return Values

| Name    | Type | Description                                      |
| ------- | ---- | ------------------------------------------------ |
| success | bool | Boolean indicating successful document insertion |

### updateBaseDocument

```solidity
function updateBaseDocument(string did, string baseDocument) external returns (bool success)
```

Updates the base document content for an existing DID

_Modifies the core document whilst preserving verification methods and
relationships_

#### Parameters

| Name         | Type   | Description                                  |
| ------------ | ------ | -------------------------------------------- |
| did          | string | The decentralised identifier to update       |
| baseDocument | string | The new base document content in JSON format |

#### Return Values

| Name    | Type | Description                                   |
| ------- | ---- | --------------------------------------------- |
| success | bool | Boolean indicating successful document update |

### getDids

```solidity
function getDids(uint256 page, uint256 pageSize) external view returns (string[] items, uint256 total, uint256 howMany, uint256 prev, uint256 next)
```

Retrieves paginated list of registered DIDs

_Returns paginated results for efficient handling of large DID registries_

#### Parameters

| Name     | Type    | Description                                       |
| -------- | ------- | ------------------------------------------------- |
| page     | uint256 | The page number to retrieve (zero-based indexing) |
| pageSize | uint256 | The maximum number of DIDs per page               |

#### Return Values

| Name    | Type     | Description                                            |
| ------- | -------- | ------------------------------------------------------ |
| items   | string[] | Array of DID strings for the requested page            |
| total   | uint256  | Total number of registered DIDs in the registry        |
| howMany | uint256  | Number of DID items returned in current page           |
| prev    | uint256  | Previous page number (zero if no previous page exists) |
| next    | uint256  | Next page number (zero if no next page exists)         |

### getDidDocument

```solidity
function getDidDocument(string did) external view returns (string baseDocument, string[] controllers, string[] vMethodIds, struct IDidDocumentDetailed.VMethod[] vMethods, struct IDidDocumentDetailed.VRelationship[] vRelationships)
```

Retrieves complete DID document with current verification methods

_Returns the most recent state of the DID document including all active
verification methods and relationships_

#### Parameters

| Name | Type   | Description                           |
| ---- | ------ | ------------------------------------- |
| did  | string | The decentralised identifier to query |

#### Return Values

| Name           | Type                                        | Description                                                 |
| -------------- | ------------------------------------------- | ----------------------------------------------------------- |
| baseDocument   | string                                      | The base DID document content in JSON format                |
| controllers    | string[]                                    | Array of controller identifiers with management permissions |
| vMethodIds     | string[]                                    | Array of verification method identifiers                    |
| vMethods       | struct IDidDocumentDetailed.VMethod[]       | Array of VMethod structures containing verification details |
| vRelationships | struct IDidDocumentDetailed.VRelationship[] | Array of VRelationship structures for temporal links        |

### getDidDocumentByTimestamp

```solidity
function getDidDocumentByTimestamp(string did, uint256 timestamp) external view returns (string baseDocument, string[] controllers, string[] vMethodIds, struct IDidDocumentDetailed.VMethod[] vMethods, struct IDidDocumentDetailed.VRelationship[] vRelationships)
```

Retrieves historical DID document state at specific timestamp

_Returns the DID document state as it existed at the specified point in time,
including verification methods and relationships valid at that moment_

#### Parameters

| Name      | Type    | Description                                        |
| --------- | ------- | -------------------------------------------------- |
| did       | string  | The decentralised identifier to query historically |
| timestamp | uint256 | Unix timestamp for historical state retrieval      |

#### Return Values

| Name           | Type                                        | Description                                           |
| -------------- | ------------------------------------------- | ----------------------------------------------------- |
| baseDocument   | string                                      | The base document content at the specified timestamp  |
| controllers    | string[]                                    | Array of controllers valid at the specified timestamp |
| vMethodIds     | string[]                                    | Array of verification method IDs active at timestamp  |
| vMethods       | struct IDidDocumentDetailed.VMethod[]       | Array of VMethod structures valid at the timestamp    |
| vRelationships | struct IDidDocumentDetailed.VRelationship[] | Array of VRelationship structures active at timestamp |

---

## IDidRegistry

Comprehensive interface for decentralised identifier (DID) registry operations

_Aggregates all DID management interfaces into a single, unified interface for
complete DID document lifecycle management including controllers, verification
methods, and verification relationships_
