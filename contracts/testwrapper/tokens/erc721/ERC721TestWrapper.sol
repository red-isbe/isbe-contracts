// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC721} from '../../../tokens/erc721/ERC721.sol';
import {IEIP2535Introspection} from '../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {_ERC721_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {
    _SAFE_TRANSFER_FROM_SELECTOR_1,
    _SAFE_TRANSFER_FROM_SELECTOR_2
} from '../../../constants/selectors.sol';

contract ERC721TestWrapper is ERC721, IEIP2535Introspection {
    // Expose only internal/protected functions for testing

    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }

    function burn(uint256 tokenId) external {
        _burn(tokenId);
    }

    function transfer(address from, address to, uint256 tokenId) external {
        _transfer(from, to, tokenId);
    }

    function callSetApprovalForAll(
        address owner,
        address operator,
        bool approved
    ) external {
        _setApprovalForAll(owner, operator, approved);
    }

    function baseURI() external view returns (string memory) {
        return _baseURI();
    }

    // Introspection for diamond pattern
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _ERC721_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 21;
        selectors_ = new bytes4[](selectorsLength);

        selectors_[--selectorsLength] = this.initializeErc721.selector;
        selectors_[--selectorsLength] = this.mint.selector;
        selectors_[--selectorsLength] = this.name.selector;
        selectors_[--selectorsLength] = this.symbol.selector;
        selectors_[--selectorsLength] = this.ownerOf.selector;
        selectors_[--selectorsLength] = this.balanceOf.selector;
        selectors_[--selectorsLength] = this.totalSupply.selector;
        selectors_[--selectorsLength] = this.burn.selector;
        selectors_[--selectorsLength] = this.transfer.selector;
        selectors_[--selectorsLength] = this.approve.selector;
        selectors_[--selectorsLength] = this.getApproved.selector;
        selectors_[--selectorsLength] = this.isApprovedForAll.selector;
        selectors_[--selectorsLength] = this.transferFrom.selector;
        selectors_[--selectorsLength] = this.setApprovalForAll.selector;
        selectors_[--selectorsLength] = this.callSetApprovalForAll.selector;
        selectors_[--selectorsLength] = _SAFE_TRANSFER_FROM_SELECTOR_1;
        selectors_[--selectorsLength] = _SAFE_TRANSFER_FROM_SELECTOR_2;
        selectors_[--selectorsLength] = this.baseURI.selector;
        selectors_[--selectorsLength] = this.tokenURI.selector;
        selectors_[--selectorsLength] = this.interfacesIntrospection.selector;
        selectors_[--selectorsLength] = this.businessIdIntrospection.selector;
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public override {
        super.safeTransferFrom(from, to, tokenId, data);
    }
}
