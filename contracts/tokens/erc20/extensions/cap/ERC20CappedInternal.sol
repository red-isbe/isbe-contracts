// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20Internal} from '../../ERC20Internal.sol';
import {_ERC20_CAPPED_STORAGE_POSITION} from '../../../../constants/storagePositions.sol';
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
abstract contract ERC20CappedInternal is ERC20Internal {
    struct ERC20CappedStorage {
        uint256 cap;
    }

    modifier checkNewCap(uint256 _newCap) {
        _checkNewCap(_newCap);
        _;
    }

    modifier checkCap(uint256 _amount) {
        _checkCap(_amount);
        _;
    }

    function _mint(
        address _account,
        uint256 _amount
    ) internal virtual override {
        super._mint(_account, _amount);
    }

    function _setCap(uint256 _newCap) internal {
        _erc20CappedStorage().cap = _newCap;
    }

    function _cap() internal view returns (uint256) {
        return _erc20CappedStorage().cap;
    }

    function _checkNewCap(uint256 _newCap) internal view virtual {
        require(_newCap > 0, IERC20Capped.CapIsZero());

        uint256 totalSupply = _totalSupply();

        require(
            _newCap >= totalSupply,
            IERC20Capped.NewCapIsLessThanTotalSupply(_newCap, totalSupply)
        );
    }

    function _checkCap(uint256 _amount) internal view virtual {
        require(_totalSupply() + _amount <= _cap(), IERC20Capped.CapExceeded());
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
