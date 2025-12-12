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

/**
 * @title ERC721
 * @notice Abstract contract implementing the ERC721 standard for use in diamond/facet architectures.
 * @dev Exposes ERC721 external interface, including metadata, approvals, and safe transfers.
 *      - Designed to be inherited by facets that register selectors in a diamond.
 *      - Handles initialization, approvals, transfers, and metadata queries.
 *      - Uses a custom initializer for upgradeable compatibility.
 *      - Implements ERC721, ERC721Metadata, and custom IERC721Isbe interfaces.
 */

import {IERC721Isbe} from './IERC721Isbe.sol';
import {_ERC721_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {IERC721} from '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import {IERC721Metadata} from '@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol';
import {ERC721InternalCommon} from './extensions/ERC721InternalCommon.sol';
import {_ERC721_FACET_VERSION} from '../../constants/facetVersions.sol';

abstract contract ERC721 is IERC721Isbe, ERC721InternalCommon {
    /// @notice Constructor disables initializers by default for the diamond pattern
    constructor() {
        _disableInitializers(_ERC721_RESOLVER_KEY);
    }

    /**
     * @notice Initializes the ERC721 token with a name and symbol.
     * @param newName The name of the token.
     * @param newSymbol The symbol of the token.
     */
    function initializeErc721(
        string memory newName,
        string memory newSymbol
    )
        external
        override
        initializer(_ERC721_RESOLVER_KEY, _ERC721_FACET_VERSION)
    {
        _initialize(newName, newSymbol);
        emit Erc721Initialized(newName, newSymbol);
    }

    /**
     * @notice Approves `to` to transfer `tokenId` token.
     * @dev Only the owner or an approved operator can call this function.
     */
    function approve(
        address to,
        uint256 tokenId
    )
        external
        override
        whenNotPaused
        onlyApprovedOrOwner(_msgSender(), _ownerOf(tokenId), tokenId)
    {
        _approve(to, tokenId);
    }

    /**
     * @notice Approve or remove `operator` as an operator for the caller.
     */
    function setApprovalForAll(
        address operator,
        bool approved
    ) external override whenNotPaused {
        _setApprovalForAll(_msgSender(), operator, approved);
    }

    /**
     * @notice Transfers `tokenId` token from `from` to `to`.
     * @dev The caller must be owner, approved, or operator.
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    )
        external
        override
        whenNotPaused
        onlyApprovedOrOwner(_msgSender(), from, tokenId)
    {
        _transfer(from, to, tokenId);
    }

    /**
     * @notice Returns the URI for `tokenId` token.
     * @dev Compliant with ERC721Metadata.
     */
    function tokenURI(
        uint256 /*tokenId*/
    ) external view override returns (string memory) {
        return _baseURI();
    }

    /**
     * @notice Returns the name of the token.
     */
    function name() external view override returns (string memory) {
        return _name();
    }

    /**
     * @notice Returns the symbol of the token.
     */
    function symbol() external view override returns (string memory) {
        return _symbol();
    }

    /**
     * @notice Returns the owner of the `tokenId` token.
     */
    function ownerOf(
        uint256 tokenId
    ) external view virtual override returns (address) {
        return _ownerOf(tokenId);
    }

    /**
     * @notice Returns the number of tokens owned by `owner`.
     */
    function balanceOf(address owner) external view override returns (uint256) {
        return _balanceOf(owner);
    }

    /**
     * @notice Returns the account approved for `tokenId` token.
     */
    function getApproved(
        uint256 tokenId
    ) external view override returns (address) {
        return _getApproved(tokenId);
    }

    /**
     * @notice Returns if the `operator` is allowed to manage all of the assets of `owner`.
     */
    function isApprovedForAll(
        address owner,
        address operator
    ) external view override returns (bool) {
        return _isApprovedForAll(owner, operator);
    }

    /**
     * @notice Safely transfers `tokenId` token from `from` to `to` with additional data.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public virtual override whenNotPaused {
        _safeTransferFrom(from, to, tokenId, data);
    }

    /**
     * @notice Safely transfers `tokenId` token from `from` to `to`.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override whenNotPaused {
        _safeTransferFrom(from, to, tokenId, '');
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 3;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IERC721Isbe).interfaceId;
        interfaces_[--interfacesLength] = type(IERC721).interfaceId;
        interfaces_[--interfacesLength] = type(IERC721Metadata).interfaceId;
    }
}
