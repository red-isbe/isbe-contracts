// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Common} from '../../core/Common.sol';
import {IERC721Isbe} from './IERC721Isbe.sol';
import {_ERC721_STORAGE_POSITION} from '../../constants/storagePositions.sol';
import {IERC721} from '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import {IERC721Receiver} from './IERC721Receiver.sol';

/**
 * @title ERC721Internal
 * @notice Internal abstract contract for ERC721 logic, designed for use in diamond/facet architectures.
 * @dev Implements core ERC721 storage, transfer, mint, burn, approval, and hooks. Not intended for direct deployment.
 *      - Manages balances, ownership, approvals, and operator approvals.
 *      - Provides internal functions for safe transfer, minting, burning, and approval logic.
 *      - Designed to be inherited by facets or other contracts that expose external interfaces.
 *      - Uses a custom storage slot for upgradeable compatibility.
 *      - Relies on hooks (_beforeTokenTransfer, _afterTokenTransfer) for extensibility.
 */

import {Common} from '../../core/Common.sol';
import {IERC721Isbe} from './IERC721Isbe.sol';
import {_ERC721_STORAGE_POSITION} from '../../constants/storagePositions.sol';
import {IERC721} from '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import {IERC721Receiver} from './IERC721Receiver.sol';

abstract contract ERC721Internal is Common {
    struct ERC721Storage {
        string name;
        string symbol;
        uint256 totalSupply;
        mapping(uint256 => address) owners;
        mapping(address => uint256) balances;
        mapping(uint256 => address) tokenApprovals;
        mapping(address => mapping(address => bool)) operatorApprovals;
    }

    function _initialize(
        string memory newName,
        string memory newSymbol
    ) internal {
        ERC721Storage storage $ = _erc721Storage();
        $.name = newName;
        $.symbol = newSymbol;
    }

    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal addressIsNotZero(from) addressIsNotZero(to) {
        ERC721Storage storage $ = _erc721Storage();
        _checkIsApprovedOrOwner(_msgSender(), from, tokenId);

        _beforeTokenTransfer(from, to, tokenId);

        // Clear approvals from the previous owner
        delete $.tokenApprovals[tokenId];

        unchecked {
            --$.balances[from];
            ++$.balances[to];
        }

        $.owners[tokenId] = to;

        emit IERC721.Transfer(from, to, tokenId);

        _afterTokenTransfer(from, to, tokenId);
    }

    function _mint(
        address to,
        uint256 tokenId
    ) internal virtual addressIsNotZero(to) {
        ERC721Storage storage $ = _erc721Storage();
        _checkTokenMinted(tokenId);

        _beforeTokenTransfer(address(0), to, tokenId);

        $.owners[tokenId] = to;

        unchecked {
            ++$.balances[to];
            ++$.totalSupply;
        }

        emit IERC721.Transfer(address(0), to, tokenId);

        _afterTokenTransfer(address(0), to, tokenId);
    }

    function _burn(uint256 tokenId) internal {
        ERC721Storage storage $ = _erc721Storage();
        address owner = $.owners[tokenId];

        _beforeTokenTransfer(owner, address(0), tokenId);

        // Clear approvals
        delete $.tokenApprovals[tokenId];

        delete $.owners[tokenId];

        unchecked {
            --$.balances[owner];
            --$.totalSupply;
        }

        emit IERC721.Transfer(owner, address(0), tokenId);

        _afterTokenTransfer(owner, address(0), tokenId);
    }

    function _approve(address to, uint256 tokenId) internal virtual {
        ERC721Storage storage $ = _erc721Storage();
        $.tokenApprovals[tokenId] = to;
        emit IERC721.Approval($.owners[tokenId], to, tokenId);
    }

    function _setApprovalForAll(
        address owner,
        address operator,
        bool approved
    ) internal virtual addressIsNotZero(owner) addressIsNotZero(operator) {
        _erc721Storage().operatorApprovals[owner][operator] = approved;
        emit IERC721.ApprovalForAll(owner, operator, approved);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual returns (bool);

    // solhint-disable no-empty-blocks
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual {}
    // solhint-enable no-empty-blocks

    /**
     * @notice Safely transfers `tokenId` token from `from` to `to` with additional data.
     */
    function _safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) internal {
        _transfer(from, to, tokenId);
        // If recipient is a contract, check that it implements IERC721Receiver
        _checkOnERC721Received(from, to, tokenId, data);
    }

    function _name() internal view returns (string memory) {
        return _erc721Storage().name;
    }

    function _symbol() internal view returns (string memory) {
        return _erc721Storage().symbol;
    }

    function _ownerOf(uint256 tokenId) internal view returns (address) {
        return _erc721Storage().owners[tokenId];
    }

    function _balanceOf(address owner) internal view returns (uint256) {
        return _erc721Storage().balances[owner];
    }

    function _getApproved(uint256 tokenId) internal view returns (address) {
        return _erc721Storage().tokenApprovals[tokenId];
    }

    function _isApprovedForAll(
        address owner,
        address operator
    ) internal view returns (bool) {
        return _erc721Storage().operatorApprovals[owner][operator];
    }

    function _totalSupply() internal view returns (uint256) {
        return _erc721Storage().totalSupply;
    }

    /**
     * @notice Checks if `spender` is the owner, approved address, or an operator for the given token.
     * @dev Reverts with CallerNotOwnerNorApproved if not authorized.
     * @param spender The address performing the action (usually _msgSender()).
     * @param owner The address of the token owner.
     * @param tokenId The ID of the token to check.
     */
    function _checkIsApprovedOrOwner(
        address spender,
        address owner,
        uint256 tokenId
    ) internal view {
        require(
            spender == owner ||
                _getApproved(tokenId) == spender ||
                _isApprovedForAll(owner, spender),
            IERC721Isbe.CallerNotOwnerNorApproved()
        );
    }

    /**
     * @notice Checks if the recipient is a contract and verifies it implements the IERC721Receiver interface.
     * @dev Reverts if the recipient contract does not properly handle ERC721 tokens.
     * @param from The address which previously owned the token.
     * @param to The address receiving the token.
     * @param tokenId The ID of the token being transferred.
     * @param data Additional data with no specified format.
     */
    function _checkOnERC721Received(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) private {
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
     * @notice Checks if the token with the given ID has not been minted yet.
     * @dev Reverts with TokenAlreadyMinted if the token already exists.
     * @param tokenId The ID of the token to check.
     */
    function _checkTokenMinted(uint256 tokenId) private view {
        require(
            _erc721Storage().owners[tokenId] == address(0),
            IERC721Isbe.TokenAlreadyMinted()
        );
        _checkUintIsNotZero(tokenId);
    }

    function _erc721Storage()
        private
        pure
        returns (ERC721Storage storage storage_)
    {
        bytes32 position = _ERC721_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
