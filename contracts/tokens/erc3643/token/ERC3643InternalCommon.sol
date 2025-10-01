// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC3643MetadataInternal} from './erc3643metadata/ERC3643MetadataInternal.sol';
import {ERC3643FreezeInternal} from './erc3643freeze/ERC3643FreezeInternal.sol';
import {ERC3643RegulatoryInternal} from './erc3643regulatory/ERC3643RegulatoryInternal.sol';

/// @title ERC3643InternalCommon
/// @notice Aggregates all ERC-3643 internal modules into a unified internal base.

abstract contract ERC3643InternalCommon is
    ERC3643MetadataInternal,
    ERC3643FreezeInternal,
    ERC3643RegulatoryInternal

{
  
}
