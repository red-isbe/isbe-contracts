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

import {ERC721InternalCommon} from '../ERC721InternalCommon.sol';
import {_ERC721_CAPPED_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {IERC721Capped} from './IERC721Capped.sol';
import {_CAP_ROLE, _MINTER_ROLE} from '../../../../constants/roles.sol';
import {_ERC721_CAPPED_FACET_VERSION} from '../../../../constants/facetVersions.sol';

/**
 * @title ERC721Capped
 * @notice Implements capped mechanism for ERC721 tokens.
 * @dev Inherits from IERC721Capped and ERC721CappedInternal.
 *      This contract provides external functions to initialize and update the cap,
 *      as well as minting with cap validation.
 */
abstract contract ERC721Capped is IERC721Capped, ERC721InternalCommon {
    constructor() {
        _disableInitializers(_ERC721_CAPPED_RESOLVER_KEY);
    }

    /**
     * @notice Initializes the maximum supply cap for the token.
     * @dev This function is expected to be called once to set the total supply cap.
     *      Emits a `CapSet` event if successful.
     * @param newCap The desired maximum token supply cap.
     */
    function initializeCap(
        uint256 newCap
    )
        external
        initializer(_ERC721_CAPPED_RESOLVER_KEY, _ERC721_CAPPED_FACET_VERSION)
    {
        _checkUintIsNotZero(newCap);
        _setCap(newCap);
        emit CapSet(_msgSender(), newCap);
    }

    /**
     * @notice Mints a new token, enforcing the cap.
     * @dev Only for demonstration; in production, add access control (e.g., onlyOwner or roles).
     * @param to The address to mint the token to.
     * @param tokenId The unique identifier for the token.
     */
    function mint(
        address to,
        uint256 tokenId
    ) external whenNotPaused onlyRole(_MINTER_ROLE) {
        _mint(to, tokenId);
    }

    /**
     * @notice Updates the cap value.
     * @dev Only for demonstration; in production, add access control (e.g., onlyRole).
     *      Emits a `CapSet` event if successful.
     * @param newCap The new cap value.
     */
    function setCap(
        uint256 newCap
    ) external checkValidNewCap(newCap) whenNotPaused onlyRole(_CAP_ROLE) {
        _checkUintIsNotZero(newCap);
        _setCap(newCap);
        emit CapSet(_msgSender(), newCap);
    }

    /**
     * @notice Returns the current cap value.
     */
    function cap() external view returns (uint256) {
        return _cap();
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
        interfaces_[--interfacesLength] = type(IERC721Capped).interfaceId;
    }
}
