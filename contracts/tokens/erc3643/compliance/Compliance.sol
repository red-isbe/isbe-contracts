// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ICompliance} from './ICompliance.sol';
import {ComplianceInternal} from './ComplianceInternal.sol';

/**
 * @title Compliance
 * @notice External contract exposing ERC-3643 compliance logic.
 * @dev Implements ICompliance and delegates logic to ComplianceInternal.
 */
contract Compliance is ICompliance, ComplianceInternal {
    function canTransfer(address from, address to, uint256 amount) external view override returns (bool) {
        return _canTransfer(from, to, amount);
    }

    function transferred(address from, address to, uint256 amount) external override {
        _transferred(from, to, amount);
    }

    function created(address to, uint256 amount) external override {
        _created(to, amount);
    }

    function destroyed(address from, uint256 amount) external override {
        _destroyed(from, amount);
    }
}