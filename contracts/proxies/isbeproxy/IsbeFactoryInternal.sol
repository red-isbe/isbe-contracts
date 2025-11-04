// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ISBE_FACTORY_STORAGE_POSITION} from '../../constants/storagePositions.sol';
import {IIsbeFactory} from '../../factory/IIsbeFactory.sol';

// solhint-disable no-inline-assembly
/**
 * @title IsbeProxyInternal
 * @notice Internal implementation for ISBE proxy configuration management
 * @dev Abstract contract providing core proxy functionality with configuration management
 * @author ISBE
 */
abstract contract IsbeFactoryInternal {
    /**
     * @notice Storage structure for ISBE factory configuration data
     * @dev Stores configuration manager reference and version information
     */
    struct IsbeFactoryStorage {
        IIsbeFactory isbeFactory;
    }

    function _setIsbeFactory(IIsbeFactory _isbeFactory) internal {
        _isbeFactoryStorage().isbeFactory = _isbeFactory;
    }

    /// @notice Returns the governance address for DID and other queries
    /// @dev Overrides GovernanceAddressResolver to return configurationManager
    ///      This enables external DID resolution for business logic proxies
    /// @return The configuration manager address
    function _getIsbeFactory() internal view returns (IIsbeFactory) {
        return _isbeFactoryStorage().isbeFactory;
    }

    function _isUseCase() internal view returns (bool) {
        return address(_isbeFactoryStorage().isbeFactory) != address(0);
    }

    function _isbeFactoryStorage()
        private
        pure
        returns (IsbeFactoryStorage storage storage_)
    {
        bytes32 position = _ISBE_FACTORY_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
        // solhint-enable no-inline-assembly
    }
}
