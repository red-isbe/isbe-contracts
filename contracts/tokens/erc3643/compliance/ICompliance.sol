// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title ICompliance
 * @notice Interface for ERC-3643 token compliance management.
 * @dev Defines lifecycle hooks and compliance checks for ERC-3643 tokens.
 *      This interface does not handle token binding.
 * @author ISBE
 */
interface ICompliance {
    /**
     * @notice Emitted when a compliance feature is enabled or disabled.
     * @param _feature The name of the feature (e.g., "MaxBalance").
     * @param _enabled True if enabled, false if disabled.
     */
    event ComplianceFeatureToggled(string indexed _feature, bool _enabled);

    /**
     * @notice Emitted when tokens are transferred between wallets.
     * @param _from The address of the sender.
     * @param _to The address of the receiver.
     * @param _amount The amount of tokens transferred.
     */
    event ComplianceTransfer(
        address indexed _from,
        address indexed _to,
        uint256 _amount
    );

    /**
     * @notice Emitted when tokens are minted to a wallet.
     * @param _to The address receiving the minted tokens.
     * @param _amount The amount of tokens minted.
     */
    event ComplianceCreated(address indexed _to, uint256 _amount);

    /**
     * @notice Emitted when tokens are burned from a wallet.
     * @param _from The address from which tokens are burned.
     * @param _amount The amount of tokens burned.
     */
    event ComplianceDestroyed(address indexed _from, uint256 _amount);

    /**
     * @notice Initializes the compliance contract with feature flags.
     * @dev Should be called once during contract setup.
     * @param _maxBalanceEnabled Enable/disable MaxBalance feature.
     * @param _dailyMonthLimitsEnabled Enable/disable Daily/Monthly Limits feature.
     */
    function initializeERC3643Compliance(
        bool _maxBalanceEnabled,
        bool _dailyMonthLimitsEnabled
    ) external;

    /**
     * @notice Checks if a transfer is compliant.
     * @dev Read-only function. Does not modify state or emit events.
     *      Returns true if all compliance checks pass, false otherwise.
     * @param _from The address of the sender.
     * @param _to The address of the receiver.
     * @param _amount The amount of tokens to transfer.
     * @return True if the transfer is compliant, false otherwise.
     */
    function canTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) external view returns (bool);
}
