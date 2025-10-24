// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ICompliance} from './ICompliance.sol';
import {CountryWhitelistingInternal} from './CountryWhitelistingInternal.sol';

abstract contract CountryWhitelisting is ICompliance, CountryWhitelistingInternal {
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

    
    function transferred(address from, address to, uint256 amount)
        external
        override
    {
        _transferred(from, to, amount);
    }

    function created(address to, uint256 amount)
        external
        override
    {
        _created(to, amount);
    }

    function destroyed(address from, uint256 amount)
        external
        override
    {
        _destroyed(from, amount);
    }

    function isCountryWhitelisted(uint16 country) external view returns (bool) {
        return _isCountryWhitelisted(country);
    }

    function canTransfer(address from, address to, uint256 amount)
        external
        view
        override
        returns (bool)
    {
        return _canTransfer(from, to, amount);
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
        interfaces_[--interfacesLength] = type(ICompliance).interfaceId;
    }
}