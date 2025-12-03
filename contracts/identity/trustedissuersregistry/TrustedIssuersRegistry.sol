// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {TrustedIssuersRegistryInternal} from './TrustedIssuersRegistryInternal.sol';
import {ITrustedIssuersRegistry} from './ITrustedIssuersRegistry.sol';
import {IssuerType, Attribute, TaoHierarchy} from './Types.sol';
import {_TRUSTED_ISSUERS_REGISTRY_RESOLVER_KEY} from '../../constants/resolverKeys.sol';

abstract contract TrustedIssuersRegistry is
    TrustedIssuersRegistryInternal,
    ITrustedIssuersRegistry
{
    constructor() {
        _disableInitializers(_TRUSTED_ISSUERS_REGISTRY_RESOLVER_KEY);
    }

    function setAttributeMetadata(
        bytes32 _did,
        IssuerType _issuerType,
        bytes32 _revisionId,
        bytes32 _taoDid,
        bytes32 _attributeIdTao
    )
        external
        override
        whenNotPaused
        onlyControllerOrAuth(_did)
        onlyValidIssuerType(_issuerType)
        bytes32IsNotZero(_revisionId)
        onlyBySameIssuer(_did, _revisionId)
    {
        (
            bytes32 attributeId,
            bytes32 newRevisionId,
            TaoHierarchy memory taoHierarchy
        ) = _setAttributeMetadata(
                _did,
                _issuerType,
                _revisionId,
                _taoDid,
                _attributeIdTao
            );
        emit AttributeMetadataSet(
            _did,
            _issuerType,
            _revisionId,
            taoHierarchy.taoDid,
            _attributeIdTao,
            attributeId,
            newRevisionId,
            taoHierarchy.rootTaoDid
        );
    }

    function setAttributeData(
        bytes32 _did,
        bytes32 _attributeId,
        bytes calldata _attributeData
    )
        external
        override
        whenNotPaused
        onlyControllerOrAuth(_did)
        bytes32IsNotZero(_attributeId)
        onlyValidAttributeId(_did, _attributeId)
        emptyBytes(_attributeData)
    {
        _setAttributeData(_did, _attributeId, _attributeData);
        emit AttributeDataSet(_did, _attributeId, _attributeData);
    }

    function getIssuer(
        bytes32 _did
    )
        external
        view
        override
        returns (bool noAttributesAccepted_, uint256 totalAttributes_)
    {
        return _getIssuer(_did);
    }

    function getIssuers(
        uint256 _page,
        uint256 _pageSize
    )
        external
        view
        override
        returns (
            bytes32[] memory items_,
            uint256 total_,
            uint256 howMany_,
            uint256 prev_,
            uint256 next_
        )
    {
        return _getIssuers(_page, _pageSize);
    }

    function getIssuerAttributes(
        bytes32 _did,
        uint256 _page,
        uint256 _pageSize
    )
        external
        view
        override
        returns (
            bytes32[] memory items_,
            uint256 total_,
            uint256 howMany_,
            uint256 prev_,
            uint256 next_
        )
    {
        return _getIssuerAttributes(_did, _page, _pageSize);
    }

    function getIssuerAttributeRevisions(
        bytes32 _did,
        bytes32 _anyAttrVersHash,
        uint256 _page,
        uint256 _pageSize
    )
        external
        view
        override
        returns (
            bytes32[] memory items_,
            uint256 total_,
            uint256 howMany_,
            uint256 prev_,
            uint256 next_
        )
    {
        return
            _getIssuerAttributeRevisions(
                _did,
                _anyAttrVersHash,
                _page,
                _pageSize
            );
    }

    function getLatestRevisionAttributeId(
        bytes32 _did,
        bytes32 _attributeId
    ) external view override returns (bytes32 latestRevisionAttributeId_) {
        return _getLatestRevisionAttributeId(_did, _attributeId);
    }

    function getRevisionAttribute(
        bytes32 _did,
        bytes32 _attributeId,
        bytes32 _revisionId
    ) external view override returns (Attribute memory attribute_) {
        return _getRevisionAttribute(_did, _attributeId, _revisionId);
    }

    function getLatestRevisionAttribute(
        bytes32 _issuerDid,
        bytes32 _attributeId
    ) external view override returns (Attribute memory attribute_) {
        return _getLatestRevisionAttribute(_issuerDid, _attributeId);
    }
}
