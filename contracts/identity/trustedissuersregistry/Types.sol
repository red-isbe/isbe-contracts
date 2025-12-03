// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title Issuer Management Data Structures
 * @notice Core data structures for managing issuer attributes and metadata
 * @dev Implements hierarchical validation with decentralised identifier tracking
 * @author ISBE Development Team
 */

/**
 * @notice Enumeration of issuer types with hierarchical validation rules
 * @param NONE Uninitialised issuer state
 * @param ROOT_TAO Top-level authority issuer
 * @param TAO Trusted Authority issuer
 * @param TI Issuer entity
 * @param REVOKED Permanently invalidated issuer
 */
enum IssuerType {
    NONE,
    ROOT_TAO,
    TAO,
    TI,
    REVOKED
}

/**
 * @notice Metadata structure for attribute version tracking
 * @param did Owner's decentralised identifier
 * @param attributeId Unique attribute identifier (first version hash)
 * @param issuerType Issuer type of owner
 * @param taoDid Validating TAO's decentralised identifier
 * @param rootTaoDid Root TAO reference
 */
struct AttributeMetadata {
    bytes32 did;
    bytes32 attributeId;
    IssuerType issuerType;
    bytes32 taoDid;
    bytes32 rootTaoDid;
}

/**
 * @notice Structure representing issuer attribute data
 * @param did Issuer's decentralised identifier
 * @param attributeId Unique attribute identifier
 * @param attribData Attribute value data
 * @param tao Validating TAO DID
 * @param rootTao Root TAO reference
 * @param issuerType Type of issuer entity
 */
struct Attribute {
    bytes32 did;
    bytes32 attributeId;
    bytes attribData;
    bytes32 tao;
    bytes32 rootTao;
    IssuerType issuerType;
}

/**
 * @notice Entity data structure for attribute management
 * @param attributes List of attribute first version hashes
 * @param revisions Mapping of attribute versions to data values
 * @param revisionHashes Mapping of first version hashes to version history
 * @param noAttributesAccepted Flag indicating if entity has accepted attributes
 */
struct Entity {
    bytes32[] attributes;
    mapping(bytes32 attributeId => bytes values) revisions;
    mapping(bytes32 firstAttrId => bytes32[] versions) revisionHashes;
    bool noAttributesAccepted;
}

/**
 * @notice Intermediate structure for TAO hierarchy resolution
 * @param taoDid The TAO DID that validates this attribute
 * @param rootTaoDid The root TAO in the trust chain
 * @param lastRevisionIdTao Latest revision of TAO's attribute
 */
struct TaoHierarchy {
    bytes32 taoDid;
    bytes32 rootTaoDid;
    bytes32 lastRevisionIdTao;
}

function _buildAttribute(
    bytes32 _did,
    bytes32 _attributeId,
    bytes memory _attribData,
    bytes32 _tao,
    bytes32 _rootTao,
    IssuerType _issuerType
) pure returns (Attribute memory attribute_) {
    attribute_ = Attribute({
        did: _did,
        attributeId: _attributeId,
        attribData: _attribData,
        tao: _tao,
        rootTao: _rootTao,
        issuerType: _issuerType
    });
}

function _buildAttributeMetadata(
    bytes32 _did,
    bytes32 _attributeId,
    IssuerType _issuerType,
    bytes32 _taoDid,
    bytes32 _rootTaoDid
) pure returns (AttributeMetadata memory attributeMetadata_) {
    attributeMetadata_ = AttributeMetadata({
        did: _did,
        attributeId: _attributeId,
        issuerType: _issuerType,
        taoDid: _taoDid,
        rootTaoDid: _rootTaoDid
    });
}
