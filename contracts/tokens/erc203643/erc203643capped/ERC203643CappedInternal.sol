// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20Internal} from '../../erc20/ERC20Internal.sol';
import {_ERC203643_CAPPED_STORAGE_POSITION} from '../../../constants/storagePositions.sol';
import {IERC203643Capped} from './IERC203643Capped.sol';

/**
 * @title ERC203643CappedInternal
 * @notice Internal implementation of unified capped mechanism for both ERC20 and ERC3643 tokens.
 *         This contract defines the internal logic for setting and retrieving the supply cap,
 *         while ensuring proper validation of the cap value.
 * @dev This contract:
 *      - Uses a `struct` to manage the cap value within storage.
 *      - Provides the `_setCap` function for initializing the cap, which ensures the value is greater than zero.
 *      - Includes `_cap` for accessing the stored cap value.
 *      - Utilizes a private `_erc203643CappedStorage` function that leverages a specific storage slot for cap mangment.
 *      - Behavior adapts automatically for ERC20/ERC3643 through ERC203643InternalCommon._beforeTokenTransfer.
 *      This contract is intended to be inherited by other contracts, which will provide external interface functions.
 */
abstract contract ERC203643CappedInternal is ERC20Internal {
    /// @dev Storage struct for capped functionality
    struct ERC203643CappedStorage {
        uint256 cap;
    }

    /**
     * @dev Modifier to validate a new cap value before setting it
     * @param _newCap The new cap value to validate
     */
    modifier validateNewCap(uint256 _newCap) {
        _checkNewCapIsLessThanTotalSupply(_newCap);
        _;
    }

    /**
     * @dev Modifier to check that minting amount doesn't exceed the cap
     * @param _amount The amount to be minted
     */
    modifier validateCap(uint256 _amount) {
        _checkCapExceeded(_amount);
        _;
    }

    /**
     * @dev Internal function to set the supply cap
     * @param _newCap The new maximum supply cap
     */
    function _setCap(uint256 _newCap) internal {
        _erc203643CappedStorage().cap = _newCap;
    }

    /**
     * @dev Internal function to get the current supply cap
     * @return The current maximum supply cap
     */
    function _cap() internal view returns (uint256) {
        return _erc203643CappedStorage().cap;
    }

    /**
     * @dev Internal function to validate a new cap value
     * @param _newCap The new cap value to validate
     *
     * Requirements:
     * - New cap must be greater than zero
     * - New cap must be >= current total supply
     *
     * Reverts:
     * - {CapIsZero} if `_newCap` is zero
     * - {NewCapIsLessThanTotalSupply} if `_newCap` is less than current total supply
     */
    function _checkNewCapIsLessThanTotalSupply(
        uint256 _newCap
    ) internal view virtual {
        _checkUintIsNotZero(_newCap);

        uint256 totalSupply = _totalSupply();

        require(
            _newCap >= totalSupply,
            IERC203643Capped.NewCapIsLessThanTotalSupply(_newCap, totalSupply)
        );
    }

    /**
     * @dev Internal function to check that an amount doesn't exceed the cap when added to current supply
     * @param _amount The amount to check against the cap
     *
     * Requirements:
     * - Current supply + amount must be <= cap
     *
     * Reverts:
     * - {CapExceeded} if the operation would exceed the supply cap
     */
    function _checkCapExceeded(uint256 _amount) internal view {
        require(
            _totalSupply() + _amount <= _cap(),
            IERC203643Capped.CapExceeded()
        );
    }

    /**
     * @dev Private function to access the capped storage
     * @return storage_ The storage struct for capped functionality
     */
    function _erc203643CappedStorage()
        private
        pure
        returns (ERC203643CappedStorage storage storage_)
    {
        bytes32 position = _ERC203643_CAPPED_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
