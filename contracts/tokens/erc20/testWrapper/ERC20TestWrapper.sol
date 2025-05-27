// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20Burnable} from '../extensions/ERC20Burnable.sol';

/**
 * @title ERC20TestWrapper
 * @notice This contract serves as a simple wrapper for the ERC20Burnable contract, inheriting its functionality.
 *         It can be used to test, extend, or experiment with ERC20 and burnable token features.
 * @dev Inherits the `ERC20Burnable` contract, allowing token burning operations alongside standard ERC20 functionality.
 *      This contract does not add additional logic or state but acts as a base for further development or testing.
 */
// solhint-disable-next-line
contract ERC20TestWrapper is ERC20Burnable {}
