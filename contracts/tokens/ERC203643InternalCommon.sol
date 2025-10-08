// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20InternalCommon} from './erc20/extensions/ERC20InternalCommon.sol';
import {ERC3643InternalCommon} from './erc3643/token/ERC3643InternalCommon.sol';

/// @title ERC3643InternalCommon
/// @notice Aggregates all ERC-3643 internal modules into a unified internal base.

// solhint-disable-next-line no-empty-blocks
abstract contract ERC203643InternalCommon is
    ERC20InternalCommon,
    ERC3643InternalCommon
{}
