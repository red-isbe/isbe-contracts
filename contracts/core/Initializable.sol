// SPDX-License-Identifier: Apache-2.0

/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
pragma solidity ^0.8.28;

import {
    _INITIALIZABLE_STORAGE_POSITION
} from '../constants/storagePositions.sol';

/**
 * @title Initializable
 * @author ISBE
 * @notice Provides a versioned mechanism to ensure initialisation functions are executed properly per facet.
 * @dev This abstract contract manages the initialisation state of contracts with version control,
 * particularly for facets within a diamond proxy pattern. It employs a unique key (`_facetKey`)
 * combined with version tracking to manage initialisation state across contract upgrades.
 *
 * Key features:
 * - Version-based initialisation tracking
 * - Support for contract reinitialisation during upgrades
 * - Version-gated function access control
 * - Prevention of re-entrancy and unauthorised re-initialisation
 *
 * The contract provides three main modifiers:
 * - `initializer`: For initial deployment (can only be called once per version)
 * - `reinitializer`: For contract upgrades (allows migration to new versions)
 * - `onlyFromVersion`: For version-dependent access control
 */
abstract contract Initializable {
    /**
     * @dev Storage structure for tracking initialisation versions per facet.
     */
    struct InitializableStorage {
        /**
         * @dev Tracks the last initialised version for each facet.
         * Maps facetKey => lastInitialisedVersion
         * A value of 0 indicates the facet has never been initialised.
         */
        mapping(bytes32 facetKey => uint256 lastVersion) initialized;
    }

    /**
     * @dev Emitted when a facet is initialised for the first time.
     * @param facetKey The unique identifier for the facet
     * @param version The version that was initialised
     */
    event Initialized(bytes32 indexed facetKey, uint256 version);

    /**
     * @dev Emitted when a facet is reinitialised to a new version.
     * @param facetKey The unique identifier for the facet
     * @param previousVersion The version before reinitialisation
     * @param newVersion The new version after reinitialisation
     */
    event Reinitialized(
        bytes32 indexed facetKey,
        uint256 previousVersion,
        uint256 newVersion
    );

    /**
     * @dev Error thrown when attempting to initialise an already initialised facet.
     * @param facetKey The facet that is already initialised
     * @param currentVersion The current version of the facet
     * @param attemptedVersion The version that was attempted to be set
     */
    error ContractIsAlreadyInitialized(
        bytes32 facetKey,
        uint256 currentVersion,
        uint256 attemptedVersion
    );

    /**
     * @dev Error thrown when attempting to reinitialise with an invalid version.
     * @param facetKey The facet being reinitialised
     * @param currentVersion The current version of the facet
     * @param attemptedVersion The version that was attempted
     */
    error InvalidReinitializerVersion(
        bytes32 facetKey,
        uint256 currentVersion,
        uint256 attemptedVersion
    );

    /**
     * @dev Error thrown when attempting to call a function before required version.
     * @param facetKey The facet being accessed
     * @param currentVersion The current version of the facet
     * @param requiredVersion The minimum version required
     */
    error InsufficientVersion(
        bytes32 facetKey,
        uint256 currentVersion,
        uint256 requiredVersion
    );

    /**
     * @dev Error thrown when attempting to use version 0 (reserved for uninitialised state).
     */
    error InvalidVersionZero();

    /**
     * @dev Modifier to protect an initialisation function so that it can only be invoked once
     * on a fresh, never-before-initialised contract.
     *
     * **CRITICAL:** This modifier can ONLY be used when the stored version is 0 (never initialised).
     * After the first successful call, the stored version will be set to `_version`, and this
     * modifier will always revert on subsequent calls.
     *
     * @param _facetKey The unique identifier for the facet being initialised
     * @param _version The version being initialised (must be > 0)
     *
     * Requirements:
     * - The stored version MUST be exactly 0 (never initialised before)
     * - Version parameter must be greater than 0
     * - After execution, stored version will be set to `_version`
     *
     * @dev Use this for:
     * - Initial contract deployment
     * - Fresh proxy initialization
     *
     * @dev DO NOT use this for:
     * - Contract upgrades (use `reinitializer` instead)
     * - Subsequent initializations after deployment
     *
     * Emits an {Initialized} event upon successful initialisation.
     *
     * Example:
     * ```solidity
     * // Initial deployment: stored version = 0
     * function initialize(bytes32 data)
     *     external
     *     initializer(FACET_KEY, 1) // ✅ Works: 0 → 1
     * {
     *     // Initialize state
     * }
     *
     * // Second call will always fail
     * function initialize(bytes32 data)
     *     external
     *     initializer(FACET_KEY, 2) // ❌ Fails: version is now 1, not 0
     * {
     *     // This will revert with ContractIsAlreadyInitialized
     * }
     * ```
     */
    modifier initializer(bytes32 _facetKey, uint256 _version) {
        _preInitializer(_facetKey, _version);
        _;
        _postInitializer(_facetKey, _version);
    }

    /**
     * @dev Modifier to allow reinitialisation of a contract during upgrades.
     * This enables contracts to be upgraded with new state variables or logic.
     *
     * @param _facetKey The unique identifier for the facet being reinitialised
     * @param _version The new version being set (must be > current version)
     *
     * Requirements:
     * - The new version must be greater than the current version
     * - Version must be greater than 0
     *
     * Emits a {Reinitialized} event upon successful reinitialisation.
     */
    modifier reinitializer(bytes32 _facetKey, uint256 _version) {
        _preReinitializer(_facetKey, _version);
        _;
        _postReinitializer(_facetKey, _version);
    }

    /**
     * @dev Modifier to restrict function access to contracts initialised to at least
     * the specified version. This enables version-dependent feature gating.
     *
     * @param _facetKey The unique identifier for the facet
     * @param _minVersion The minimum version required to call this function
     *
     * Requirements:
     * - The facet must be initialised to at least _minVersion
     */
    modifier onlyAfterVersion(bytes32 _facetKey, uint256 _minVersion) {
        _checkAfterVersion(_facetKey, _minVersion);
        _;
    }

    /**
     * @notice Restricts function access to contracts initialised to at most the specified version.
     * @dev Used to deprecate features or restrict access in newer versions.
     * @param _facetKey The unique identifier for the facet.
     * @param _minVersion The maximum allowed version (inclusive).
     */
    modifier onlyBeforeVersion(bytes32 _facetKey, uint256 _minVersion) {
        _checkBeforeVersion(_facetKey, _minVersion);
        _;
    }

    /**
     * @dev Locks the contract, preventing any future initialisation or reinitialisation.
     * This should be called in the constructor of implementation contracts to prevent
     * them from being initialised directly (they should only be used through proxies).
     *
     * @param _facetKey The unique identifier for the facet to lock
     *
     * Note: This sets the version to type(uint256).max, effectively disabling all
     * initialisation and reinitialisation attempts.
     *
     * Emits an {Initialized} event with max version.
     */
    function _disableInitializers(bytes32 _facetKey) internal {
        _postInitializer(_facetKey, type(uint256).max);
    }

    /**
     * @dev Returns the current initialised version for a facet.
     * @param _facetKey The unique identifier for the facet
     * @return The current version (0 if never initialised)
     */
    function _getInitializedVersion(
        bytes32 _facetKey
    ) internal view returns (uint256) {
        return _initializableStorage().initialized[_facetKey];
    }

    /**
     * @dev Post-execution operations for initializer modifier.
     * @param _facetKey The facet being initialised
     * @param _version The version being initialised
     */
    function _postInitializer(bytes32 _facetKey, uint256 _version) private {
        _initializableStorage().initialized[_facetKey] = _version;
        emit Initialized(_facetKey, _version);
    }

    /**
     * @dev Post-execution operations for reinitializer modifier.
     * @param _facetKey The facet being reinitialised
     * @param _version The new version being set
     */
    function _postReinitializer(bytes32 _facetKey, uint256 _version) private {
        uint256 previousVersion = _initializableStorage().initialized[
            _facetKey
        ];
        _initializableStorage().initialized[_facetKey] = _version;
        emit Reinitialized(_facetKey, previousVersion, _version);
    }

    /**
     * @dev Pre-execution checks for initializer modifier.
     * @param _facetKey The facet being initialised
     * @param _version The version being initialised
     */
    function _preInitializer(bytes32 _facetKey, uint256 _version) private view {
        _checkVersionZero(_version);

        uint256 currentVersion = _initializableStorage().initialized[_facetKey];

        require(
            currentVersion == 0,
            ContractIsAlreadyInitialized(_facetKey, currentVersion, _version)
        );
    }

    /**
     * @dev Pre-execution checks for reinitializer modifier.
     * @param _facetKey The facet being reinitialised
     * @param _version The new version being set
     */
    function _preReinitializer(
        bytes32 _facetKey,
        uint256 _version
    ) private view {
        _checkVersionZero(_version);

        uint256 currentVersion = _initializableStorage().initialized[_facetKey];

        require(
            currentVersion > 0 && _version > currentVersion,
            InvalidReinitializerVersion(_facetKey, currentVersion, _version)
        );
    }

    /**
     * @dev Checks that the facet is initialised to at least the required version.
     * @param _facetKey The facet being checked
     * @param _minVersion The minimum required version
     */
    function _checkAfterVersion(
        bytes32 _facetKey,
        uint256 _minVersion
    ) private view {
        uint256 currentVersion = _initializableStorage().initialized[_facetKey];
        require(
            currentVersion >= _minVersion,
            InsufficientVersion(_facetKey, currentVersion, _minVersion)
        );
    }

    /**
     * @notice Checks that the facet is initialised to at most the required version.
     * @dev Reverts with InsufficientVersion if check fails.
     * @param _facetKey The facet being checked.
     * @param _minVersion The maximum allowed version.
     */
    function _checkBeforeVersion(
        bytes32 _facetKey,
        uint256 _minVersion
    ) private view {
        uint256 currentVersion = _initializableStorage().initialized[_facetKey];
        require(
            currentVersion <= _minVersion,
            InsufficientVersion(_facetKey, currentVersion, _minVersion)
        );
    }

    /**
     * @notice Validates that the version is not zero.
     * @dev Reverts with InvalidVersionZero if version is 0.
     * @param _version The version to check.
     */
    function _checkVersionZero(uint256 _version) private pure {
        require(_version > 0, InvalidVersionZero());
    }

    /**
     * @dev Returns the storage pointer for InitializableStorage.
     * @return storage_ The storage struct at the designated position
     */
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
