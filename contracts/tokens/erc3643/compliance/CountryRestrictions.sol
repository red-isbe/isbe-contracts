// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ICompliance} from './ICompliance.sol';
import {ERC203643InternalCommon} from '../../erc203643/ERC203643InternalCommon.sol';

/**
 * @title CountryRestrictions
 * @notice External contract for country restriction compliance logic.
 */
abstract contract CountryRestrictions is ICompliance, ERC203643InternalCommon {
    event AddedRestrictedCountry(uint16 country);
    event RemovedRestrictedCountry(uint16 country);

    function addCountryRestriction(uint16 country) external {
        _addCountryRestriction(country);
        emit AddedRestrictedCountry(country);
    }

    function removeCountryRestriction(uint16 country) external {
        _removeCountryRestriction(country);
        emit RemovedRestrictedCountry(country);
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

     function isCountryRestricted(uint16 country) external view returns (bool) {
        return _isCountryRestricted(country);
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