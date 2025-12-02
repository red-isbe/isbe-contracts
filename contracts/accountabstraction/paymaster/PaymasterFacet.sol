// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IEIP2535Introspection} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {Paymaster} from './Paymaster.sol';
import {_ACCOUNT_ABSTRACTION_PAYMASTER_PAYMASTER_KEY} from '../../constants/resolverKeys.sol';

/**
 * @title ERC-3447 Paymaster Facet
 * @notice EIP-2535 facet that exposes ERC-4337 paymaster functionality for modular proxy systems.
 * @dev Implements introspection for diamond compatibility and delegates core logic to
 *      the {Paymaster} base contract. Provides metadata about supported interfaces,
 *      business identifiers, and exposed function selectors. Enables dynamic discovery
 *      and upgrade management within a facet-based architecture.
 * @author ISBE Development Team
 */
contract PaymasterFacet is Paymaster, IEIP2535Introspection {
    /**
     * @notice Returns the interfaces implemented by this facet.
     * @dev Provides ERC-165 interface identifiers for paymaster compatibility
     *      and diamond-standard (EIP-2535) discovery. Uses internal mapping from
     *      the inherited Paymaster implementation.
     * @return interfaces_ Array of ERC-165 interface identifiers supported by this facet.
     */
    function interfacesIntrospection()
        external
        pure
        override
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    /**
     * @notice Returns the business identifier associated with this facet.
     * @dev Provides the resolver key that uniquely identifies this business logic
     *      implementation within the diamond architecture. Used for registry and
     *      dependency resolution in composable systems.
     * @return businessId_ The resolver key identifying this paymaster implementation.
     */
    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        return _ACCOUNT_ABSTRACTION_PAYMASTER_PAYMASTER_KEY;
    }

    /**
     * @notice Returns the function selectors exposed by this facet.
     * @dev Enumerates all external selectors implemented by this facet for
     *      EIP-2535 diamond proxy integration. Enables automatic facet discovery
     *      and routing of delegate calls to corresponding business logic.
     * @return selectors_ Array of function selectors available in this facet.
     */
    function selectorsIntrospection()
        external
        pure
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 11;
        selectors_ = new bytes4[](selectorsLength);

        selectors_[--selectorsLength] = this.initializePaymaster.selector;
        selectors_[--selectorsLength] = this.validatePaymasterUserOp.selector;
        selectors_[--selectorsLength] = this.postOp.selector;
        selectors_[--selectorsLength] = this.deposit.selector;
        selectors_[--selectorsLength] = this.getDeposit.selector;
        selectors_[--selectorsLength] = this.withdrawTo.selector;
        selectors_[--selectorsLength] = this.addStake.selector;
        selectors_[--selectorsLength] = this.unlockStake.selector;
        selectors_[--selectorsLength] = this.withdrawStake.selector;
        selectors_[--selectorsLength] = this.getEntryPoint.selector;
        selectors_[--selectorsLength] = this.setEntryPoint.selector;
    }
}
