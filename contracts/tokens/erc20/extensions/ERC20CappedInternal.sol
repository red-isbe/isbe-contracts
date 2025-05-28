// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20} from '../ERC20.sol';
import {
    _ERC20_CAPPED_STORAGE_POSITION
} from '../../../constants/storagePositions.sol';
import {IERC20Capped} from './IERC20Capped.sol';

/**
 * @title ERC20CappedInternal
 * @notice Internal implementation of an ERC20 token with a capped total supply.
 *         This contract defines the internal logic for setting and retrieving the supply cap,
 *         while ensuring proper validation of the cap value.
 * @dev This contract:
 *      - Uses a `struct` to manage the cap value within storage.
 *      - Provides the `_setCap` function for initializing the cap, which ensures the value is greater than zero.
 *      - Includes `_cap` for accessing the stored cap value.
 *      - Utilizes a private `_erc20CappedStorage` function that leverages a specific storage slot for cap management.
 *      This contract is intended to be inherited by other contracts, which will provide external interface functions.
 */
abstract contract ERC20CappedInternal is ERC20, IERC20Capped {
    struct ERC20CappedStorage {
        uint256 cap;
    }

    function _setCap(uint256 newCap) internal {
        require(newCap > 0, CapIsZero());
        _erc20CappedStorage().cap = newCap;
    }

    function _cap() internal view returns (uint256) {
        return _erc20CappedStorage().cap;
    }

    function _erc20CappedStorage()
        private
        pure
        returns (ERC20CappedStorage storage storage_)
    {
        bytes32 position = _ERC20_CAPPED_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
