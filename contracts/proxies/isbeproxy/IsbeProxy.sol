// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IsbeProxyInternal} from './IsbeProxyInternal.sol';
import {EIP2535} from '../eip2535/EIP2535.sol';
import {IAccessControl} from '../../access/accessControl/IAccessControl.sol';
import {IConfigurationManagement} from '../../factory/configurationmanagement/IConfigurationManagement.sol';

/**
 * @title IsbeProxy
 * @notice EIP-2535 Diamond proxy implementation for ISBE system
 * @dev Combines Diamond Standard functionality with ISBE configuration management
 * @author ISBE
 */
contract IsbeProxy is EIP2535, IsbeProxyInternal {
    struct IsbeProxyArgs {
        IConfigurationManagement configurationManagement;
        bytes32 configurationId;
        uint256 version;
        IAccessControl.Rbac[] rbacs;
        address init;
        bytes data;
    }

    constructor(
        IsbeProxyArgs memory _args
    )
        onlyValidConfiguration(
            _args.configurationManagement,
            _args.configurationId,
            _args.version
        )
    {
        _initializeRbacs(_args.rbacs);
        _setIsbeProxyConfiguration(
            _args.configurationManagement,
            _args.configurationId,
            _args.version
        );
        _initializeDiamondCut(_args.init, _args.data);
    }
}
