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

    modifier checkValidNewCap(uint256 newCap) {
        _checkValidNewCap(newCap);
        _;
    }

    modifier checkAllowedCap(uint256 amount) {
        _checkAllowedCap(amount);
        _;
    }

    function _mint(
        address to,
        uint256 tokenId
    ) internal virtual override checkAllowedCap(1) {
        super._mint(to, tokenId);
    }

    function _setCap(uint256 newCap) internal {
        _erc721CappedStorage().cap = newCap;
    }

    function _cap() internal view returns (uint256) {
        return _erc721CappedStorage().cap;
    }

    function _checkValidNewCap(uint256 newCap) internal view virtual {
        require(
            newCap >= _totalSupply(),
            IERC721Capped.NewCapIsLessThanTotalSupply(newCap, _totalSupply())
        );
    }

    function _checkAllowedCap(uint256 amount) internal view virtual {
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
