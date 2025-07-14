// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IVerification
 * @notice Exposes identity verification logic based on registered claims and trusted issuers
 * @dev Implements methods to check if a user is verified
 * @author ISBE
 */
// solhint-disable-next-line no-empty-blocks
interface IVerification {
    /**
     *  @dev This functions checks whether an identity contract
     *  corresponding to the provided user address has the required claims or not based
     *  on the data fetched from trusted issuers registry and from the claim topics registry
     *  @param _userAddress The address of the user to be verified.
     *  @return 'True' if the address is verified, 'false' if not.
     */
    function isVerified(address _userAddress) external view returns (bool);
}
