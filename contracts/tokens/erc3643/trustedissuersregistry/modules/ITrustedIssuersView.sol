// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

//TODO
import {IClaimIssuer} from '../../../../identity/IClaimIssuer.sol';
/**
 * @title ITrustedIssuersView
 * @dev Interface for viewing trusted claim issuers in a registry.
 *      Provides functions to retrieve all trusted issuers, issuers for specific claim topics,
 *      and to check if an issuer is trusted or has a specific claim topic.
 */
interface ITrustedIssuersView {
    /**
     *  @dev Function for getting all the trusted claim issuers stored.
     *  @return array of all claim issuers registered.
     */
    function getTrustedIssuers() external view returns (IClaimIssuer[] memory);

    /**
     *  @dev Function for getting all the trusted issuer allowed for a given claim topic.
     *  @param claimTopic the claim topic to get the trusted issuers for.
     *  @return array of all claim issuer addresses that are allowed for the given claim topic.
     */
    function getTrustedIssuersForClaimTopic(
        uint256 claimTopic
    ) external view returns (IClaimIssuer[] memory);

    /**
     *  @dev Checks if the ClaimIssuer contract is trusted
     *  @param _issuer the address of the ClaimIssuer contract
     *  @return true if the issuer is trusted, false otherwise.
     */
    function isTrustedIssuer(address _issuer) external view returns (bool);

    /**
     *  @dev Function for getting all the claim topic of trusted claim issuer
     *  Requires the provided ClaimIssuer contract to be registered in the trusted issuers registry.
     *  @param _trustedIssuer the trusted issuer concerned.
     *  @return The set of claim topics that the trusted issuer is allowed to emit
     */
    function getTrustedIssuerClaimTopics(
        IClaimIssuer _trustedIssuer
    ) external view returns (uint256[] memory);

    /**
     *  @dev Function for checking if the trusted claim issuer is allowed
     *  to emit a certain claim topic
     *  @param _issuer the address of the trusted issuer's ClaimIssuer contract
     *  @param _claimTopic the Claim Topic that has to be checked to know if the `issuer` is allowed to emit it
     *  @return true if the issuer is trusted for this claim topic.
     */
    function hasClaimTopic(
        address _issuer,
        uint256 _claimTopic
    ) external view returns (bool);
}
