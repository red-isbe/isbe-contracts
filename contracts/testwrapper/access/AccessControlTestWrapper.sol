// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {AccessControl} from '../../access/accessControl/AccessControl.sol';
import {ERC165} from '../../core/ERC165.sol';

/// @title AssetEventTrackerTestWrapper
/// @notice Implements asset event tracker (only for test)
/// @dev Inherits from AssetEventTracker, providing access to block timestamp and check state change functions

// solhint-disable no-empty-blocks
contract AccessControlTestWrapper is AccessControl, ERC165 {}
