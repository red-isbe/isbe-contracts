// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IHooks
 * @notice Interface for token compliance hooks and transfer validation
 * @dev Provides callbacks for token lifecycle events and compliance checks
 * @author ISBE
 */
interface IHooks {
    /**
     *  @dev function called whenever tokens are transferred
     *  from one wallet to another
     *  this function can be used to update state variables of the compliance contract
     *  This function can be called ONLY by the token contract bound to the compliance
     *  @param _from The address of the sender
     *  @param _to The address of the receiver
     *  @param _amount The amount of tokens involved in the transfer
     */
    function transferred(address _from, address _to, uint256 _amount) external;

    /**
     *  @dev function called whenever tokens are created on a wallet
     *  this function can be used to update state variables of the compliance contract
     *  This function can be called ONLY by the token contract bound to the compliance
     *  @param _to The address of the receiver
     *  @param _amount The amount of tokens involved in the minting
     */
    function created(address _to, uint256 _amount) external;

    /**
     *  @dev function called whenever tokens are destroyed from a wallet
     *  this function can be used to update state variables of the compliance contract
     *  This function can be called ONLY by the token contract bound to the compliance
     *  @param _from The address on which tokens are burnt
     *  @param _amount The amount of tokens involved in the burn
     */
    function destroyed(address _from, uint256 _amount) external;

    /**
     *  @dev checks that the transfer is compliant.
     *  default compliance always returns true
     *  READ ONLY FUNCTION, this function cannot be used to increment
     *  counters, emit events, ...
     *  @param _from The address of the sender
     *  @param _to The address of the receiver
     *  @param _amount The amount of tokens involved in the transfer
     *  This function will call all checks implemented on compliance
     *  If all checks return TRUE, the function returns TRUE
     *  returns FALSE otherwise
     */
    function canTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) external view returns (bool);
}
