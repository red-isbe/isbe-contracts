// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IOwnable} from './IOwnable.sol';
import {Common} from '../../core/Common.sol';
import {_OWNABLE_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {_OWNABLE_FACET_VERSION} from '../../constants/facetVersions.sol';

/// @title Ownable
/// @notice Implements ownership mechanisms
/// @dev Inherits from IOwnable and OwnableInternal
abstract contract OwnableBase is IOwnable, Common {
    /// @notice Constructor that disables the initializer

    constructor() {
        _disableInitializers(_OWNABLE_RESOLVER_KEY);
    }

    /// @notice Initializes the ownership contract
    /// @param _admin The initial owner address
    function initializeOwnable(
        address _admin
    )
        external
        initializer(_OWNABLE_RESOLVER_KEY, _OWNABLE_FACET_VERSION)
        addressIsNotZero(_admin)
    {
        _transferOwnership(_admin);
        emit OwnershipTransferred(_msgSender(), _admin);
    }

    /// @notice Allows the owner to renounce their ownership
    function renounceOwnership() external override onlyOwner whenNotPaused {
        _transferOwnership(address(0));
        emit OwnershipRenounced(_msgSender());
    }

    /// @notice Returns the current owner address
    /// @return The address of the current owner
    function owner() external view override returns (address) {
        return _owner();
    }

    /// @notice Returns the interfaces implemented by this contract
    /// @return interfaces_ Array of interface IDs
    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IOwnable).interfaceId;
    }
}
