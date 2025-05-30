// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20} from '../ERC20.sol';

/// @title ERC20Pausable
/// @notice This abstract contract extends ERC20 functionality to support pausable token transfers.
abstract contract ERC20Pausable is ERC20 {
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);

        _requireNotPaused();
    }
}
