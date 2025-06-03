// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Ownable} from './Ownable.sol';
import {ISBEPause} from '../pause/ISBEPause.sol';

/// @title ISBEOwnable
/// @notice Implements ownership mechanisms
/// @dev Inherits from Ownable and adds pausing control
contract ISBEOwnable is Ownable, ISBEPause {
    function transferOwnership(address newOwner) public override whenNotPaused {
        super.transferOwnership(newOwner);
    }

    function renounceOwnership() public override whenNotPaused {
        super.renounceOwnership();
    }
}
