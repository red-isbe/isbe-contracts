// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC721Internal} from '../../ERC721Internal.sol';
import {_ERC721_CAPPED_STORAGE_POSITION} from '../../../../constants/storagePositions.sol';
import {IERC721Capped} from './IERC721Capped.sol';

/**
 * @title ERC721CappedInternal
 * @notice Internal implementation of an ERC721 token with a capped total supply.
 *         This contract defines the internal logic for setting and retrieving the supply cap,
 *         while ensuring proper validation of the cap value.
 * @dev This contract:
 *      - Uses a `struct` to manage the cap value within storage.
 *      - Provides the `_setCap` function for initializing the cap, which ensures the value is greater than zero.
 *      - Includes `_cap` for accessing the stored cap value.
 *      - Utilizes a private `_erc721CappedStorage` function that leverages a specific storage slot for cap management.
 *      This contract is intended to be inherited by other contracts, which will provide external interface functions.
 */
abstract contract ERC721CappedInternal is ERC721Internal {
    struct ERC721CappedStorage {
        uint256 cap;
    }

    modifier checkNewCap(uint256 newCap) {
        _checkNewCap(newCap);
        _;
    }

    modifier checkCap(uint256 amount) {
        _checkCap(amount);
        _;
    }

    function _mint(
        address to,
        uint256 tokenId
    ) internal virtual override checkCap(1) {
        super._mint(to, tokenId);
    }

    function _setCap(uint256 newCap) internal {
        _erc721CappedStorage().cap = newCap;
    }

    function _cap() internal view returns (uint256) {
        return _erc721CappedStorage().cap;
    }

    function _checkNewCap(uint256 newCap) internal view virtual {
        require(newCap > 0, IERC721Capped.CapIsZero());

        uint256 totalSupply = _totalSupply();

        require(
            newCap >= totalSupply,
            IERC721Capped.NewCapIsLessThanTotalSupply(newCap, totalSupply)
        );
    }

    function _checkCap(uint256 amount) internal view virtual {
        require(_totalSupply() + amount <= _cap(), IERC721Capped.CapExceeded());
    }

    function _erc721CappedStorage()
        private
        pure
        returns (ERC721CappedStorage storage storage_)
    {
        bytes32 position = _ERC721_CAPPED_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
