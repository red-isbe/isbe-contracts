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
