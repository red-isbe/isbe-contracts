// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Ownable2Step} from './Ownable2Step.sol';
import {ISBEPause} from '../pause/ISBEPause.sol';

/// @title ISBEOwnable2Step
/// @notice Implements ownership 2 step mechanisms
/// @dev Inherits from Ownable2Step and adds pausing control
contract ISBEOwnable2Step is Ownable2Step, ISBEPause {
    function transferOwnership(address newOwner) public override whenNotPaused {
        super.transferOwnership(newOwner);
    }

    function acceptOwnership() public override whenNotPaused {
        super.acceptOwnership();
    }

    function renounceOwnership() public override whenNotPaused {
        super.renounceOwnership();
    }
}
