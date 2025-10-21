// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC20_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {ERC203643Capped} from '../../../tokens/erc203643/erc203643capped/ERC203643Capped.sol';
import {ERC20Burnable} from '../../../tokens/erc20/extensions/burn/ERC20Burnable.sol';
import {ERC203643Controller} from '../../../tokens/erc203643/erc203643controller/ERC203643Controller.sol';
import {ERC20Snapshot} from '../../../tokens/erc20/extensions/snapshot/ERC20Snapshot.sol';
import {ERC20} from '../../../tokens/erc20/ERC20.sol';
import {IEIP2535Introspection} from '../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

// solhint-disable-next-line
contract ERC20TestWrapper is
    ERC20,
    ERC20Snapshot,
    ERC20Burnable,
    ERC203643Capped,
    ERC203643Controller,
    IEIP2535Introspection
{
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
        businessId_ = _ERC20_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 23;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.initializeErc20.selector;
        selectors_[--selectorsLength] = this.initializeCap.selector;
        selectors_[--selectorsLength] = this.decimals.selector;
        selectors_[--selectorsLength] = this.symbol.selector;
        selectors_[--selectorsLength] = this.name.selector;
        selectors_[--selectorsLength] = this.transfer.selector;
        selectors_[--selectorsLength] = this.transferFrom.selector;
        selectors_[--selectorsLength] = this.totalSupply.selector;
        selectors_[--selectorsLength] = this.balanceOf.selector;
        selectors_[--selectorsLength] = this.mint.selector;
        selectors_[--selectorsLength] = this.burn.selector;
        selectors_[--selectorsLength] = this.burnFrom.selector;
        selectors_[--selectorsLength] = this.approve.selector;
        selectors_[--selectorsLength] = this.increaseAllowance.selector;
        selectors_[--selectorsLength] = this.decreaseAllowance.selector;
        selectors_[--selectorsLength] = this.allowance.selector;
        selectors_[--selectorsLength] = this.setCap.selector;
        selectors_[--selectorsLength] = this.cap.selector;
        selectors_[--selectorsLength] = this.snapshot.selector;
        selectors_[--selectorsLength] = this.balanceOfAt.selector;
        selectors_[--selectorsLength] = this.totalSupplyAt.selector;
        selectors_[--selectorsLength] = this.forceTransfer.selector;
        selectors_[--selectorsLength] = this.forceBurn.selector;
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        override(
            ERC20,
            ERC20Burnable,
            ERC203643Capped,
            ERC203643Controller,
            ERC20Snapshot
        )
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 5;

        bytes4[][] memory interfaceGroups = new bytes4[][](interfacesLength);
        interfaceGroups[--interfacesLength] = ERC20._implementedInterfaces();
        interfaceGroups[--interfacesLength] = ERC20Burnable
            ._implementedInterfaces();
        interfaceGroups[--interfacesLength] = ERC203643Capped
            ._implementedInterfaces();
        interfaceGroups[--interfacesLength] = ERC203643Controller
            ._implementedInterfaces();
        interfaceGroups[--interfacesLength] = ERC20Snapshot
            ._implementedInterfaces();

        return _aggregateInterfaces(interfaceGroups, new bytes4[](0));
    }
}
