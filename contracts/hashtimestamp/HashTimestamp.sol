// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IHashTimestamp} from './IHashTimestamp.sol';
import {HashTimestampInternal} from './HashTimestampInternal.sol';
import {_HASH_TIMESTAMP_ROLE} from '../constants/roles.sol';
import {ERC165} from '../core/ERC165.sol';

/// @title HashTimestamp
/// @notice Implements timestamp for hashes
/// @dev Inherits from IHashTimestamp and HashTimestampInternal, providing external timestamp hashes functions
abstract contract HashTimestamp is
    IHashTimestamp,
    ERC165,
    HashTimestampInternal
{
    function timestampHash(
        bytes32 hash
    )
        external
        override
        onlyNonExistentHash(hash)
        whenNotPaused
        onlyRole(_HASH_TIMESTAMP_ROLE)
    {
        _timestampHash(hash);
    }

    function exists(bytes32 hash) external view override returns (bool) {
        return _exists(hash);
    }

    function getTimestamp(
        bytes32 hash
    ) external view override returns (uint256) {
        return _getTimestamp(hash);
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
