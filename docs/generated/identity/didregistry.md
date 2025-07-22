## IDidDocumentDetailed

Comprehensive DID document management with verification methods

_Handles complete lifecycle of decentralised identity documents_

### RollArgs

Parameters for rolling verification methods

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct RollArgs {
    string did;
    string vMethodId;
    bytes publicKey;
    bool isSecp256k1;
    uint256 notBefore;
    uint256 notAfter;
    string oldVMethodId;
    uint256 duration;
}
```

### VMethod

Verification method structure

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

Verification relationship structure

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

### DidWithPeriod

DID with temporal validity period

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

### DidDocumentInserted

```solidity
event DidDocumentInserted(string did, string baseDocument, string vMethodId, bytes publicKey, bool isSecp256k1, uint256 notBefore, uint256 notAfter)
```

Emitted when new DID document is inserted

#### Parameters

| Name         | Type    | Description             |
| ------------ | ------- | ----------------------- |
| did          | string  | DID identifier          |
| baseDocument | string  | Base document content   |
| vMethodId    | string  | Verification method ID  |
| publicKey    | bytes   | Public key bytes        |
| isSecp256k1  | bool    | Whether using secp256k1 |
| notBefore    | uint256 | Validity start          |
| notAfter     | uint256 | Validity end            |

### BaseDocumentUpdated

```solidity
event BaseDocumentUpdated(string did, string baseDocument)
```

Emitted when base document is updated

#### Parameters

| Name         | Type   | Description           |
| ------------ | ------ | --------------------- |
| did          | string | Target DID identifier |
| baseDocument | string | New document content  |

### ControllerAdded

```solidity
event ControllerAdded(string did, string controller)
```

Emitted when controller is added to DID

#### Parameters

| Name       | Type   | Description           |
| ---------- | ------ | --------------------- |
| did        | string | Target DID identifier |
| controller | string | Added controller DID  |

### ControllerRevoked

```solidity
event ControllerRevoked(string did, string controller)
```

Emitted when controller is revoked from DID

#### Parameters

| Name       | Type   | Description            |
| ---------- | ------ | ---------------------- |
| did        | string | Target DID identifier  |
| controller | string | Revoked controller DID |

### VerificationMethodAdded

```solidity
event VerificationMethodAdded(string did, string vMethodId, bytes publicKey, bool isSecp256k1)
```

Emitted when verification method is added

#### Parameters

| Name        | Type   | Description             |
| ----------- | ------ | ----------------------- |
| did         | string | Target DID identifier   |
| vMethodId   | string | Method identifier       |
| publicKey   | bytes  | Public key bytes        |
| isSecp256k1 | bool   | Whether using secp256k1 |

### VerificationRelationshipAdded

```solidity
event VerificationRelationshipAdded(string did, string name, string vMethodId, uint256 notBefore, uint256 notAfter)
```

Emitted when verification relationship is added

#### Parameters

| Name      | Type    | Description           |
| --------- | ------- | --------------------- |
| did       | string  | Target DID identifier |
| name      | string  | Relationship name     |
| vMethodId | string  | Associated method ID  |
| notBefore | uint256 | Validity start        |
| notAfter  | uint256 | Validity end          |

### VerificationMethodRevoked

```solidity
event VerificationMethodRevoked(string did, string vMethodId, uint256 notAfter)
```

Emitted when verification method is revoked

#### Parameters

| Name      | Type    | Description           |
| --------- | ------- | --------------------- |
| did       | string  | Target DID identifier |
| vMethodId | string  | Revoked method ID     |
| notAfter  | uint256 | Revocation timestamp  |

### VerificationMethodExpired

```solidity
event VerificationMethodExpired(string did, string vMethodId, uint256 notAfter)
```

Emitted when verification method expires

#### Parameters

| Name      | Type    | Description           |
| --------- | ------- | --------------------- |
| did       | string  | Target DID identifier |
| vMethodId | string  | Expired method ID     |
| notAfter  | uint256 | Expiration timestamp  |

### VerificationMethodRolled

```solidity
event VerificationMethodRolled(string did, string vMethodId, bytes publicKey, bool isSecp256k1, uint256 notBefore, uint256 notAfter, string oldVMethodId, uint256 duration)
```

Emitted when verification method is rolled

#### Parameters

| Name         | Type    | Description             |
| ------------ | ------- | ----------------------- |
| did          | string  | Target DID identifier   |
| vMethodId    | string  | New method ID           |
| publicKey    | bytes   | New public key          |
| isSecp256k1  | bool    | Whether using secp256k1 |
| notBefore    | uint256 | New validity start      |
| notAfter     | uint256 | New validity end        |
| oldVMethodId | string  | Replaced method ID      |
| duration     | uint256 | Roll operation duration |

### insertDidDocument

```solidity
function insertDidDocument(string did, string baseDocument, string vMethodId, bytes publicKey, bool isSecp256k1, uint256 notBefore, uint256 notAfter) external returns (bool success)
```

Inserts new DID document with verification method

#### Parameters

| Name         | Type    | Description                    |
| ------------ | ------- | ------------------------------ |
| did          | string  | DID identifier to create       |
| baseDocument | string  | Base document content          |
| vMethodId    | string  | Initial verification method ID |
| publicKey    | bytes   | Public key for verification    |
| isSecp256k1  | bool    | Whether key uses secp256k1     |
| notBefore    | uint256 | Validity start timestamp       |
| notAfter     | uint256 | Validity end timestamp         |

#### Return Values

| Name    | Type | Description                 |
| ------- | ---- | --------------------------- |
| success | bool | Whether operation succeeded |

### updateBaseDocument

```solidity
function updateBaseDocument(string did, string baseDocument) external returns (bool success)
```

Updates base document for existing DID

#### Parameters

| Name         | Type   | Description           |
| ------------ | ------ | --------------------- |
| did          | string | Target DID identifier |
| baseDocument | string | New document content  |

#### Return Values

| Name    | Type | Description              |
| ------- | ---- | ------------------------ |
| success | bool | Whether update succeeded |

### addController

```solidity
function addController(string did, string controller) external returns (bool success)
```

Adds controller to existing DID

#### Parameters

| Name       | Type   | Description           |
| ---------- | ------ | --------------------- |
| did        | string | Target DID identifier |
| controller | string | Controller DID to add |

#### Return Values

| Name    | Type | Description                |
| ------- | ---- | -------------------------- |
| success | bool | Whether addition succeeded |

### revokeController

```solidity
function revokeController(string did, string controller) external returns (bool success)
```

Revokes controller from DID

#### Parameters

| Name       | Type   | Description              |
| ---------- | ------ | ------------------------ |
| did        | string | Target DID identifier    |
| controller | string | Controller DID to revoke |

#### Return Values

| Name    | Type | Description                  |
| ------- | ---- | ---------------------------- |
| success | bool | Whether revocation succeeded |

### addVerificationMethod

```solidity
function addVerificationMethod(string did, string vMethodId, bytes publicKey, bool isSecp256k1) external returns (bool success)
```

Adds verification method to DID

#### Parameters

| Name        | Type   | Description             |
| ----------- | ------ | ----------------------- |
| did         | string | Target DID identifier   |
| vMethodId   | string | Method identifier       |
| publicKey   | bytes  | Public key bytes        |
| isSecp256k1 | bool   | Whether using secp256k1 |

#### Return Values

| Name    | Type | Description                |
| ------- | ---- | -------------------------- |
| success | bool | Whether addition succeeded |

### addVerificationRelationship

```solidity
function addVerificationRelationship(string did, string name, string vMethodId, uint256 notBefore, uint256 notAfter) external returns (bool success)
```

Adds verification relationship to DID

#### Parameters

| Name      | Type    | Description              |
| --------- | ------- | ------------------------ |
| did       | string  | Target DID identifier    |
| name      | string  | Relationship name        |
| vMethodId | string  | Associated method ID     |
| notBefore | uint256 | Validity start timestamp |
| notAfter  | uint256 | Validity end timestamp   |

#### Return Values

| Name    | Type | Description                |
| ------- | ---- | -------------------------- |
| success | bool | Whether addition succeeded |

### revokeVerificationMethod

```solidity
function revokeVerificationMethod(string did, string vMethodId, uint256 notAfter) external returns (bool success)
```

Revokes verification method from DID

#### Parameters

| Name      | Type    | Description           |
| --------- | ------- | --------------------- |
| did       | string  | Target DID identifier |
| vMethodId | string  | Method ID to revoke   |
| notAfter  | uint256 | Revocation timestamp  |

#### Return Values

| Name    | Type | Description                  |
| ------- | ---- | ---------------------------- |
| success | bool | Whether revocation succeeded |

### expireVerificationMethod

```solidity
function expireVerificationMethod(string did, string vMethodId, uint256 notAfter) external returns (bool success)
```

Expires verification method

#### Parameters

| Name      | Type    | Description           |
| --------- | ------- | --------------------- |
| did       | string  | Target DID identifier |
| vMethodId | string  | Method ID to expire   |
| notAfter  | uint256 | Expiration timestamp  |

#### Return Values

| Name    | Type | Description                  |
| ------- | ---- | ---------------------------- |
| success | bool | Whether expiration succeeded |

### rollVerificationMethod

```solidity
function rollVerificationMethod(struct IDidDocumentDetailed.RollArgs args) external returns (bool success)
```

Rolls verification method to new key

#### Parameters

| Name | Type                                 | Description               |
| ---- | ------------------------------------ | ------------------------- |
| args | struct IDidDocumentDetailed.RollArgs | Roll operation parameters |

#### Return Values

| Name    | Type | Description            |
| ------- | ---- | ---------------------- |
| success | bool | Whether roll succeeded |

### getDids

```solidity
function getDids(uint256 page, uint256 pageSize) external view returns (string[] items, uint256 total, uint256 howMany, uint256 prev, uint256 next)
```

Gets paginated list of all DIDs

#### Parameters

| Name     | Type    | Description             |
| -------- | ------- | ----------------------- |
| page     | uint256 | Page number (0-indexed) |
| pageSize | uint256 | Items per page          |

#### Return Values

| Name    | Type     | Description           |
| ------- | -------- | --------------------- |
| items   | string[] | Array of DID strings  |
| total   | uint256  | Total DID count       |
| howMany | uint256  | Items in current page |
| prev    | uint256  | Previous page number  |
| next    | uint256  | Next page number      |

### getDidsByController

```solidity
function getDidsByController(string controller, uint256 page, uint256 pageSize) external view returns (string[] items, uint256 total, uint256 howMany, uint256 prev, uint256 next)
```

Gets DIDs controlled by specific controller

#### Parameters

| Name       | Type    | Description             |
| ---------- | ------- | ----------------------- |
| controller | string  | Controller DID to query |
| page       | uint256 | Page number (0-indexed) |
| pageSize   | uint256 | Items per page          |

#### Return Values

| Name    | Type     | Description                     |
| ------- | -------- | ------------------------------- |
| items   | string[] | Array of controlled DID strings |
| total   | uint256  | Total controlled DIDs           |
| howMany | uint256  | Items in current page           |
| prev    | uint256  | Previous page number            |
| next    | uint256  | Next page number                |

### getDidsByVerificationRelationship

```solidity
function getDidsByVerificationRelationship(string vMethodId, string name, uint256 page, uint256 pageSize) external view returns (struct IDidDocumentDetailed.DidWithPeriod[] items, uint256 total, uint256 howMany, uint256 prev, uint256 next)
```

Gets DIDs by verification relationship

#### Parameters

| Name      | Type    | Description             |
| --------- | ------- | ----------------------- |
| vMethodId | string  | Method ID to query      |
| name      | string  | Relationship name       |
| page      | uint256 | Page number (0-indexed) |
| pageSize  | uint256 | Items per page          |

#### Return Values

| Name    | Type                                        | Description                |
| ------- | ------------------------------------------- | -------------------------- |
| items   | struct IDidDocumentDetailed.DidWithPeriod[] | Array of DIDs with periods |
| total   | uint256                                     | Total matching DIDs        |
| howMany | uint256                                     | Items in current page      |
| prev    | uint256                                     | Previous page number       |
| next    | uint256                                     | Next page number           |

### getDidDocument

```solidity
function getDidDocument(string did) external view returns (string baseDocument, string[] controllers, string[] vMethodIds, struct IDidDocumentDetailed.VMethod[] vMethods, struct IDidDocumentDetailed.VRelationship[] vRelationships)
```

Retrieves complete DID document

#### Parameters

| Name | Type   | Description             |
| ---- | ------ | ----------------------- |
| did  | string | DID identifier to query |

#### Return Values

| Name           | Type                                        | Description                   |
| -------------- | ------------------------------------------- | ----------------------------- |
| baseDocument   | string                                      | Base document content         |
| controllers    | string[]                                    | Array of controller DIDs      |
| vMethodIds     | string[]                                    | Array of method IDs           |
| vMethods       | struct IDidDocumentDetailed.VMethod[]       | Array of verification methods |
| vRelationships | struct IDidDocumentDetailed.VRelationship[] | Array of relationships        |

### getDidDocumentByTimestamp

```solidity
function getDidDocumentByTimestamp(string did, uint256 timestamp) external view returns (string baseDocument, string[] controllers, string[] vMethodIds, struct IDidDocumentDetailed.VMethod[] vMethods, struct IDidDocumentDetailed.VRelationship[] vRelationships)
```

Gets DID document at specific timestamp

#### Parameters

| Name      | Type    | Description             |
| --------- | ------- | ----------------------- |
| did       | string  | DID identifier to query |
| timestamp | uint256 | Point-in-time to query  |

#### Return Values

| Name           | Type                                        | Description              |
| -------------- | ------------------------------------------- | ------------------------ |
| baseDocument   | string                                      | Historical base document |
| controllers    | string[]                                    | Historical controllers   |
| vMethodIds     | string[]                                    | Historical method IDs    |
| vMethods       | struct IDidDocumentDetailed.VMethod[]       | Historical methods       |
| vRelationships | struct IDidDocumentDetailed.VRelationship[] | Historical relationships |

### checkController

```solidity
function checkController(string did, address controller) external view returns (bool isController)
```

Verifies if address controls DID

#### Parameters

| Name       | Type    | Description             |
| ---------- | ------- | ----------------------- |
| did        | string  | DID identifier to check |
| controller | address | Address to validate     |

#### Return Values

| Name         | Type | Description                  |
| ------------ | ---- | ---------------------------- |
| isController | bool | Whether address controls DID |

---

## IDidRegistry

DID registry contract interface for managing decentralised identities

_Extends detailed DID document functionality with version control_

### NewVersion

```solidity
event NewVersion(uint256 version)
```

Emitted when registry version is updated

#### Parameters

| Name    | Type    | Description        |
| ------- | ------- | ------------------ |
| version | uint256 | New version number |

### initialize

```solidity
function initialize(address _tprAddress, uint256 v) external
```

Initialises registry with trusted policy registry address

#### Parameters

| Name         | Type    | Description                              |
| ------------ | ------- | ---------------------------------------- |
| \_tprAddress | address | Trusted policy registry contract address |
| v            | uint256 | Initial version number                   |

### checkController

```solidity
function checkController(bytes identifier, address ctrl) external view returns (bool isController)
```

Verifies if address is authorised controller for DID

#### Parameters

| Name       | Type    | Description                    |
| ---------- | ------- | ------------------------------ |
| identifier | bytes   | DID identifier bytes           |
| ctrl       | address | Controller address to validate |

#### Return Values

| Name         | Type | Description                      |
| ------------ | ---- | -------------------------------- |
| isController | bool | Whether address controls the DID |

### version

```solidity
function version() external view returns (uint256 currentVersion)
```

Gets current registry version number

#### Return Values

| Name           | Type    | Description        |
| -------------- | ------- | ------------------ |
| currentVersion | uint256 | The active version |
