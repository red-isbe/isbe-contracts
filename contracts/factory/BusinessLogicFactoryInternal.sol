// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    IEIP2535Introspection
} from '../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {
    _BUSINESS_LOGIC_STORAGE_POSITION
} from '../constants/storagePositions.sol';
import {Common} from '../core/Common.sol';

abstract contract BusinessLogicFactoryInternal is Common {
    struct BusinessLogicStorage {
        // latestVersion = 0. The array position indicates the version deployed
        mapping(bytes32 => address[]) businessLogicVersions;
        bytes32[] businessLogics;
    }

    error DeployFailed();
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
        address[] storage versions = _businessLogicStorage()
            .businessLogicVersions[businessId];
        businessLogicAddress_ = versions.length > versionNumber
            ? versions[versionNumber]
            : address(0);
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
}
