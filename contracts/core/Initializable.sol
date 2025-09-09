// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_INITIALIZABLE_STORAGE_POSITION} from '../constants/storagePositions.sol';

/**
 * @title Initializable
 * @author ISBE
 * @notice Provides a mechanism to ensure an initialisation function is executed only once per facet.
 * @dev This abstract contract manages the initialisation state of contracts, particularly for facets
 * within a diamond proxy pattern. It employs a unique key (`_facetKey`) to track whether a specific
 * part of the contract has been initialised, thereby preventing re-entrancy and unauthorised
 * re-initialisation. The core logic is handled by the `initializer` modifier, which safeguards
 * functions to ensure they run only a single time. It also includes a function to permanently
 * disable initialisers, a critical security measure for implementation contracts in a proxy setup.
 */
abstract contract Initializable {
    struct InitializableStorage {
        /**
         * @dev Indicates that the contract is in the process of being initialized.
         */
        mapping(bytes32 => bool) initialized;
    }

    /**
     * @dev Triggered when the facet has been initialized or reinitialized.
     */
    event Initialized(bytes32 facet);

    error ContractIsAlreadyInitialized(bytes32 facet);

    /**
     * @dev Modifier to protect an initialization function so that it can only be invoked by functions with the
     * {initializer} and {reinitializer} modifiers, directly or indirectly.
     */
    modifier initializer(bytes32 _facetKey) {
        _preInitializer(_facetKey);
        _;
        _postInitializer(_facetKey);
    }
    /**
     * @dev Locks the contract, preventing any future reinitialization. This cannot be part of an initializer call.
     * Calling this in the constructor of a contract will prevent that contract from being initialized or reinitialized
     * to any version. It is recommended to use this to lock implementation contracts that are designed to be called
     * through proxies.
     *
     * Emits an {Initialized} event the first time it is successfully executed.
     */
    function _disableInitializers(bytes32 _facetKey) internal virtual {
        _preInitializer(_facetKey);
        _postInitializer(_facetKey);
    }

    function _postInitializer(bytes32 _facetKey) private {
        _initializableStorage().initialized[_facetKey] = true;
        emit Initialized(_facetKey);
    }

    /**
     * @dev Returns `true` if the contract is currently initializing. See {onlyInitializing}.
     */
    function _isInitialized(bytes32 _facetKey) private view returns (bool) {
        return _initializableStorage().initialized[_facetKey];
    }

    function _preInitializer(bytes32 _facetKey) private view {
        require(
            !_isInitialized(_facetKey),
            ContractIsAlreadyInitialized(_facetKey)
        );
    }

    function _initializableStorage()
        private
        pure
        returns (InitializableStorage storage storage_)
    {
        bytes32 position = _INITIALIZABLE_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
