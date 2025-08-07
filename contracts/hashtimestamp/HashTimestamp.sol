// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IHashTimestamp} from './IHashTimestamp.sol';
import {HashTimestampInternal} from './HashTimestampInternal.sol';
import {_HASH_TIMESTAMP_ROLE} from '../constants/roles.sol';

/// @title HashTimestamp
/// @notice Implements timestamp for hashes
/// @dev Inherits from IHashTimestamp and HashTimestampInternal, providing external timestamp hashes functions
abstract contract HashTimestamp is IHashTimestamp, HashTimestampInternal {
    function timestampHash(
        bytes32 _hash
    )
        external
        override
        onlyNonExistentHash(_hash)
        whenNotPaused
        onlyRole(_HASH_TIMESTAMP_ROLE)
    {
        _timestampHash(_hash);
    }

    function exists(bytes32 _hash) external view override returns (bool) {
        return _exists(_hash);
    }

    function getTimestamp(
        bytes32 _hash
    ) external view override returns (uint256) {
        return _getTimestamp(_hash);
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IHashTimestamp).interfaceId;
    }
}
