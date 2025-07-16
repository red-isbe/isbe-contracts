// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IEIP2535Introspection} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {_BUSINESS_LOGIC_STORAGE_POSITION} from '../../constants/storagePositions.sol';
import {Common} from '../../core/Common.sol';

/**
 * @title Business Logic Factory Internal
 * @author ISBE
 * @notice Abstract contract with internal logic to deploy and manage
 *         versioned business logic (implementation) contracts.
 * @dev Uses unstructured storage to be reusable across different contexts.
 *      It handles contract deployment via the CREATE opcode and maintains
 *      a versioned record of each business logic contract.
 */
abstract contract BusinessLogicFactoryInternal is Common {
    /// @dev Holds all data related to business logic deployments.
    struct BusinessLogicStorage {
        // Maps a business logic ID to its latest version's address.
        mapping(bytes32 => address) latestVersions;
        // Maps a business logic ID to an array of its version addresses.
        mapping(bytes32 => address[]) businessLogicVersions;
        // An array of all unique business logic IDs.
        bytes32[] businessLogics;
    }

    /**
     * @notice Raised when the deployment of a business logic contract fails.
     * @dev This error is triggered if the `create` opcode does not result in a
     * contract with a code size greater than zero.
     */
    error DeployFailed();

    /**
     * @notice Raised if the deployed contract's business ID does not match the expected ID.
     * @dev Triggered during the post-deployment check, ensuring the deployed contract
     * reports the correct identifier via its EIP-2535 introspection function.
     * @param businessId The `businessId` that the deployed contract was expected to have.
     */
    error BadBusinessId(bytes32 businessId);

    function _deploy(
        bytes32 businessId,
        bytes calldata code
    )
        internal
        returns (address businessLogicAddress_, uint256 currentVersion_)
    {
        BusinessLogicStorage storage $ = _businessLogicStorage();
        businessLogicAddress_ = _deployBusinessLogic(code);
        require(
            IEIP2535Introspection(businessLogicAddress_)
                .businessIdIntrospection() == businessId,
            BadBusinessId(businessId)
        );
        $.latestVersions[businessId] = businessLogicAddress_;
        $.businessLogicVersions[businessId].push(businessLogicAddress_);
        currentVersion_ = $.businessLogicVersions[businessId].length;
        if (currentVersion_ == 1) $.businessLogics.push(businessId);
    }

    // TODO: To paginated when needed
    function _getBusinessLogicAddress(
        bytes32 businessId,
        uint256 versionNumber
    ) internal view returns (address businessLogicAddress_) {
        businessLogicAddress_ = _getAddress(
            _businessLogicStorage(),
            businessId,
            versionNumber
        );
    }

    function _isDeployedBusinessLogic(
        bytes32 businessId,
        uint256 version
    ) internal view returns (bool) {
        uint256 versionCheck = version == 0 ? version : --version;
        return
            _businessLogicStorage().businessLogicVersions[businessId].length >
            versionCheck;
    }

    function _getBusinessLogics()
        internal
        view
        returns (bytes32[] memory businessLogicIds)
    {
        businessLogicIds = _businessLogicStorage().businessLogics;
    }

    // 0 position is the latest version
    // TODO: To paginated when needed
    function _getBusinessLogicVersions(
        bytes32 businessId
    ) internal view returns (address[] memory versions_) {
        versions_ = _businessLogicStorage().businessLogicVersions[businessId];
    }

    function _businessLogicStorage()
        internal
        pure
        returns (BusinessLogicStorage storage storage_)
    {
        bytes32 position = _BUSINESS_LOGIC_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }

    // First implementation with CREATE, next versions could include CREATE2 pattern
    function _deployBusinessLogic(
        bytes memory code
    ) private returns (address deployedAddress) {
        uint256 allGood;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            deployedAddress := create(0, add(code, 0x20), mload(code))
            allGood := gt(extcodesize(deployedAddress), 0)
        }
        // slither-disable-end assembly
        require(allGood > 0, DeployFailed());
    }

    function _getAddress(
        BusinessLogicStorage storage $,
        bytes32 businessId,
        uint256 versionNumber
    ) private view returns (address address_) {
        if (versionNumber == 0) return $.latestVersions[businessId];
        unchecked {
            --versionNumber;
        }
        if ($.businessLogicVersions[businessId].length > versionNumber)
            return $.businessLogicVersions[businessId][versionNumber];
    }
}
