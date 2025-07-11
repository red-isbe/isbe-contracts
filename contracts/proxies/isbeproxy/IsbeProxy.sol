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
        IsbeProxyArgs memory args
    )
        onlyValidConfiguration(
            args.configurationManagement,
            args.configurationId,
            args.version
        )
    {
        _initializeRbacs(args.rbacs);
        _setIsbeProxyConfiguration(
            args.configurationManagement,
            args.configurationId,
            args.version
        );
        _initializeDiamondCut(args.init, args.data);
    }
}
