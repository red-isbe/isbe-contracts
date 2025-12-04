// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IssuerType, Attribute} from './Types.sol';

/**
 * @title Trusted Issuers Registry Interface
 * @notice Interface for managing issuer attributes, metadata, and proxy relationships
 * @dev Implements hierarchical access control (ISBE → RTAO → TAO → TI) with metadata/data separation
 * @author ISBE Development Team
 */
interface ITrustedIssuersRegistry {
    /**
     * @notice Emitted when new attribute metadata is set
     * @param did Issuer's decentralised identifier
     * @param issuerType Type of issuer entity
     * @param revisionId Revision identifier
     * @param attributeIdTao Attribute validating TAO DID
     * @param attributeId Unique attribute identifier
     * @param newRevisionId New revision identifier for the attribute
     * @param taoDid DID of the entity registering the attribute
     */
    event AttributeMetadataSet(
        bytes32 indexed did,
        IssuerType issuerType,
        bytes32 indexed revisionId,
        bytes32 taoDid,
        bytes32 indexed attributeIdTao,
        bytes32 attributeId,
        bytes32 newRevisionId,
        bytes32 rootTaoDid
    );

    /**
     * @notice Emitted when new attribute data is set
     * @param did Issuer's decentralised identifier
     * @param attributeId Unique attribute identifier
     * @param attributeData Attribute data stored
     */
    event AttributeDataSet(
        bytes32 indexed did,
        bytes32 indexed attributeId,
        bytes attributeData
    );

    /**
     * @notice Emitted when new attribute revision is created
     * @param did Issuer's decentralised identifier
     * @param attributeId Unique attribute identifier
     * @param revisionId Revision identifier
     * @param issuerType Type of issuer entity
     */
    event AddAttributeRevision(
        bytes32 indexed did,
        bytes32 indexed attributeId,
        bytes32 indexed revisionId,
        IssuerType issuerType
    );

    /**
     * @notice Emitted when new issuer proxy relationship is established
     * @param did Issuer's decentralised identifier
     * @param proxyId Proxy entity identifier
     */
    event AddIssuerProxy(bytes32 indexed did, bytes32 indexed proxyId);

    /**
     * @notice Emitted when existing issuer proxy relationship is updated
     * @param did Issuer's decentralised identifier
     * @param proxyId Proxy entity identifier
     */
    event UpdateIssuerProxy(bytes32 indexed did, bytes32 indexed proxyId);

    /**
     * @notice Emitted when issuer proxy relationship is removed
     * @param did Issuer's decentralised identifier
     * @param proxyId Proxy entity identifier
     */
    event RemoveIssuerProxy(bytes32 indexed did, bytes32 indexed proxyId);

    /**
     * @notice Thrown when an invalid issuer type is used
     * @dev This error indicates an unsupported or malformed issuer type parameter
     */
    error InvalidIssuerType();

    /**
     * @notice Thrown when an attribute is already stored
     * @dev Prevents duplicate attribute storage for the same issuer and attribute key
     */
    error AttributeAlreadyStored();

    /**
     * @notice Thrown when an issuer does not exist
     * @dev Indicates the requested issuer has not been registered in the system
     */
    error IssuerDoesNotExists();

    /**
     * @notice Thrown when an attribute is not found
     * @dev Indicates the requested attribute for an issuer could not be located
     */
    error AttributeHasNotBeenFound();

    /**
     * @notice Thrown when a revision is owned by other issuer
     * @dev Prevents modifications by another issuer and ensures data integrity
     */
    error AttributeOwnedByAnotherIssuer();

    /**
     * @notice Thrown when a non-TAO entity attempts to interact with root TAO
     * @dev Enforces access control for root TAO operations
     */
    error SenderCannotInteractWithRootTao();

    /**
     * @notice Thrown when sender is not a TAO or root TAO
     * @dev Validates sender's authority for issuer management operations
     */
    error SenderIsNotTaoOrRootTao();

    /**
     * @notice Thrown when sender is not a TAO or root TAO for a specific DID
     * @dev Provides granular access control for DID-specific operations
     */
    error SenderIsNotTaoOrRootTaoOf(bytes32 did);

    /**
     * @notice Thrown when a revision is not found
     * @dev Indicates the requested revision for an issuer attribute could not be located
     */
    error RevisionHasNotBeenFound();

    /**
     * @notice Sets metadata for an issuer's attribute
     * @dev Access controlled by issuer type hierarchy (ISBE → RTAO → TAO → TI)
     * @param did Issuer's decentralised identifier
     * @param issuerType Type of issuer entity
     * @param revisionId Attribute revision identifier
     * @param taoDid DID of the entity registering the attribute
     * @param attributeIdTao Attribute validating TAO DID
     */
    function setAttributeMetadata(
        bytes32 did,
        IssuerType issuerType,
        bytes32 revisionId,
        bytes32 taoDid,
        bytes32 attributeIdTao
    ) external;

    /**
     * @notice Sets data for an issuer's attribute revision
     * @dev Requires prior metadata creation by EBSI, RTAO, or TAO
     * @param did Issuer's decentralised identifier
     * @param attributeId Attribute identifier
     * @param attributeData Attribute data to store
     */
    function setAttributeData(
        bytes32 did,
        bytes32 attributeId,
        bytes calldata attributeData
    ) external;

    /**
     * @notice Retrieves issuer information by decentralised identifier
     * @param did Issuer's decentralised identifier
     * @return noAttributesAccepted Whether issuer has accepted attributes
     * @return totalAttributes Total attributes count
     */
    function getIssuer(
        bytes32 did
    )
        external
        view
        returns (bool noAttributesAccepted, uint256 totalAttributes);

    /**
     * @notice Retrieves paginated list of issuers
     * @param page Zero-indexed page number
     * @param pageSize Maximum items per page
     * @return items List of issuer identifiers
     * @return total Total issuer count
     * @return howMany Items returned in this page
     * @return prev Previous page number
     * @return next Next page number
     */
    function getIssuers(
        uint256 page,
        uint256 pageSize
    )
        external
        view
        returns (
            bytes32[] memory items,
            uint256 total,
            uint256 howMany,
            uint256 prev,
            uint256 next
        );

    /**
     * @notice Retrieves paginated list of issuer attributes
     * @param did Issuer's decentralised identifier
     * @param page Zero-indexed page number
     * @param pageSize Maximum items per page
     * @return items List of attribute identifiers
     * @return total Total attribute count
     * @return howMany Items returned in this page
     * @return prev Previous page number
     * @return next Next page number
     */
    function getIssuerAttributes(
        bytes32 did,
        uint256 page,
        uint256 pageSize
    )
        external
        view
        returns (
            bytes32[] memory items,
            uint256 total,
            uint256 howMany,
            uint256 prev,
            uint256 next
        );

    /**
     * @notice Retrieves paginated list of attribute revisions
     * @param did Issuer's decentralised identifier
     * @param anyAttrVersHash Optional filter for attribute version hash
     * @param page Zero-indexed page number
     * @param pageSize Maximum items per page
     * @return items List of revision identifiers
     * @return total Total revision count
     * @return howMany Items returned in this page
     * @return prev Previous page number
     * @return next Next page number
     */
    function getIssuerAttributeRevisions(
        bytes32 did,
        bytes32 anyAttrVersHash,
        uint256 page,
        uint256 pageSize
    )
        external
        view
        returns (
            bytes32[] memory items,
            uint256 total,
            uint256 howMany,
            uint256 prev,
            uint256 next
        );

    /**
     * @notice Retrieves latest revision identifier for an attribute
     * @param did Issuer's decentralised identifier
     * @param attributeId Attribute identifier
     * @return latestRevisionAttributeId Identifier of latest revision
     */
    function getLatestRevisionAttributeId(
        bytes32 did,
        bytes32 attributeId
    ) external view returns (bytes32 latestRevisionAttributeId);

    /**
     * @notice Retrieves specific attribute revision data
     * @param did Issuer's decentralised identifier
     * @param attributeId Attribute identifier
     * @param revisionId Revision identifier
     * @return attribute Attribute data structure
     */
    function getRevisionAttribute(
        bytes32 did,
        bytes32 attributeId,
        bytes32 revisionId
    ) external view returns (Attribute memory attribute);

    /**
     * @notice Retrieves latest revision of an attribute
     * @param issuerDid Issuer's decentralised identifier
     * @param attributeId Attribute identifier
     * @return attribute Attribute data structure
     */
    function getLatestRevisionAttribute(
        bytes32 issuerDid,
        bytes32 attributeId
    ) external view returns (Attribute memory attribute);
}
