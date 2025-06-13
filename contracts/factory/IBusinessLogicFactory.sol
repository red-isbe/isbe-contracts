// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IBusinessLogicFactory
 * @notice Interface to deploy single and bulk bytecodes with unique IDs and versioning.
 * @dev Provides methods for deploying single business logics and multiple business logics as a batch.
 */
interface IBusinessLogicFactory {
    /**
     * @notice Emitted when a single business logic is deployed successfully.
     * @param businessId Unique identifier of the deployed business logic.
     * @param version Version of the deployed business logic.
     */
    event Deployed(
        bytes32 businessId,
        address businessAddress,
        uint256 version
    );

    /**
     * @notice Deploys a single business logic by its unique ID and the provided bytecode.
     * @dev Emits the `Deployed` event upon successful deployment.
     * @param businessId Unique identifier of the business logic to deploy.
     * @param bytecode Binary data of the business logic to deploy.
     */
    function deploy(bytes32 businessId, bytes calldata bytecode) external;

    function getBusinessLogicAddress(
        bytes32 businessId,
        uint256 version
    ) external view returns (address businessLogicAddress_);

    function getBusinessLogics()
        external
        view
        returns (bytes32[] memory businessLogicIds_);

    function getBusinessLogicVersions(
        bytes32 businessId
    ) external view returns (address[] memory versions_);
}
