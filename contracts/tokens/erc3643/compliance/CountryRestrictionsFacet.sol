// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {CountryRestrictions} from './CountryRestrictions.sol';
import {IEIP2535Introspection} from '../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

contract CountryRestrictionsFacet is CountryRestrictions, IEIP2535Introspection {
    function addCountryRestriction(uint16 country) external override {
        super.addCountryRestriction(country);
    }

    function removeCountryRestriction(uint16 country) external override {
        super.removeCountryRestriction(country);
    }

    function isCountryRestricted(uint16 country) external view override returns (bool) {
        return super.isCountryRestricted(country);
    }

    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = keccak256("CountryRestrictions");
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 3;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.addCountryRestriction.selector;
        selectors_[--selectorsLength] = this.removeCountryRestriction.selector;
        selectors_[--selectorsLength] = this.isCountryRestricted.selector;
    }
}