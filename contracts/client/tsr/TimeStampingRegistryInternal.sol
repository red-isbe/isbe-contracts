// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    ITimeStampingRegistry,
    TsrData,
    SignedTsrData,
    _buildTsrData
} from './ITimeStampingRegistry.sol';
import {
    _CONTRACT_NAME_TIME_STAMPING_REGISTRY,
    _CONTRACT_VERSION_TIME_STAMPING_REGISTRY
} from '../../constants/values.sol';
import {
    _getMessageHashStampTsr,
    _verifySignature,
    _checkNonceAndDeadline,
    InvalidSignature
} from '../../core/signatureVerification.sol';
import {Common} from '../../core/Common.sol';
import {EnumerableSet} from '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import {LibCommon} from '../../core/LibCommon.sol';
import {_TIMESTAMPING_REGISTRY_STORAGE_POSITION} from '../../constants/storagePositions.sol';

/// @title TimeStampingRegistryInternal
/// @notice Internal logic for timestamping registry operations with originalHash as primary key
/// @dev Provides core functionality for TSR operations including optimized storage management,
///      signature verification, and data retrieval. Uses originalHash as primary key for efficient queries.
///      Enforces uniqueness on all three hash fields: originalHash, tsaHash, externalReferenceId.
/// @author ISBE Team
/// @custom:security-level 3
/// @custom:auditor ISBE Security Team
abstract contract TimeStampingRegistryInternal is Common {
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using LibCommon for EnumerableSet.Bytes32Set;

    /// @notice Storage structure for timestamping registry data optimized for originalHash queries
    /// @dev Contains all the mappings and sets needed for TSR operations with triple uniqueness enforcement
    struct TimestampingRegistryStorage {
        /// @notice Set of all original hashes for efficient enumeration and pagination
        EnumerableSet.Bytes32Set originalHashes;
        /// @notice Mapping from original hash (primary key) to complete TSR record
        mapping(bytes32 originalHash => TsrRecord record) records;
        /// @notice Reverse mapping from TSA hash to original hash for uniqueness enforcement
        mapping(bytes32 tsaHash => bytes32 originalHash) tsaHashToOriginal;
        /// @notice Reverse mapping from external reference ID to original hash for uniqueness enforcement
        mapping(bytes32 externalReferenceId => bytes32 originalHash) externalRefToOriginal;
        /// @notice Mapping from sender address to nonce for replay protection
        mapping(address sender => uint256 nonce) nonces;
    }

    /// @notice Individual timestamp record structure with complete TSR data
    /// @dev Contains all information about a stamped hash set with role tracking
    struct TsrRecord {
        /// @notice The complete TSR data (originalHash, tsaHash, externalReferenceId)
        TsrData data;
        /// @notice The timestamp when the hashes were stamped
        uint256 timestamp;
        /// @notice The address of the authority that performed the stamping (msg.sender)
        address authority;
        /// @notice The address that requested the stamping
        ///          (msg.sender in stamp, SignedTsrData.sender in stampWithSignature)
        address requester;
    }

    /// @notice Modifier to validate that provided original hash doesn't exist
    /// @dev Reverts if the original hash already exists in the registry
    /// @param _originalHash The original hash to check
    modifier onlyNonExistentOriginalHash(bytes32 _originalHash) {
        _checkOriginalHash(_originalHash);
        _;
    }

    /// @notice Modifier to validate that provided TSA hash doesn't exist
    /// @dev Reverts if the TSA hash already exists in the registry
    /// @param _tsaHash The TSA hash to check
    modifier onlyNonExistentTsaHash(bytes32 _tsaHash) {
        _checkTsaHash(_tsaHash);
        _;
    }

    /// @notice Modifier to validate that provided external reference ID doesn't exist
    /// @dev Reverts if the external reference ID already exists in the registry
    /// @param _externalReferenceId The external reference ID to check
    modifier onlyNonExistentExternalReferenceId(bytes32 _externalReferenceId) {
        _checkExternalReferenceId(_externalReferenceId);
        _;
    }

    /// @notice Internal function to stamp a complete hash set with role tracking
    /// @dev Creates a new timestamp record and updates all relevant storage structures with triple uniqueness
    /// @param _originalHash The original hash (primary key)
    /// @param _tsaHash The TSA hash to be stamped
    /// @param _externalReferenceId The external reference ID associated with the hashes
    /// @param _authority The address of the authority performing the stamp (msg.sender)
    /// @param _requester The address requesting the stamping (msg.sender or SignedTsrData.sender)
    function _stamp(
        bytes32 _originalHash,
        bytes32 _tsaHash,
        bytes32 _externalReferenceId,
        address _authority,
        address _requester
    ) internal {
        uint256 timestamp = _blockTimestamp();
        TimestampingRegistryStorage storage $ = _timestampingRegistryStorage();

        // Add original hash to enumerable set for pagination
        $.originalHashes.add(_originalHash);

        // Create complete record
        TsrData memory tsrData = _buildTsrData(
            _originalHash,
            _tsaHash,
            _externalReferenceId
        );
        $.records[_originalHash] = TsrRecord({
            data: tsrData,
            timestamp: timestamp,
            authority: _authority,
            requester: _requester
        });

        // Set up reverse mappings for uniqueness enforcement
        $.tsaHashToOriginal[_tsaHash] = _originalHash;
        $.externalRefToOriginal[_externalReferenceId] = _originalHash;
    }

    /// @notice Internal function to stamp TSR data with signature verification
    /// @dev Validates signature and nonce before stamping, then increments nonce
    /// @param _tsrData The signed TSR data to be stamped
    /// @param _signature The signature to verify
    function _stampWithSignature(
        SignedTsrData calldata _tsrData,
        bytes calldata _signature
    ) internal {
        _checkStampSignature(_tsrData, _signature);
        _stamp(
            _tsrData.tsrData.originalHash,
            _tsrData.tsrData.tsaHash,
            _tsrData.tsrData.externalReferenceId,
            _msgSender(),
            _tsrData.sender
        );
        _timestampingRegistryStorage().nonces[_tsrData.sender] = _tsrData.nonce;
    }

    /// @notice Internal function to check if an original hash is registered
    /// @dev Returns true if the original hash exists in the original hashes set
    /// @param _originalHash The original hash to check
    /// @return exists_ True if the original hash is registered, false otherwise
    function _isOriginalHashRegistered(
        bytes32 _originalHash
    ) internal view returns (bool exists_) {
        return
            _timestampingRegistryStorage().originalHashes.contains(
                _originalHash
            );
    }

    /// @notice Internal function to check if a TSA hash is registered
    /// @dev Returns true if the TSA hash exists in the reverse mapping
    /// @param _tsaHash The TSA hash to check
    /// @return exists_ True if the TSA hash is registered, false otherwise
    function _isTsaHashRegistered(
        bytes32 _tsaHash
    ) internal view returns (bool exists_) {
        return
            _timestampingRegistryStorage().tsaHashToOriginal[_tsaHash] !=
            bytes32(0);
    }

    /// @notice Internal function to get complete TSR record for a given original hash
    /// @dev Returns the TSR data along with authority and requester information
    /// @param _originalHash The original hash to query (primary key)
    /// @return tsrData The TSR data associated with the hash
    /// @return authority The address that stamped the hash
    /// @return requester The address that requested the stamping
    function _getTsrRecordFromOriginalHash(
        bytes32 _originalHash
    )
        internal
        view
        returns (TsrData memory tsrData, address authority, address requester)
    {
        TsrRecord memory record = _timestampingRegistryStorage().records[
            _originalHash
        ];
        return (record.data, record.authority, record.requester);
    }

    /// @notice Internal function to check if an external reference ID is registered
    /// @dev Returns true if the external reference ID exists in the reverse mapping
    /// @param _externalReferenceId The external reference ID to check
    /// @return exists_ True if the external reference ID is registered, false otherwise
    function _isExternalReferenceIdRegistered(
        bytes32 _externalReferenceId
    ) internal view returns (bool exists_) {
        return
            _timestampingRegistryStorage().externalRefToOriginal[
                _externalReferenceId
            ] != bytes32(0);
    }

    /// @notice Internal function to get the total number of stamped entries
    /// @dev Returns the length of the original hashes enumerable set
    /// @return size_ The total number of stamped entries
    function _getStampedSize() internal view returns (uint256 size_) {
        return _timestampingRegistryStorage().originalHashes.length();
    }

    /// @notice Internal function to get paginated list of stamped TSR data
    /// @dev Uses LibCommon for pagination calculations and returns TSR data array based on originalHash enumeration
    /// @param _pageSize The number of items to retrieve per page
    /// @param _pageIndex The index of the page to retrieve (1-based)
    /// @return datas_ An array of TSR data for the specified page
    function _getPaginatedStamped(
        uint256 _pageSize,
        uint256 _pageIndex
    ) internal view returns (TsrData[] memory datas_) {
        TimestampingRegistryStorage storage $ = _timestampingRegistryStorage();
        (uint256 cursor, uint256 howMany, , ) = LibCommon
            .getPaginationParameters(
                $.originalHashes.length(),
                _pageIndex,
                _pageSize
            );

        datas_ = new TsrData[](howMany);
        for (uint256 i; i < howMany; ) {
            bytes32 originalHash = $.originalHashes.at(cursor);
            datas_[i] = $.records[originalHash].data;
            unchecked {
                ++i;
                ++cursor;
            }
        }
    }

    /// @notice Internal function to validate that an original hash doesn't exist
    /// @dev Reverts with HashAlreadyExists error if the hash is already registered
    /// @param _originalHash The original hash to check
    function _checkOriginalHash(bytes32 _originalHash) internal view {
        require(
            !_isOriginalHashRegistered(_originalHash),
            ITimeStampingRegistry.HashAlreadyExists(_originalHash)
        );
    }

    /// @notice Internal function to validate that a TSA hash doesn't exist
    /// @dev Reverts with HashAlreadyExists error if the hash is already registered
    /// @param _tsaHash The TSA hash to check
    function _checkTsaHash(bytes32 _tsaHash) internal view {
        require(
            !_isTsaHashRegistered(_tsaHash),
            ITimeStampingRegistry.HashAlreadyExists(_tsaHash)
        );
    }

    /// @notice Internal function to validate that an external reference ID doesn't exist
    /// @dev Reverts with ExternalReferenceIdAlreadyExists error if the ID is already registered
    /// @param _externalReferenceId The external reference ID to check
    function _checkExternalReferenceId(
        bytes32 _externalReferenceId
    ) internal view {
        require(
            !_isExternalReferenceIdRegistered(_externalReferenceId),
            ITimeStampingRegistry.ExternalReferenceIdAlreadyExists(
                _externalReferenceId
            )
        );
    }

    /// @notice Internal function to validate stamp signature and nonce
    /// @dev Checks nonce, deadline, and signature validity for stamping operations
    /// @param _tsrData The signed TSR data to validate
    /// @param _signature The signature to verify
    function _checkStampSignature(
        SignedTsrData calldata _tsrData,
        bytes calldata _signature
    ) internal view {
        _checkNonceAndDeadline(
            _tsrData.nonce,
            _tsrData.sender,
            _timestampingRegistryStorage().nonces[_tsrData.sender],
            _tsrData.expirationTimestamp,
            _blockTimestamp()
        );
        require(
            _isStampSignatureValid(_tsrData, _signature),
            InvalidSignature(_tsrData.sender)
        );
    }

    /// @notice Internal function to validate stamp signature
    /// @dev Creates message hash and verifies EIP712 signature
    /// @param _tsrData The signed TSR data to validate
    /// @param _signature The signature to verify
    /// @return isValid_ True if the signature is valid, false otherwise
    function _isStampSignatureValid(
        SignedTsrData calldata _tsrData,
        bytes calldata _signature
    ) internal view returns (bool isValid_) {
        bytes32 messageHash = _getMessageHashStampTsr(
            _tsrData.tsrData.originalHash,
            _tsrData.tsrData.tsaHash,
            _tsrData.tsrData.externalReferenceId,
            _tsrData.sender,
            _tsrData.expirationTimestamp,
            _tsrData.nonce
        );
        isValid_ = _verifySignature(
            _tsrData.sender,
            messageHash,
            _signature,
            _CONTRACT_NAME_TIME_STAMPING_REGISTRY,
            _CONTRACT_VERSION_TIME_STAMPING_REGISTRY,
            _blockChainId(),
            address(this)
        );
    }

    /// @notice Returns the storage slot for timestamping registry
    /// @dev Uses inline assembly to return storage struct at predefined slot
    /// @return storage_ The timestamping registry storage struct
    function _timestampingRegistryStorage()
        private
        pure
        returns (TimestampingRegistryStorage storage storage_)
    {
        bytes32 position = _TIMESTAMPING_REGISTRY_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
