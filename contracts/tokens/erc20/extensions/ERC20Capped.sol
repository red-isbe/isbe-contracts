// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20InternalCommon} from './ERC20InternalCommon.sol';
import {_ERC20_CAPPED_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {IERC20Capped} from './IERC20Capped.sol';

/**
 * @title ERC20Capped
 * @notice Implementation of an ERC20 token with a maximum supply cap.
 *         This abstract contract extends the base ERC20 functionality by introducing a supply cap
 *         and enforcing it during minting operations. The cap is immutable and must be initialized.
 * @dev The contract:
 *      - Defines the `initializeCap` function to set a maximum token supply, which can only be set once.
 *      - Includes a `cap` function to retrieve the maximum cap value.
 *      - Overrides `_mint` to ensure the supply does not exceed the maximum cap.
 *      - Relies on the internal `_setCap` and `_cap` functions defined in `ERC20CappedInternal`.
 *
 *      Usage notes:
 *      - The cap value must be set during initialization, and it cannot be changed afterward.
 *      - An attempt to mint tokens exceeding the cap will revert with the `CapExceeded` error.
 */
abstract contract ERC20Capped is IERC20Capped, ERC20InternalCommon {
    /**
     * @notice Sets the initial cap for the token supply.
     * @dev The cap value is immutable and can only be set once during the token's initialization.
     *      Emits a `CapInitialized` event upon successful initialization.
     * @param newCap The maximum token supply cap to be initialized.
     */
    function initializeCap(
        uint256 newCap
    ) external initializer(_ERC20_CAPPED_RESOLVER_KEY) {
        _setCap(newCap);
        emit CapInitialized(newCap);
    }

    /**
     * @dev Returns the cap on the token's total supply.
     */
    function cap() public view virtual returns (uint256) {
        return _cap();
    }
}
