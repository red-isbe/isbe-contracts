// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC721Isbe} from './IERC721Isbe.sol';
import {_ERC721_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {IERC721} from '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import {IERC721Metadata} from '@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol';
import {ERC721InternalCommon} from './extensions/ERC721InternalCommon.sol';

contract ERC721 is IERC721Isbe, ERC721InternalCommon {
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
    ) external override initializer(_ERC721_RESOLVER_KEY) {
        _initialize(newName, newSymbol);
        emit Erc721Initialized(newName, newSymbol);
    }

    /**
     * @notice Approves `to` to transfer `tokenId` token.
     * @dev Only the owner or an approved operator can call this function.
     */
    function approve(address to, uint256 tokenId) external override {
        _checkOwnerForApprove(_ownerOf(tokenId), tokenId);

        _approve(to, tokenId);
    }

    /**
     * @notice Approve or remove `operator` as an operator for the caller.
     */
    function setApprovalForAll(
        address operator,
        bool approved
    ) external override {
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
    ) external override {
        address owner = _ownerOf(tokenId);
        _checkOwnerForApprove(owner, tokenId);
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
     * @notice Returns the total number of tokens in existence.
     */
    function totalSupply() external view returns (uint256) {
        return _totalSupply();
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
     * @notice Returns true if this contract implements the interface defined by `interfaceId`.
     * @dev Required by IERC165.
     */
    // solhint-disable no-empty-blocks
    function supportsInterface(
        bytes4 interfaceId
    ) external pure override returns (bool) {}

    /**
     * @notice Safely transfers `tokenId` token from `from` to `to` with additional data.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public virtual override {
        _safeTransferFrom(from, to, tokenId, data);
    }

    /**
     * @notice Safely transfers `tokenId` token from `from` to `to`.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
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

    /**
     * @notice Checks if the caller is the owner or an approved operator for the given owner.
     * @dev Reverts with CallerNotOwnerNorApproved if the caller is neither the owner nor an approved operator.
     * @param _owner The address of the token owner to check against the caller.
     */
    function _checkOwnerForApprove(
        address _owner,
        uint256 tokenId
    ) private view {
        require(
            _owner == _msgSender() ||
                _getApproved(tokenId) == _msgSender() ||
                _isApprovedForAll(_owner, _msgSender()),
            IERC721Isbe.CallerNotOwnerNorApproved()
        );
    }
}
