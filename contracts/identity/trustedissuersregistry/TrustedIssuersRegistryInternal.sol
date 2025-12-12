// SPDX-License-Identifier: Apache-2.0

/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
pragma solidity ^0.8.28;

import {
    Entity,
    AttributeMetadata,
    IssuerType,
    Attribute,
    TaoHierarchy,
    _buildAttribute,
    _buildAttributeMetadata
} from './Types.sol';
import {DidControllerInternal} from '../didregistry/DidControllerInternal.sol';
import {ITrustedIssuersRegistry} from './ITrustedIssuersRegistry.sol';
import {LibCommon} from '../../core/LibCommon.sol';
import {_ISSUER_STORAGE_POSITION} from '../../constants/storagePositions.sol';
import {_TRUSTED_ISSUERS_REGISTRY_ROLE} from '../../constants/roles.sol';

abstract contract TrustedIssuersRegistryInternal is DidControllerInternal {
    /**
     * @notice Container structure for issuer registry data
     * @param didStore List of all registered issuer DIDs
     * @param issuerStore Mapping of DIDs to issuer entities
     * @param attributeMetadataStore Mapping of attribute hashes to metadata
     */
    struct Issuers {
        bytes32[] didStore;
        mapping(bytes32 did => Entity issuers) issuerStore;
        mapping(bytes32 attributeHash => AttributeMetadata metadata) attributeMetadataStore;
    }

    /**
     * @notice Restricts issuer type to valid values
     * @dev Prevents use of IssuerType.NONE
     */
    modifier onlyValidIssuerType(IssuerType _issuerType) {
        require(
            _issuerType != IssuerType.NONE,
            ITrustedIssuersRegistry.InvalidIssuerType()
        );
        _;
    }

    /**
     * @notice Ensures attribute operations are performed by the same issuer
     * @dev Validates ownership before allowing attribute modifications
     */
    modifier onlyBySameIssuer(bytes32 _did, bytes32 _revisionId) {
        _checkAttributeOwnedByAnotherIssuer(_did, _revisionId);
        _;
    }
    /**
     * @notice Ensures attribute operations are performed with valid attribute ID
     * @dev Validates that the provided attribute ID matches the stored attribute ID for the given DID
     * @param _did Issuer DID
     * @param _attributeId Attribute identifier to validate
     */
    modifier onlyValidAttributeId(bytes32 _did, bytes32 _attributeId) {
        _checkAttributeId(_did, _attributeId);
        _;
    }

    /**
     * @notice Sets attribute metadata for an issuer
     * @dev Creates or updates attribute metadata with validation and revision tracking
     * @param _did Issuer DID
     * @param _issuerType Type of issuer (ROOT_TAO, TAO, TI)
     * @param _revisionId Attribute revision identifier
     * @param _taoDid TAO DID associated with the attribute
     * @param _attributeIdTao Attribute ID for TAO validation
     */
    function _setAttributeMetadata(
        bytes32 _did,
        IssuerType _issuerType,
        bytes32 _revisionId,
        bytes32 _taoDid,
        bytes32 _attributeIdTao
    )
        internal
        returns (
            bytes32 attributeId_,
            bytes32 newRevisionId_,
            TaoHierarchy memory taoHierarchy_
        )
    {
        Issuers storage $ = _issuerStorage();
        Entity storage entity = $.issuerStore[_did];

        // Initialize entity if new
        if (entity.attributes.length == 0) {
            $.didStore.push(_did);
            entity.noAttributesAccepted = true;
        }

        // Get or initialize attribute revisions
        bytes32 lastRevisionId;
        (
            attributeId_,
            lastRevisionId,
            newRevisionId_
        ) = _initializeAttributeRevisions(
                _did,
                _revisionId,
                $.attributeMetadataStore[_revisionId],
                entity.attributes
            );

        // Resolve TAO hierarchy
        taoHierarchy_ = _resolveTaoHierarchy(
            $,
            _issuerType,
            _did,
            _taoDid,
            _attributeIdTao
        );

        // Validate permissions
        _checkEligibility(
            $,
            _did,
            lastRevisionId,
            _issuerType,
            taoHierarchy_.taoDid,
            taoHierarchy_.lastRevisionIdTao
        );

        // Add new revision without data
        _addRevision(
            _did,
            attributeId_,
            newRevisionId_,
            _issuerType,
            taoHierarchy_.taoDid,
            taoHierarchy_.rootTaoDid,
            ''
        );
    }

    /**
     * @notice Sets attribute data for an issuer
     * @dev Updates attribute data and adds a new revision
     * @param _did Issuer DID
     * @param _attributeId Attribute identifier
     * @param _attributeData Attribute data payload
     */
    function _setAttributeData(
        bytes32 _did,
        bytes32 _attributeId,
        bytes calldata _attributeData
    ) internal {
        Issuers storage $ = _issuerStorage();
        $.issuerStore[_did].noAttributesAccepted = false;

        AttributeMetadata memory lastAttrMetadata = $.attributeMetadataStore[
            _getLatestRevisionAttributeId(_did, _attributeId)
        ];

        // rellenamos el atributo con los datos asociados
        _addRevision(
            _did,
            lastAttrMetadata.attributeId,
            sha256(_attributeData),
            lastAttrMetadata.issuerType,
            lastAttrMetadata.taoDid,
            lastAttrMetadata.rootTaoDid,
            _attributeData
        );
    }

    /**
     * @notice Adds a new attribute revision
     * @dev Stores revision hash, data, and metadata
     * @param _did Issuer DID
     * @param _attributeId Attribute identifier
     * @param _newRevisionId New revision identifier
     * @param _issuerType Type of issuer (ROOT_TAO, TAO)
     * @param _taoDid Tao DID associated with the attribute
     * @param _rootTaoDid Root TAO DID
     * @param _attributeData Attribute data payload
     */
    function _addRevision(
        bytes32 _did,
        bytes32 _attributeId,
        bytes32 _newRevisionId,
        IssuerType _issuerType,
        bytes32 _taoDid,
        bytes32 _rootTaoDid,
        bytes memory _attributeData
    ) internal {
        Issuers storage $ = _issuerStorage();
        Entity storage iss = $.issuerStore[_did];

        require(
            $.attributeMetadataStore[_newRevisionId].did == bytes32(0),
            ITrustedIssuersRegistry.AttributeOwnedByAnotherIssuer()
        );

        // push the new version hash for this attribute
        iss.revisionHashes[_attributeId].push(_newRevisionId);
        // push the new version data for this attribute
        iss.revisions[_newRevisionId] = _attributeData;
        // push the new version metadata for this attribute
        $.attributeMetadataStore[_newRevisionId] = _buildAttributeMetadata(
            _did,
            _attributeId,
            _issuerType,
            _taoDid,
            _rootTaoDid
        );

        emit ITrustedIssuersRegistry.AddAttributeRevision(
            _did,
            _attributeId,
            _newRevisionId,
            _issuerType
        );
    }

    /**
     * @notice Gets issuer attributes
     * @param _did Issuer DID
     * @return noAttributesAccepted_ True if the issuer has no attributes accepted yet
     * @return totalAttributes_ Total number of attributes registered for this issuer
     */
    function _getIssuer(
        bytes32 _did
    )
        internal
        view
        returns (bool noAttributesAccepted_, uint256 totalAttributes_)
    {
        Issuers storage $ = _issuerStorage();
        noAttributesAccepted_ = $.issuerStore[_did].noAttributesAccepted;
        totalAttributes_ = $.issuerStore[_did].attributes.length;
    }

    /**
     * @notice Gets list of registered issuers
     * @param _page Page number
     * @param _pageSize Page size
     * @return items_ List of issuers on the current page
     * @return total_ Total number of issuers registered
     * @return howMany_ Number of items returned in this response
     * @return prev_ Previous page number or zero if at the beginning
     * @return next_ Next page number or zero if at the end
     */
    function _getIssuers(
        uint256 _page,
        uint256 _pageSize
    )
        internal
        view
        returns (
            bytes32[] memory items_,
            uint256 total_,
            uint256 howMany_,
            uint256 prev_,
            uint256 next_
        )
    {
        Issuers storage $ = _issuerStorage();
        total_ = $.didStore.length;
        uint256 cursor;
        (cursor, howMany_, prev_, next_) = LibCommon.getPaginationParameters(
            total_,
            _page,
            _pageSize
        );
        items_ = new bytes32[](howMany_);
        for (uint256 i; i < howMany_; ) {
            items_[i] = $.didStore[cursor];
            unchecked {
                ++i;
                ++cursor;
            }
        }
    }

    /**
     * @notice Gets issuer attributes
     * @param _did Issuer DID
     * @param _page Page number
     * @param _pageSize Page size
     * @return items_ Array of attributes
     * @return total_ Total number of attributes
     * @return howMany_ Number of attributes on the current page
     * @return prev_ Previous page number
     * @return next_ Next page number
     */
    function _getIssuerAttributes(
        bytes32 _did,
        uint256 _page,
        uint256 _pageSize
    )
        internal
        view
        returns (
            bytes32[] memory items_,
            uint256 total_,
            uint256 howMany_,
            uint256 prev_,
            uint256 next_
        )
    {
        Issuers storage $ = _issuerStorage();
        total_ = $.issuerStore[_did].attributes.length;
        if (total_ == 0) return (items_, total_, howMany_, prev_, next_);
        uint256 cursor;
        (cursor, howMany_, prev_, next_) = LibCommon.getPaginationParameters(
            total_,
            _page,
            _pageSize
        );
        items_ = new bytes32[](howMany_);
        for (uint256 i; i < howMany_; ) {
            items_[i] = $.issuerStore[_did].attributes[cursor];
            unchecked {
                ++i;
                ++cursor;
            }
        }
    }

    /**
     * @notice Gets attribute revisions
     * @param _did Issuer DID
     * @param _anyAttrVersHash Attribute revision hash
     * @param _page Page number
     * @param _pageSize Page size
     * @return items_ Array of attribute revisions
     * @return total_ Total number of attribute revisions
     * @return howMany_ Number of attribute revisions returned in this call
     * @return prev_ Previous cursor position
     * @return next_ Next cursor position
     * @dev This function is private and should only be called internally by other functions within this contract.
     */
    function _getIssuerAttributeRevisions(
        bytes32 _did,
        bytes32 _anyAttrVersHash,
        uint256 _page,
        uint256 _pageSize
    )
        internal
        view
        returns (
            bytes32[] memory items_,
            uint256 total_,
            uint256 howMany_,
            uint256 prev_,
            uint256 next_
        )
    {
        Issuers storage $ = _issuerStorage();
        // retrieve first the did and attrId (firstHash of attribute)
        AttributeMetadata storage attributeMetadata = $.attributeMetadataStore[
            _anyAttrVersHash
        ];
        if (
            $.issuerStore[_did].attributes.length == 0 ||
            _did != attributeMetadata.did
        ) return (items_, total_, howMany_, prev_, next_);

        bytes32[] storage revisionHashes = $
            .issuerStore[attributeMetadata.did]
            .revisionHashes[attributeMetadata.attributeId];

        // retrieve the issuer and the attribute detail
        total_ = revisionHashes.length;
        uint256 cursor;
        (cursor, howMany_, prev_, next_) = LibCommon.getPaginationParameters(
            total_,
            _page,
            _pageSize
        );
        items_ = new bytes32[](howMany_);
        for (uint256 i; i < howMany_; ) {
            items_[i] = revisionHashes[cursor];
            unchecked {
                ++i;
                ++cursor;
            }
        }
    }

    /**
     * @notice Gets latest attribute revision ID
     * @param _did Issuer DID
     * @param _attributeId Attribute identifier
     * @return latestRevisionAttributeId_ Latest attribute revision ID
     */
    function _getLatestRevisionAttributeId(
        bytes32 _did,
        bytes32 _attributeId
    ) internal view returns (bytes32 latestRevisionAttributeId_) {
        Issuers storage $ = _issuerStorage();
        Entity storage entity = $.issuerStore[_did];
        if (
            entity.attributes.length == 0 ||
            $.attributeMetadataStore[_attributeId].did != _did
        ) return latestRevisionAttributeId_;
        bytes32[] storage revisionHashes = entity.revisionHashes[
            $.attributeMetadataStore[_attributeId].attributeId
        ];
        latestRevisionAttributeId_ = revisionHashes[revisionHashes.length - 1];
    }

    /**
     * @notice Gets attribute details by revision
     * @param _did Issuer DID
     * @param _attributeId Attribute identifier
     * @param _revisionId Revision identifier
     * @return attribute_ Attribute details by revision
     */
    function _getRevisionAttribute(
        bytes32 _did,
        bytes32 _attributeId,
        bytes32 _revisionId
    ) internal view returns (Attribute memory attribute_) {
        Issuers storage $ = _issuerStorage();
        Entity storage entity = $.issuerStore[_did];
        if (
            entity.attributes.length == 0 ||
            $.attributeMetadataStore[_attributeId].did != _did
        ) return attribute_;

        // retrieve first the did and attrId (firstHash of attribute)
        AttributeMetadata storage attributeMetadata = $.attributeMetadataStore[
            _revisionId
        ];
        if (attributeMetadata.did != _did) return attribute_;

        // retrieve the issuer and the attribute detail
        attribute_ = _buildAttribute(
            attributeMetadata.did,
            _revisionId,
            entity.revisions[_revisionId],
            attributeMetadata.taoDid,
            attributeMetadata.rootTaoDid,
            attributeMetadata.issuerType
        );
    }

    /**
     * @notice Gets latest attribute revision
     * @param _issuerDid Issuer DID
     * @param _attributeId Attribute identifier
     * @return attribute_ Latest attribute revision
     */
    function _getLatestRevisionAttribute(
        bytes32 _issuerDid,
        bytes32 _attributeId
    ) internal view returns (Attribute memory attribute_) {
        attribute_ = _getRevisionAttribute(
            _issuerDid,
            _attributeId,
            _getLatestRevisionAttributeId(_issuerDid, _attributeId)
        );
    }

    /**
     * @notice Checks if sender is eligible to modify attribute
     * @dev Validates sender permissions and trust chain integrity
     *      OPTIMIZED: Receives storage pointer to avoid redundant SLOAD operations
     * @param $ Storage reference to issuer registry (GAS OPTIMIZATION)
     * @param _did Issuer DID being modified
     * @param _lastRevisionId Last revision ID of the attribute
     * @param _issuerType Type of issuer being created/updated
     * @param _taoDid TAO DID that should authorize this operation
     * @param _lastRevisionIdTao Last revision of TAO's attribute
     */
    function _checkEligibility(
        Issuers storage $,
        bytes32 _did,
        bytes32 _lastRevisionId,
        IssuerType _issuerType,
        bytes32 _taoDid,
        bytes32 _lastRevisionIdTao
    ) internal view {
        address sender = _msgSender();

        // Admin role bypass (consider replacing with policy-based check)
        if (_hasRole(_TRUSTED_ISSUERS_REGISTRY_ROLE, sender)) return;

        // Only admin can create/modify ROOT_TAO
        require(
            _issuerType != IssuerType.ROOT_TAO,
            ITrustedIssuersRegistry.SenderCannotInteractWithRootTao()
        );

        // OPTIMIZATION: Single SLOAD for TAO metadata
        AttributeMetadata memory taoMetadata = $.attributeMetadataStore[
            _lastRevisionIdTao
        ];

        // Validate sender is controller of TAO and TAO has proper type
        require(
            _isController(_taoDid, sender) &&
                (taoMetadata.issuerType == IssuerType.ROOT_TAO ||
                    taoMetadata.issuerType == IssuerType.TAO),
            ITrustedIssuersRegistry.SenderIsNotTaoOrRootTao()
        );

        // OPTIMIZATION: Single SLOAD for attribute metadata
        AttributeMetadata memory attrMetadata = $.attributeMetadataStore[
            _lastRevisionId
        ];

        // Validate trust chain for existing attributes
        if (attrMetadata.did == bytes32(0)) return; // New attributes automatically valid

        // Existing attributes: TAO must be in trust chain
        bool isInTrustChain = attrMetadata.taoDid == _taoDid ||
            attrMetadata.rootTaoDid == _taoDid;

        require(
            isInTrustChain,
            ITrustedIssuersRegistry.SenderIsNotTaoOrRootTaoOf(_did)
        );
    }

    function _initializeAttributeRevisions(
        bytes32 _did,
        bytes32 _revisionId,
        AttributeMetadata storage _attributeMetadata,
        bytes32[] storage _attributes
    )
        private
        returns (
            bytes32 attributeId_,
            bytes32 lastRevisionId_,
            bytes32 newRevisionId_
        )
    {
        if (_attributeMetadata.did == bytes32(0)) {
            _attributes.push(_revisionId);
            return (_revisionId, _revisionId, _revisionId);
        }
        attributeId_ = _attributeMetadata.attributeId;
        lastRevisionId_ = _getLatestRevisionAttributeId(_did, _revisionId);
        newRevisionId_ = sha256(
            abi.encode(_blockTimestamp(), _did, lastRevisionId_)
        );
    }

    /**
     * @notice Resolves TAO hierarchy for attribute validation
     * @dev Determines TAO and root TAO based on issuer type
     * @param $ Storage reference to issuer registry
     * @param _issuerType Type of issuer being created/updated
     * @param _did Issuer DID
     * @param _taoDid Provided TAO DID (ignored for ROOT_TAO)
     * @param _attributeIdTao Attribute ID for TAO validation
     * @return taoInfo Resolved TAO hierarchy information
     */
    function _resolveTaoHierarchy(
        Issuers storage $,
        IssuerType _issuerType,
        bytes32 _did,
        bytes32 _taoDid,
        bytes32 _attributeIdTao
    ) private view returns (TaoHierarchy memory taoInfo) {
        if (_issuerType == IssuerType.ROOT_TAO) {
            // ROOT_TAO is self-referential (top of hierarchy)
            return
                TaoHierarchy({
                    taoDid: _did,
                    rootTaoDid: _did,
                    lastRevisionIdTao: bytes32(0)
                });
        }

        // For TAO/TI, resolve parent TAO
        taoInfo.taoDid = _taoDid;
        taoInfo.lastRevisionIdTao = _getLatestRevisionAttributeId(
            _taoDid,
            _attributeIdTao
        );
        taoInfo.rootTaoDid = $
            .attributeMetadataStore[taoInfo.lastRevisionIdTao]
            .rootTaoDid;
    }

    /**
     * @notice Checks if attribute is owned by another issuer
     * @param _did Issuer DID
     * @param _revisionId Revision ID
     */
    function _checkAttributeOwnedByAnotherIssuer(
        bytes32 _did,
        bytes32 _revisionId
    ) private view {
        bytes32 storedDid = _issuerStorage()
            .attributeMetadataStore[_revisionId]
            .did;
        require(
            storedDid == bytes32(0) ? true : _did == storedDid,
            ITrustedIssuersRegistry.AttributeOwnedByAnotherIssuer()
        );
    }

    /**
     * @notice Validates attribute ID ownership by checking DID association
     * @dev This internal function verifies two conditions:
     *       1. The specified DID exists and has registered attributes
     *       2. The provided attribute ID belongs to that specific DID
     *
     *       Throws IssuerDoesNotExists if the DID has no attributes,
     *       or AttributeHasNotBeenFound if the attribute doesn't belong to the DID.
     * @param _did Issuer's decentralized identifier (DID)
     * @param _attributeId The attribute ID to validate against the DID
     */
    function _checkAttributeId(
        bytes32 _did,
        bytes32 _attributeId
    ) private view {
        Issuers storage $ = _issuerStorage();
        require(
            $.issuerStore[_did].attributes.length > 0,
            ITrustedIssuersRegistry.IssuerDoesNotExists()
        );
        require(
            $.attributeMetadataStore[_attributeId].did == _did,
            ITrustedIssuersRegistry.AttributeHasNotBeenFound()
        );
    }

    /**
     * @notice Accesses issuer storage
     * @dev Returns a reference to the private `Issuers` struct within this contract.
     * @return storage_ The private `Issuers` struct within this contract.
     */
    function _issuerStorage() private pure returns (Issuers storage storage_) {
        bytes32 position = _ISSUER_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
