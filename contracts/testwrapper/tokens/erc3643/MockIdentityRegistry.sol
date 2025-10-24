// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IIdentity} from '../../../identity/IIdentity.sol';

contract MockIdentityRegistry {
    address public lastIdentity;
    mapping(address => bool) private _verified;
    mapping(address => uint16) private _investorCountry;
    mapping(address => address) private _investorOnchainID;

    event SetIdentity(address identity);
    event IdentityRegistered(
        address indexed investorAddress,
        address indexed onchainID,
        uint16 country
    );
    event IdentityDeleted(address indexed investorAddress);

    function setIdentity(address identity) external {
        lastIdentity = identity;
        emit SetIdentity(identity);
    }

    function setIsVerified(address account, bool verified) external {
        _verified[account] = verified;
    }

    /**
     * @dev Sets the country code for an investor (for testing)
     * @param _userAddress The address of the investor
     * @param _country The country code
     */
    function setInvestorCountry(
        address _userAddress,
        uint16 _country
    ) external {
        _investorCountry[_userAddress] = _country;
    }

    /**
     * @dev Registers a new identity in the registry
     * @param _userAddress The address of the investor
     * @param _identity The onchain identity contract
     * @param _country The country code of the investor
     */
    function registerIdentity(
        address _userAddress,
        IIdentity _identity,
        uint16 _country
    ) external {
        _verified[_userAddress] = true;
        _investorCountry[_userAddress] = _country;
        _investorOnchainID[_userAddress] = address(_identity);
        emit IdentityRegistered(_userAddress, address(_identity), _country);
    }

    /**
     * @dev Deletes an identity from the registry
     * @param _userAddress The address of the investor to remove
     */
    function deleteIdentity(address _userAddress) external {
        _verified[_userAddress] = false;
        _investorCountry[_userAddress] = 0;
        _investorOnchainID[_userAddress] = address(0);
        emit IdentityDeleted(_userAddress);
    }

    /**
     * @dev Returns the onchain identity address for an investor
     * @param _userAddress The address of the investor
     * @return The onchain identity address
     */
    function identity(address _userAddress) external view returns (address) {
        return _investorOnchainID[_userAddress];
    }

    function isVerified(address account) external view returns (bool) {
        return _verified[account];
    }

    /**
     * @dev Returns the country code for an investor
     * @param _userAddress The address of the investor
     * @return The country code (default 0 if not set)
     */
    function investorCountry(
        address _userAddress
    ) external view returns (uint16) {
        return _investorCountry[_userAddress];
    }
}
