// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IDidRegistryQuery} from '../interfaces/IDidRegistryQuery.sol';
import {DidDocumentDetailedInternal} from '../DidDocumentDetailedInternal.sol';

/// @title DID Registry Query (external surface with validations)
/// @notice Abstract contract exposing read-only queries with input validations
/// @dev Adds whenNotPaused and basic format checks; implementation lives in Facet
abstract contract DidRegistryQuery is
    DidDocumentDetailedInternal,
    IDidRegistryQuery
{
    function isKnownDid(address account) external view override returns (bool) {
        return _isKnownDid(account);
    }

    /// @inheritdoc IDidRegistryQuery
    function didOf(
        address account
    ) external view override returns (bytes32 did) {
        return _didOf(account);
    }
}
