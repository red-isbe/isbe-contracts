## ITrustedIssuersRegistry

Interface for managing issuer attributes, metadata, and proxy relationships

_Implements hierarchical access control (ISBE → RTAO → TAO → TI) with metadata/data separation_

### AttributeMetadataSet

```solidity
event AttributeMetadataSet(bytes32 did, enum IssuerType issuerType, bytes32 revisionId, bytes32 taoDid, bytes32 attributeIdTao, bytes32 attributeId, bytes32 newRevisionId, bytes32 rootTaoDid)
```

Emitted when new attribute metadata is set

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | bytes32 | Issuer's decentralised identifier |
| issuerType | enum IssuerType | Type of issuer entity |
| revisionId | bytes32 | Revision identifier |
| taoDid | bytes32 | DID of the entity registering the attribute |
| attributeIdTao | bytes32 | Attribute validating TAO DID |
| attributeId | bytes32 | Unique attribute identifier |
| newRevisionId | bytes32 | New revision identifier for the attribute |
| rootTaoDid | bytes32 |  |

### AttributeDataSet

```solidity
event AttributeDataSet(bytes32 did, bytes32 attributeId, bytes attributeData)
```

Emitted when new attribute data is set

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | bytes32 | Issuer's decentralised identifier |
| attributeId | bytes32 | Unique attribute identifier |
| attributeData | bytes | Attribute data stored |

### AddAttributeRevision

```solidity
event AddAttributeRevision(bytes32 did, bytes32 attributeId, bytes32 revisionId, enum IssuerType issuerType)
```

Emitted when new attribute revision is created

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | bytes32 | Issuer's decentralised identifier |
| attributeId | bytes32 | Unique attribute identifier |
| revisionId | bytes32 | Revision identifier |
| issuerType | enum IssuerType | Type of issuer entity |

### AddIssuerProxy

```solidity
event AddIssuerProxy(bytes32 did, bytes32 proxyId)
```

Emitted when new issuer proxy relationship is established

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | bytes32 | Issuer's decentralised identifier |
| proxyId | bytes32 | Proxy entity identifier |

### UpdateIssuerProxy

```solidity
event UpdateIssuerProxy(bytes32 did, bytes32 proxyId)
```

Emitted when existing issuer proxy relationship is updated

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | bytes32 | Issuer's decentralised identifier |
| proxyId | bytes32 | Proxy entity identifier |

### RemoveIssuerProxy

```solidity
event RemoveIssuerProxy(bytes32 did, bytes32 proxyId)
```

Emitted when issuer proxy relationship is removed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | bytes32 | Issuer's decentralised identifier |
| proxyId | bytes32 | Proxy entity identifier |

### InvalidIssuerType

```solidity
error InvalidIssuerType()
```

Thrown when an invalid issuer type is used

_This error indicates an unsupported or malformed issuer type parameter_

### AttributeAlreadyStored

```solidity
error AttributeAlreadyStored()
```

Thrown when an attribute is already stored

_Prevents duplicate attribute storage for the same issuer and attribute key_

### IssuerDoesNotExists

```solidity
error IssuerDoesNotExists()
```

Thrown when an issuer does not exist

_Indicates the requested issuer has not been registered in the system_

### AttributeHasNotBeenFound

```solidity
error AttributeHasNotBeenFound()
```

Thrown when an attribute is not found

_Indicates the requested attribute for an issuer could not be located_

### AttributeOwnedByAnotherIssuer

```solidity
error AttributeOwnedByAnotherIssuer()
```

Thrown when a revision is owned by other issuer

_Prevents modifications by another issuer and ensures data integrity_

### SenderCannotInteractWithRootTao

```solidity
error SenderCannotInteractWithRootTao()
```

Thrown when a non-TAO entity attempts to interact with root TAO

_Enforces access control for root TAO operations_

### SenderIsNotTaoOrRootTao

```solidity
error SenderIsNotTaoOrRootTao()
```

Thrown when sender is not a TAO or root TAO

_Validates sender's authority for issuer management operations_

### SenderIsNotTaoOrRootTaoOf

```solidity
error SenderIsNotTaoOrRootTaoOf(bytes32 did)
```

Thrown when sender is not a TAO or root TAO for a specific DID

_Provides granular access control for DID-specific operations_

### RevisionHasNotBeenFound

```solidity
error RevisionHasNotBeenFound()
```

Thrown when a revision is not found

_Indicates the requested revision for an issuer attribute could not be located_

### setAttributeMetadata

```solidity
function setAttributeMetadata(bytes32 did, enum IssuerType issuerType, bytes32 revisionId, bytes32 taoDid, bytes32 attributeIdTao) external
```

Sets metadata for an issuer's attribute

_Access controlled by issuer type hierarchy (ISBE → RTAO → TAO → TI)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | bytes32 | Issuer's decentralised identifier |
| issuerType | enum IssuerType | Type of issuer entity |
| revisionId | bytes32 | Attribute revision identifier |
| taoDid | bytes32 | DID of the entity registering the attribute |
| attributeIdTao | bytes32 | Attribute validating TAO DID |

### setAttributeData

```solidity
function setAttributeData(bytes32 did, bytes32 attributeId, bytes attributeData) external
```

Sets data for an issuer's attribute revision

_Requires prior metadata creation by EBSI, RTAO, or TAO_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | bytes32 | Issuer's decentralised identifier |
| attributeId | bytes32 | Attribute identifier |
| attributeData | bytes | Attribute data to store |

### getIssuer

```solidity
function getIssuer(bytes32 did) external view returns (bool noAttributesAccepted, uint256 totalAttributes)
```

Retrieves issuer information by decentralised identifier

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | bytes32 | Issuer's decentralised identifier |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| noAttributesAccepted | bool | Whether issuer has accepted attributes |
| totalAttributes | uint256 | Total attributes count |

### getIssuers

```solidity
function getIssuers(uint256 page, uint256 pageSize) external view returns (bytes32[] items, uint256 total, uint256 howMany, uint256 prev, uint256 next)
```

Retrieves paginated list of issuers

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| page | uint256 | Zero-indexed page number |
| pageSize | uint256 | Maximum items per page |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| items | bytes32[] | List of issuer identifiers |
| total | uint256 | Total issuer count |
| howMany | uint256 | Items returned in this page |
| prev | uint256 | Previous page number |
| next | uint256 | Next page number |

### getIssuerAttributes

```solidity
function getIssuerAttributes(bytes32 did, uint256 page, uint256 pageSize) external view returns (bytes32[] items, uint256 total, uint256 howMany, uint256 prev, uint256 next)
```

Retrieves paginated list of issuer attributes

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | bytes32 | Issuer's decentralised identifier |
| page | uint256 | Zero-indexed page number |
| pageSize | uint256 | Maximum items per page |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| items | bytes32[] | List of attribute identifiers |
| total | uint256 | Total attribute count |
| howMany | uint256 | Items returned in this page |
| prev | uint256 | Previous page number |
| next | uint256 | Next page number |

### getIssuerAttributeRevisions

```solidity
function getIssuerAttributeRevisions(bytes32 did, bytes32 anyAttrVersHash, uint256 page, uint256 pageSize) external view returns (bytes32[] items, uint256 total, uint256 howMany, uint256 prev, uint256 next)
```

Retrieves paginated list of attribute revisions

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | bytes32 | Issuer's decentralised identifier |
| anyAttrVersHash | bytes32 | Optional filter for attribute version hash |
| page | uint256 | Zero-indexed page number |
| pageSize | uint256 | Maximum items per page |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| items | bytes32[] | List of revision identifiers |
| total | uint256 | Total revision count |
| howMany | uint256 | Items returned in this page |
| prev | uint256 | Previous page number |
| next | uint256 | Next page number |

### getLatestRevisionAttributeId

```solidity
function getLatestRevisionAttributeId(bytes32 did, bytes32 attributeId) external view returns (bytes32 latestRevisionAttributeId)
```

Retrieves latest revision identifier for an attribute

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | bytes32 | Issuer's decentralised identifier |
| attributeId | bytes32 | Attribute identifier |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| latestRevisionAttributeId | bytes32 | Identifier of latest revision |

### getRevisionAttribute

```solidity
function getRevisionAttribute(bytes32 did, bytes32 attributeId, bytes32 revisionId) external view returns (struct Attribute attribute)
```

Retrieves specific attribute revision data

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | bytes32 | Issuer's decentralised identifier |
| attributeId | bytes32 | Attribute identifier |
| revisionId | bytes32 | Revision identifier |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| attribute | struct Attribute | Attribute data structure |

### getLatestRevisionAttribute

```solidity
function getLatestRevisionAttribute(bytes32 issuerDid, bytes32 attributeId) external view returns (struct Attribute attribute)
```

Retrieves latest revision of an attribute

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| issuerDid | bytes32 | Issuer's decentralised identifier |
| attributeId | bytes32 | Attribute identifier |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| attribute | struct Attribute | Attribute data structure |



---

## TrustedIssuersRegistry

### constructor

```solidity
constructor() internal
```

### setAttributeMetadata

```solidity
function setAttributeMetadata(bytes32 _did, enum IssuerType _issuerType, bytes32 _revisionId, bytes32 _taoDid, bytes32 _attributeIdTao) external
```

Sets metadata for an issuer's attribute (Phase 1 of accreditation)

_Access control is handled by _checkEligibility in the internal function.
     The caller must be:
     - ISBE admin with _TRUSTED_ISSUERS_REGISTRY_ROLE, OR
     - A TAO/RTAO that controls _taoDid
     NOTE: _did is the RECIPIENT of the accreditation (the issuer being created/updated),
           not the caller. The caller's authorization is validated via _taoDid in _checkEligibility._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | Issuer DID (recipient of the accreditation) |
| _issuerType | enum IssuerType | Type of issuer (ROOT_TAO, TAO, TI) |
| _revisionId | bytes32 | Attribute revision identifier |
| _taoDid | bytes32 | TAO DID that is creating/authorizing this accreditation (caller's TAO) |
| _attributeIdTao | bytes32 | Attribute ID for TAO validation |

### setAttributeData

```solidity
function setAttributeData(bytes32 _did, bytes32 _attributeId, bytes _attributeData) external
```

### getIssuer

```solidity
function getIssuer(bytes32 _did) external view returns (bool noAttributesAccepted_, uint256 totalAttributes_)
```

### getIssuers

```solidity
function getIssuers(uint256 _page, uint256 _pageSize) external view returns (bytes32[] items_, uint256 total_, uint256 howMany_, uint256 prev_, uint256 next_)
```

### getIssuerAttributes

```solidity
function getIssuerAttributes(bytes32 _did, uint256 _page, uint256 _pageSize) external view returns (bytes32[] items_, uint256 total_, uint256 howMany_, uint256 prev_, uint256 next_)
```

### getIssuerAttributeRevisions

```solidity
function getIssuerAttributeRevisions(bytes32 _did, bytes32 _anyAttrVersHash, uint256 _page, uint256 _pageSize) external view returns (bytes32[] items_, uint256 total_, uint256 howMany_, uint256 prev_, uint256 next_)
```

### getLatestRevisionAttributeId

```solidity
function getLatestRevisionAttributeId(bytes32 _did, bytes32 _attributeId) external view returns (bytes32 latestRevisionAttributeId_)
```

### getRevisionAttribute

```solidity
function getRevisionAttribute(bytes32 _did, bytes32 _attributeId, bytes32 _revisionId) external view returns (struct Attribute attribute_)
```

### getLatestRevisionAttribute

```solidity
function getLatestRevisionAttribute(bytes32 _issuerDid, bytes32 _attributeId) external view returns (struct Attribute attribute_)
```



---

## TrustedIssuersRegistryFacet

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Gets the list of ERC-165 interface IDs the facet supports.

_A pure function that returns an array of supported `bytes4` IDs._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaces_ | bytes4[] | An array of supported interface identifiers. |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Retrieves the unique business identifier for this facet.

_Returns a `bytes32` key identifying the facet's purpose._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| businessId_ | bytes32 | The `bytes32` ID for the business logic. |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Gets all function selectors implemented by this facet.

_A pure function that returns a `bytes4[]` array of selectors._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| selectors_ | bytes4[] | An array of `bytes4` function selectors. |

### _implementedInterfaces

```solidity
function _implementedInterfaces() internal pure returns (bytes4[] interfaces_)
```



---

## TrustedIssuersRegistryInternal

### Issuers

Container structure for issuer registry data

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Issuers {
  bytes32[] didStore;
  mapping(bytes32 => struct Entity) issuerStore;
  mapping(bytes32 => struct AttributeMetadata) attributeMetadataStore;
}
```

### onlyValidIssuerType

```solidity
modifier onlyValidIssuerType(enum IssuerType _issuerType)
```

Restricts issuer type to valid values

_Prevents use of IssuerType.NONE_

### onlyBySameIssuer

```solidity
modifier onlyBySameIssuer(bytes32 _did, bytes32 _revisionId)
```

Ensures attribute operations are performed by the same issuer

_Validates ownership before allowing attribute modifications_

### onlyValidAttributeId

```solidity
modifier onlyValidAttributeId(bytes32 _did, bytes32 _attributeId)
```

Ensures attribute operations are performed with valid attribute ID

_Validates that the provided attribute ID matches the stored attribute ID for the given DID_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | Issuer DID |
| _attributeId | bytes32 | Attribute identifier to validate |

### _setAttributeMetadata

```solidity
function _setAttributeMetadata(bytes32 _did, enum IssuerType _issuerType, bytes32 _revisionId, bytes32 _taoDid, bytes32 _attributeIdTao) internal returns (bytes32 attributeId_, bytes32 newRevisionId_, struct TaoHierarchy taoHierarchy_)
```

Sets attribute metadata for an issuer

_Creates or updates attribute metadata with validation and revision tracking_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | Issuer DID |
| _issuerType | enum IssuerType | Type of issuer (ROOT_TAO, TAO, TI) |
| _revisionId | bytes32 | Attribute revision identifier |
| _taoDid | bytes32 | TAO DID associated with the attribute |
| _attributeIdTao | bytes32 | Attribute ID for TAO validation |

### _setAttributeData

```solidity
function _setAttributeData(bytes32 _did, bytes32 _attributeId, bytes _attributeData) internal
```

Sets attribute data for an issuer

_Updates attribute data and adds a new revision_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | Issuer DID |
| _attributeId | bytes32 | Attribute identifier |
| _attributeData | bytes | Attribute data payload |

### _addRevision

```solidity
function _addRevision(bytes32 _did, bytes32 _attributeId, bytes32 _newRevisionId, enum IssuerType _issuerType, bytes32 _taoDid, bytes32 _rootTaoDid, bytes _attributeData) internal
```

Adds a new attribute revision

_Stores revision hash, data, and metadata_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | Issuer DID |
| _attributeId | bytes32 | Attribute identifier |
| _newRevisionId | bytes32 | New revision identifier |
| _issuerType | enum IssuerType | Type of issuer (ROOT_TAO, TAO) |
| _taoDid | bytes32 | Tao DID associated with the attribute |
| _rootTaoDid | bytes32 | Root TAO DID |
| _attributeData | bytes | Attribute data payload |

### _getIssuer

```solidity
function _getIssuer(bytes32 _did) internal view returns (bool noAttributesAccepted_, uint256 totalAttributes_)
```

Gets issuer attributes

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | Issuer DID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| noAttributesAccepted_ | bool | True if the issuer has no attributes accepted yet |
| totalAttributes_ | uint256 | Total number of attributes registered for this issuer |

### _getIssuers

```solidity
function _getIssuers(uint256 _page, uint256 _pageSize) internal view returns (bytes32[] items_, uint256 total_, uint256 howMany_, uint256 prev_, uint256 next_)
```

Gets list of registered issuers

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _page | uint256 | Page number |
| _pageSize | uint256 | Page size |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| items_ | bytes32[] | List of issuers on the current page |
| total_ | uint256 | Total number of issuers registered |
| howMany_ | uint256 | Number of items returned in this response |
| prev_ | uint256 | Previous page number or zero if at the beginning |
| next_ | uint256 | Next page number or zero if at the end |

### _getIssuerAttributes

```solidity
function _getIssuerAttributes(bytes32 _did, uint256 _page, uint256 _pageSize) internal view returns (bytes32[] items_, uint256 total_, uint256 howMany_, uint256 prev_, uint256 next_)
```

Gets issuer attributes

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | Issuer DID |
| _page | uint256 | Page number |
| _pageSize | uint256 | Page size |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| items_ | bytes32[] | Array of attributes |
| total_ | uint256 | Total number of attributes |
| howMany_ | uint256 | Number of attributes on the current page |
| prev_ | uint256 | Previous page number |
| next_ | uint256 | Next page number |

### _getIssuerAttributeRevisions

```solidity
function _getIssuerAttributeRevisions(bytes32 _did, bytes32 _anyAttrVersHash, uint256 _page, uint256 _pageSize) internal view returns (bytes32[] items_, uint256 total_, uint256 howMany_, uint256 prev_, uint256 next_)
```

Gets attribute revisions

_This function is private and should only be called internally by other functions within this contract._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | Issuer DID |
| _anyAttrVersHash | bytes32 | Attribute revision hash |
| _page | uint256 | Page number |
| _pageSize | uint256 | Page size |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| items_ | bytes32[] | Array of attribute revisions |
| total_ | uint256 | Total number of attribute revisions |
| howMany_ | uint256 | Number of attribute revisions returned in this call |
| prev_ | uint256 | Previous cursor position |
| next_ | uint256 | Next cursor position |

### _getLatestRevisionAttributeId

```solidity
function _getLatestRevisionAttributeId(bytes32 _did, bytes32 _attributeId) internal view returns (bytes32 latestRevisionAttributeId_)
```

Gets latest attribute revision ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | Issuer DID |
| _attributeId | bytes32 | Attribute identifier |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| latestRevisionAttributeId_ | bytes32 | Latest attribute revision ID |

### _getRevisionAttribute

```solidity
function _getRevisionAttribute(bytes32 _did, bytes32 _attributeId, bytes32 _revisionId) internal view returns (struct Attribute attribute_)
```

Gets attribute details by revision

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | Issuer DID |
| _attributeId | bytes32 | Attribute identifier |
| _revisionId | bytes32 | Revision identifier |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| attribute_ | struct Attribute | Attribute details by revision |

### _getLatestRevisionAttribute

```solidity
function _getLatestRevisionAttribute(bytes32 _issuerDid, bytes32 _attributeId) internal view returns (struct Attribute attribute_)
```

Gets latest attribute revision

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _issuerDid | bytes32 | Issuer DID |
| _attributeId | bytes32 | Attribute identifier |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| attribute_ | struct Attribute | Latest attribute revision |

### _checkEligibility

```solidity
function _checkEligibility(struct TrustedIssuersRegistryInternal.Issuers $, bytes32 _did, bytes32 _lastRevisionId, enum IssuerType _issuerType, bytes32 _taoDid, bytes32 _lastRevisionIdTao) internal view
```

Checks if sender is eligible to modify attribute

_Validates sender permissions and trust chain integrity
     OPTIMIZED: Receives storage pointer to avoid redundant SLOAD operations_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| $ | struct TrustedIssuersRegistryInternal.Issuers |  |
| _did | bytes32 | Issuer DID being modified |
| _lastRevisionId | bytes32 | Last revision ID of the attribute |
| _issuerType | enum IssuerType | Type of issuer being created/updated |
| _taoDid | bytes32 | TAO DID that should authorize this operation |
| _lastRevisionIdTao | bytes32 | Last revision of TAO's attribute |

