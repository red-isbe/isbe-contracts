// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ICountryWhitelisting} from './ICountryWhitelisting.sol';
import {CountryWhitelistingInternal} from './CountryWhitelistingInternal.sol';

abstract contract CountryWhitelisting is ICountryWhitelisting, CountryWhitelistingInternal {
    event WhitelistedCountry(uint16 country);
    event UnWhitelistedCountry(uint16 country);

    function whitelistCountry(uint16 country) external {
        _whitelistCountry(country);
        emit WhitelistedCountry(country);
    }

    function unWhitelistCountry(uint16 country) external {
        _unWhitelistCountry(country);
        emit UnWhitelistedCountry(country);
    }

    function isCountryWhitelisted(uint16 country) external view returns (bool) {
        return _isCountryWhitelisted(country);
    }


    /**
     * @dev Declares the interfaces implemented by this facet.
     * @return interfaces_ Array of supported interface identifiers.
     */
    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(ICountryWhitelisting).interfaceId;
    }
}