// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC3643_FREEZE_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {ERC3643Freeze} from './ERC3643Freeze.sol';
import {IEIP2535Introspection} from '../../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

contract ERC3643FreezeFacet is ERC3643Freeze, IEIP2535Introspection {
    function interfacesIntrospection()
        external
        pure
        override
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
        businessId_ = _ERC3643_FREEZE_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 5;
        selectors_ = new bytes4[](selectorsLength);

        selectors_[--selectorsLength] = this.setAddressFrozen.selector;
        selectors_[--selectorsLength] = this.freezePartialTokens.selector;
        selectors_[--selectorsLength] = this.unfreezePartialTokens.selector;
        selectors_[--selectorsLength] = this.isFrozen.selector;
        selectors_[--selectorsLength] = this.getFrozenTokens.selector;
    }
}
