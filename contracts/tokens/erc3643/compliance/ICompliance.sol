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
     * @param feature The name of the feature (e.g., "MaxBalance").
     * @param enabled True if enabled, false if disabled.
     */
    event ComplianceFeatureToggled(string feature, bool enabled);

    /**
     * @notice Emitted when tokens are transferred between wallets.
     * @param from The address of the sender.
     * @param to The address of the receiver.
     * @param amount The amount of tokens transferred.
     */
    event ComplianceTransfer(
        address indexed from,
        address indexed to,
        uint256 amount
    );

    /**
     * @notice Emitted when tokens are minted to a wallet.
     * @param to The address receiving the minted tokens.
     * @param amount The amount of tokens minted.
     */
    event ComplianceCreated(address indexed to, uint256 amount);

    /**
     * @notice Emitted when tokens are burned from a wallet.
     * @param from The address from which tokens are burned.
     * @param amount The amount of tokens burned.
     */
    event ComplianceDestroyed(address indexed from, uint256 amount);

    /**
     * @notice Called whenever tokens are transferred between wallets.
     * @dev Can be used to update state variables of the compliance contract.
     *      Should only be called by the token contract.
     * @param _from The address of the sender.
     * @param _to The address of the receiver.
     * @param _amount The amount of tokens transferred.
     */
    function transferred(address _from, address _to, uint256 _amount) external;

    /**
     * @notice Called whenever tokens are minted to a wallet.
     * @dev Can be used to update state variables of the compliance contract.
     *      Should only be called by the token contract.
     * @param _to The address receiving the minted tokens.
     * @param _amount The amount of tokens minted.
     */
    function created(address _to, uint256 _amount) external;

    /**
     * @notice Called whenever tokens are burned from a wallet.
     * @dev Can be used to update state variables of the compliance contract.
     *      Should only be called by the token contract.
     * @param _from The address from which tokens are burned.
     * @param _amount The amount of tokens burned.
     */
    function destroyed(address _from, uint256 _amount) external;

    /**
     * @notice Initializes the compliance contract with feature flags.
     * @dev Should be called once during contract setup.
     * @param _maxBalanceEnabled Enable/disable MaxBalance feature.
     */
    function initializeERC3643Compliance(bool _maxBalanceEnabled) external;

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
