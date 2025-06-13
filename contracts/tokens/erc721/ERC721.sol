// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC721InternalCommon} from './extensions/ERC721InternalCommon.sol';
import {IERC721Isbe} from './IERC721Isbe.sol';
import {_ERC721_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {IERC721Receiver} from './IERC721Receiver.sol';
import {IERC721} from '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import {
    IERC721Metadata
} from '@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol';

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
    ) public virtual override initializer(_ERC721_RESOLVER_KEY) {
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
    ) public virtual override whenNotPaused {
        address owner = _ownerOf(tokenId);
        require(
            owner == _msgSender() || _isApprovedForAll(owner, _msgSender()),
            IERC721Isbe.CallerNotOwnerNorApproved()
        );
        _approve(to, tokenId);
    }

    /**
     * @notice Approve or remove `operator` as an operator for the caller.
     */
    function setApprovalForAll(
        address operator,
        bool approved
    ) public virtual override {
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
    ) public virtual override whenNotPaused {
        address owner = _ownerOf(tokenId);
        require(owner == from, IERC721Isbe.TransferFromIncorrectOwner());
        require(
            _msgSender() == owner ||
                _getApproved(tokenId) == _msgSender() ||
                _isApprovedForAll(owner, _msgSender()),
            IERC721Isbe.CallerNotOwnerNorApproved()
        );
        _transfer(from, to, tokenId);
    }

    /**
     * @notice Safely transfers `tokenId` token from `from` to `to`.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override whenNotPaused {
        safeTransferFrom(from, to, tokenId, '');
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
        address owner = _ownerOf(tokenId);
        require(owner == from, IERC721Isbe.TransferFromIncorrectOwner());
        require(
            _msgSender() == owner ||
                _getApproved(tokenId) == _msgSender() ||
                _isApprovedForAll(owner, _msgSender()),
            IERC721Isbe.CallerNotOwnerNorApproved()
        );
        _transfer(from, to, tokenId);

        // If recipient is a contract, check that it implements IERC721Receiver
        if (to.code.length > 0) {
            try
                IERC721Receiver(to).onERC721Received(
                    _msgSender(),
                    from,
                    tokenId,
                    data
                )
            returns (bytes4 retval) {
                require(
                    retval == IERC721Receiver.onERC721Received.selector,
                    IERC721Isbe.TransferToNonERC721ReceiverImplementer()
                );
            } catch {
                revert IERC721Isbe.TransferToNonERC721ReceiverImplementer();
            }
        }
    }

    /**
     * @notice Returns true if this contract implements the interface defined by `interfaceId`.
     * @dev Required by IERC165.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId || // 0x80ac58cd
            interfaceId == type(IERC721Metadata).interfaceId || // 0x5b5e139f
            interfaceId == type(IERC721Isbe).interfaceId;
    }

    /**
     * @notice Returns the URI for `tokenId` token.
     * @dev Compliant with ERC721Metadata.
     */
    function tokenURI(
        uint256 /*tokenId*/
    ) public view virtual override returns (string memory) {
        return _baseURI();
    }

    /**
     * @notice Returns the name of the token.
     */
    function name() public view virtual override returns (string memory) {
        return _name();
    }

    /**
     * @notice Returns the symbol of the token.
     */
    function symbol() public view virtual override returns (string memory) {
        return _symbol();
    }

    /**
     * @notice Returns the owner of the `tokenId` token.
     */
    function ownerOf(
        uint256 tokenId
    ) public view virtual override returns (address) {
        return _ownerOf(tokenId);
    }

    /**
     * @notice Returns the number of tokens owned by `owner`.
     */
    function balanceOf(
        address owner
    ) public view virtual override returns (uint256) {
        return _balanceOf(owner);
    }

    /**
     * @notice Returns the total number of tokens in existence.
     */
    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply();
    }

    /**
     * @notice Returns the account approved for `tokenId` token.
     */
    function getApproved(
        uint256 tokenId
    ) public view virtual override returns (address) {
        return _getApproved(tokenId);
    }

    /**
     * @notice Returns if the `operator` is allowed to manage all of the assets of `owner`.
     */
    function isApprovedForAll(
        address owner,
        address operator
    ) public view virtual override returns (bool) {
        return _isApprovedForAll(owner, operator);
    }

    /**
     * @notice Returns the base URI for token metadata.
     * @dev Optional internal function to build tokenURI.
     */
    function _baseURI() internal view virtual returns (string memory) {
        return '';
    }
}
