// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC721} from '../../../tokens/erc721/ERC721.sol';
import {
    ERC721Burnable
} from '../../../tokens/erc721/extensions/burn/ERC721Burnable.sol';
import {
    ERC721Capped
} from '../../../tokens/erc721/extensions/cap/ERC721Capped.sol';
import {
    ERC721Snapshot
} from '../../../tokens/erc721/extensions/snapshot/ERC721Snapshot.sol';
import {
    ERC721Controller
} from '../../../tokens/erc721/extensions/controller/ERC721Controller.sol';
import {
    IsbeUUPSUpgradeable
} from '../../../proxies/utils/IsbeUUPSUpgradeable.sol';
import {ISBEPause} from '../../../pause/ISBEPause.sol';

// solhint-disable-next-line
contract ERC721TestWrapper is
    ERC721,
    ERC721Burnable,
    ERC721Capped,
    ERC721Snapshot,
    ERC721Controller,
    ISBEPause,
    IsbeUUPSUpgradeable
{
    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 18;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.initializeErc721.selector;
        selectors_[--selectorsLength] = this.initializeCap.selector;
        selectors_[--selectorsLength] = this.name.selector;
        selectors_[--selectorsLength] = this.symbol.selector;
        selectors_[--selectorsLength] = this.totalSupply.selector;
        selectors_[--selectorsLength] = this.balanceOf.selector;
        selectors_[--selectorsLength] = this.ownerOf.selector;
        selectors_[--selectorsLength] = this.mint.selector;
        selectors_[--selectorsLength] = this.burn.selector;
        selectors_[--selectorsLength] = this.burnFrom.selector;
        selectors_[--selectorsLength] = this.approve.selector;
        selectors_[--selectorsLength] = this.getApproved.selector;
        selectors_[--selectorsLength] = this.setApprovalForAll.selector;
        selectors_[--selectorsLength] = this.isApprovedForAll.selector;
        selectors_[--selectorsLength] = this.transferFrom.selector;
        selectors_[--selectorsLength] = this.snapshot.selector;
        selectors_[--selectorsLength] = this.balanceOfAt.selector;
        selectors_[--selectorsLength] = this.totalSupplyAt.selector;
        // Puedes añadir más selectores si añades más funcionalidades
    }

    // _mint Override
    function _mint(address to, uint256 tokenId) internal virtual override {
        super._mint(to, tokenId);
    }

    // solhint-disable-next-line
    function _authorizeUpgrade(address newImplementation) internal override {}
}
