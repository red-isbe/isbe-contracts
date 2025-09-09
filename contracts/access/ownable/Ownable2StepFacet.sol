// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_OWNABLE_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {Ownable2Step} from './Ownable2Step.sol';
import {IEIP2535Introspection} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/// @title Ownable
/// @notice Implements ownership mechanisms
/// @dev Inherits from IOwnable and OwnableInternal
contract Ownable2StepFacet is Ownable2Step, IEIP2535Introspection {
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _OWNABLE_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 6;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.initializeOwnable.selector;
        selectors_[--selectorsLength] = this.transferOwnership.selector;
        selectors_[--selectorsLength] = this.acceptOwnership.selector;
        selectors_[--selectorsLength] = this.renounceOwnership.selector;
        selectors_[--selectorsLength] = this.owner.selector;
        selectors_[--selectorsLength] = this.pendingOwner.selector;
    }
}
