// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Common} from '../../core/Common.sol';
import {IERC721Isbe} from './IERC721Isbe.sol';
import {_ERC721_STORAGE_POSITION} from '../../constants/storagePositions.sol';
import {IERC721} from '@openzeppelin/contracts/token/ERC721/IERC721.sol';

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
    ) internal virtual addressIsNotZero(from) addressIsNotZero(to) {
        ERC721Storage storage $ = _erc721Storage();
        require(
            $.owners[tokenId] == from,
            IERC721Isbe.TransferFromIncorrectOwner()
        );

        _beforeTokenTransfer(from, to, tokenId);

        // Clear approvals from the previous owner
        delete $.tokenApprovals[tokenId];

        $.balances[from] -= 1;
        $.balances[to] += 1;
        $.owners[tokenId] = to;

        emit IERC721.Transfer(from, to, tokenId);

        _afterTokenTransfer(from, to, tokenId);
    }

    function _mint(
        address to,
        uint256 tokenId
    ) internal virtual addressIsNotZero(to) {
        ERC721Storage storage $ = _erc721Storage();
        require(
            $.owners[tokenId] == address(0),
            IERC721Isbe.TokenAlreadyMinted()
        );

        _beforeTokenTransfer(address(0), to, tokenId);

        $.balances[to] += 1;
        $.owners[tokenId] = to;
        $.totalSupply += 1;

        emit IERC721.Transfer(address(0), to, tokenId);

        _afterTokenTransfer(address(0), to, tokenId);
    }

    function _burn(uint256 tokenId) internal virtual {
        ERC721Storage storage $ = _erc721Storage();
        address owner = $.owners[tokenId];

        _beforeTokenTransfer(owner, address(0), tokenId);

        // Clear approvals
        delete $.tokenApprovals[tokenId];

        $.balances[owner] -= 1;
        delete $.owners[tokenId];
        $.totalSupply -= 1;

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
        ERC721Storage storage $ = _erc721Storage();
        $.operatorApprovals[owner][operator] = approved;
        emit IERC721.ApprovalForAll(owner, operator, approved);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual;

    // solhint-disable no-empty-blocks
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual {}
    // solhint-enable no-empty-blocks

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
