// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    ITimeStampingRegistry,
    SignedTsrData,
    TsrData
} from './ITimeStampingRegistry.sol';
import {TimeStampingRegistryInternal} from './TimeStampingRegistryInternal.sol';
import {_TIMESTAMPING_REGISTRY_ROLE} from '../../constants/roles.sol';

/// @title TimeStampingRegistry
/// @notice Abstract contract implementing timestamping registry with EIP712 support and originalHash as primary key
/// @dev Provides external interface for TSR operations including hash stamping,
///      signature-based operations, and data retrieval. Extends TimeStampingRegistryInternal
///      and implements ITimeStampingRegistry interface with optimized storage for originalHash queries
/// @author ISBE Team
/// @custom:security-level 3
/// @custom:auditor ISBE Security Team
abstract contract TimeStampingRegistry is
    ITimeStampingRegistry,
    TimeStampingRegistryInternal
{
    /// @notice Stamp the provided hash set with direct method
    /// @dev Creates a new timestamp record with role-based access control (authority = requester = msg.sender)
    /// @param _originalHash The original hash to be stamped (primary key)
    /// @param _tsaHash The TimeStamping Authority response hash
    /// @param _externalReferenceId The external reference ID associated with the hashes
    function stamp(
        bytes32 _originalHash,
        bytes32 _tsaHash,
        bytes32 _externalReferenceId
    )
        external
        override
        bytes32IsNotZero(_originalHash)
        bytes32IsNotZero(_tsaHash)
        bytes32IsNotZero(_externalReferenceId)
        onlyNonExistentOriginalHash(_originalHash)
        onlyNonExistentTsaHash(_tsaHash)
        onlyNonExistentExternalReferenceId(_externalReferenceId)
        whenNotPaused
        onlyRole(_TIMESTAMPING_REGISTRY_ROLE)
    {
        _stamp(
            _originalHash,
            _tsaHash,
            _externalReferenceId,
            msg.sender,
            msg.sender
        );
        emit Stamped(_originalHash, _tsaHash, _externalReferenceId);
    }

    /// @notice Stamp the provided TSR data with a signature
    /// @dev Creates a new timestamp record using EIP712 signature verification
    ///      (authority = msg.sender, requester = SignedTsrData.sender)
    /// @param _tsrData The TimeStamping Registry data to be stamped
    /// @param _signature The signature associated with the TSR data
    function stampWithSignature(
        SignedTsrData calldata _tsrData,
        bytes calldata _signature
    )
        external
        override
        bytes32IsNotZero(_tsrData.tsrData.originalHash)
        bytes32IsNotZero(_tsrData.tsrData.tsaHash)
        bytes32IsNotZero(_tsrData.tsrData.externalReferenceId)
        onlyNonExistentOriginalHash(_tsrData.tsrData.originalHash)
        onlyNonExistentTsaHash(_tsrData.tsrData.tsaHash)
        onlyNonExistentExternalReferenceId(_tsrData.tsrData.externalReferenceId)
        whenNotPaused
        onlyRole(_TIMESTAMPING_REGISTRY_ROLE)
    {
        _stampWithSignature(_tsrData, _signature);
        emit Stamped(
            _tsrData.tsrData.originalHash,
            _tsrData.tsrData.tsaHash,
            _tsrData.tsrData.externalReferenceId
        );
    }

    /// @notice Check if an original hash is registered
    /// @dev Returns true if the original hash exists in the registry
    /// @param _originalHash The original hash to check
    /// @return exists_ A boolean indicating whether the original hash is registered
    function isOriginalHashRegistered(
        bytes32 _originalHash
    ) external view override returns (bool exists_) {
        return _isOriginalHashRegistered(_originalHash);
    }

    /// @notice Check if a TSA hash is registered
    /// @dev Returns true if the TSA hash exists in the registry
    /// @param _tsaHash The TimeStamping Authority hash to check
    /// @return exists_ A boolean indicating whether the TSA hash is registered
    function isTsaHashRegistered(
        bytes32 _tsaHash
    ) external view override returns (bool exists_) {
        return _isTsaHashRegistered(_tsaHash);
    }

    /// @notice Get the complete TSR record for a given original hash
    /// @dev Returns the TSR data along with authority and requester information
    /// @param _originalHash The original hash to query (primary key)
    /// @return tsrData The TSR data associated with the hash
    /// @return authority The address that stamped the hash
    /// @return requester The address that requested the stamping
    function getTsrRecordFromOriginalHash(
        bytes32 _originalHash
    )
        external
        view
        override
        returns (TsrData memory tsrData, address authority, address requester)
    {
        return _getTsrRecordFromOriginalHash(_originalHash);
    }

    /// @notice Check if an external reference ID is registered
    /// @dev Returns true if the external reference ID exists in the registry
    /// @param _externalReferenceId The external reference ID to check
    /// @return exists_ A boolean indicating whether the external reference ID is registered
    function isExternalReferenceIdRegistered(
        bytes32 _externalReferenceId
    ) external view override returns (bool exists_) {
        return _isExternalReferenceIdRegistered(_externalReferenceId);
    }

    /// @notice Get the total number of stamped entries
    /// @dev Returns the size of the stamped data registry
    /// @return size_ The total number of stamped entries
    function getStampedSize() external view override returns (uint256 size_) {
        return _getStampedSize();
    }

    /// @notice Get a paginated list of stamped TSR data
    /// @dev Returns TSR data for the specified page with pagination support
    /// @param _pageSize The number of items to retrieve per page
    /// @param _pageIndex The index of the page to retrieve (0-based)
    /// @return datas_ An array of TimeStamping Registry data on the specified page
    function getPaginatedStamped(
        uint256 _pageSize,
        uint256 _pageIndex
    ) external view override returns (TsrData[] memory datas_) {
        return _getPaginatedStamped(_pageSize, _pageIndex);
    }

    /// @notice Returns the implemented interfaces
    /// @return interfaces_ Array of supported interface IDs
    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(ITimeStampingRegistry)
            .interfaceId;
    }
}
