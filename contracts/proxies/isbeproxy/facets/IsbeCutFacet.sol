// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ISBE_CUT_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {IIsbeCut} from '../interfaces/IIsbeCut.sol';
import {IsbeProxyInternal} from '../IsbeProxyInternal.sol';
import {IEIP2535Introspection} from '../../eip2535/interfaces/IEIP2535Introspection.sol';
import {_CONFIGURATION_MANAGER_ROLE} from '../../../constants/roles.sol';
import {IConfigurationManagement} from '../../../factory/configurationmanagement/IConfigurationManagement.sol';

/**
 * @title IsbeCutFacet
 * @notice Diamond facet for managing ISBE proxy configurations
 * @dev Implements IIsbeCut interface within an EIP-2535 Diamond proxy system
 * @author ISBE
 */
contract IsbeCutFacet is IIsbeCut, IsbeProxyInternal, IEIP2535Introspection {
    function setIsbeProxyConfiguration(
        IConfigurationManagement _configurationManagement,
        bytes32 _configurationId,
        uint256 _version
    )
        external
        override
        onlyRole(_CONFIGURATION_MANAGER_ROLE)
        whenNotPaused
        onlyValidConfiguration(
            _configurationManagement,
            _configurationId,
            _version
        )
    {
        _setIsbeProxyConfiguration(
            _configurationManagement,
            _configurationId,
            _version
        );
        emit IsbeProxyConfigurationSet(
            address(_configurationManagement),
            _configurationId,
            _version
        );
    }

    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IIsbeCut).interfaceId;
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _ISBE_CUT_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 1;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.setIsbeProxyConfiguration.selector;
    }
}
