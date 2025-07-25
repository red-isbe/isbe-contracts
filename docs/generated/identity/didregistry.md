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

### VMethod

```solidity
struct VMethod {
    bytes publicKey;
    bool isSecp256k1;
    bool revoked;
}
```

### VRelationship

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

### BaseDocumentUpdated

```solidity
event BaseDocumentUpdated(string did, string baseDocument)
```

### insertDidDocument

```solidity
function insertDidDocument(string did, string baseDocument, string vMethodId, bytes publicKey, bool isSecp256k1, uint256 notBefore, uint256 notAfter) external returns (bool success)
```

### updateBaseDocument

```solidity
function updateBaseDocument(string did, string baseDocument) external returns (bool success)
```

### getDids

```solidity
function getDids(uint256 page, uint256 pageSize) external view returns (string[] items, uint256 total, uint256 howMany, uint256 prev, uint256 next)
```

### getDidDocument

```solidity
function getDidDocument(string did) external view returns (string baseDocument, string[] controllers, string[] vMethodIds, struct IDidDocumentDetailed.VMethod[] vMethods, struct IDidDocumentDetailed.VRelationship[] vRelationships)
```

### getDidDocumentByTimestamp

```solidity
function getDidDocumentByTimestamp(string did, uint256 timestamp) external view returns (string baseDocument, string[] controllers, string[] vMethodIds, struct IDidDocumentDetailed.VMethod[] vMethods, struct IDidDocumentDetailed.VRelationship[] vRelationships)
```

---

## IDidRegistry

Comprehensive interface for decentralised identifier (DID) registry operations

_Aggregates all DID management interfaces into a single, unified interface for
complete DID document lifecycle management including controllers, verification
methods, and verification relationships_
