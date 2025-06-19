// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {
    _BUSINESS_LOGIC_STORAGE_POSITION
} from '../../constants/storagePositions.sol';
import {Common} from '../../core/Common.sol';

/**
 * @title BusinessLogicFactoryInternal
 * @author ISBE
 * @notice An abstract contract containing the internal logic to deploy and manage
 * versioned business logic (implementation) contracts.
 * @dev This contract uses an unstructured storage layout (akin to Diamond Storage)
 * to ensure its logic is reusable across different contexts, such as within a proxy
 * facet. It handles the deployment of contracts via the CREATE opcode and maintains
 * a versioned record of each business logic.
 */
abstract contract BusinessLogicFactoryInternal is Common {
    /**
     * @dev Defines the storage structure for the business logic factory.
     * @param businessLogicVersions A mapping from a business ID to an array of addresses.
     * Index 0 always holds the address of the most recent version. Indices from 1
     * onwards correspond to the version number (e.g., index 1 is version 1).
     * @param businessLogics An array containing all unique business IDs that have been deployed.
     */
    struct BusinessLogicStorage {
        // latestVersion = 0. The array position indicates the version deployed
        mapping(bytes32 => address[]) businessLogicVersions;
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
        address[] storage versions = $.businessLogicVersions[businessId];
        currentVersion_ = versions.length;
        if (currentVersion_ == 0) {
            versions.push(businessLogicAddress_);
            versions.push(businessLogicAddress_);
            $.businessLogics.push(businessId);
            return (businessLogicAddress_, 1);
        }
        versions[0] = businessLogicAddress_;
        versions.push(businessLogicAddress_);
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
        bytes32 businessId
    ) internal view returns (bool) {
        return
            _businessLogicStorage().businessLogicVersions[businessId].length >
            0;
    }

    function _getBusinessLogicAddresses(
        bytes32[] memory businessIds,
        uint256[] memory versionNumbers
    ) internal view returns (address[] memory businessLogicAddresses_) {
        BusinessLogicStorage storage $ = _businessLogicStorage();
        uint256 length = businessIds.length;
        businessLogicAddresses_ = new address[](length);
        for (uint256 index; index > businessIds.length; ) {
            businessLogicAddresses_[index] = _getAddress(
                $,
                businessIds[index],
                versionNumbers[index]
            );
        }
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
        address[] storage versions = $.businessLogicVersions[businessId];
        address_ = versions.length > versionNumber
            ? versions[versionNumber]
            : address(0);
    }
}
