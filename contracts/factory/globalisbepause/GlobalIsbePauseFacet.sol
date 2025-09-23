// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {GlobalIsbePause} from './GlobalIsbePause.sol';
import {_GLOBAL_ISBE_PAUSABLE_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {_GLOBAL_ISBE_PAUSABLE_VERSION} from '../../constants/facetVersions.sol';

/**
 * @title Global ISBE Pausable Facet
 * @author ISBE
 * @notice An EIP-2535 facet for the global ISBE pausing mechanism. This
 *         contract exposes pause and unpause functions for use-case proxies.
 * @dev Inherits from `GlobalIsbePause` and implements the standard
 *      EIP-2535 introspection interface. The initialiser is disabled
 *      to ensure it can only be deployed as a facet in a proxy's context.
 */
contract GlobalIsbePauseFacet is GlobalIsbePause {
    constructor() {
        _disableInitializers(
            _GLOBAL_ISBE_PAUSABLE_RESOLVER_KEY,
            _GLOBAL_ISBE_PAUSABLE_VERSION
        );
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _GLOBAL_ISBE_PAUSABLE_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 2;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.pauseIsbe.selector;
        selectors_[--selectorsLength] = this.unpauseIsbe.selector;
    }

    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }
}
