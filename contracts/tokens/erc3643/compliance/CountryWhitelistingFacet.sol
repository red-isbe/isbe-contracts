// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {CountryWhitelisting} from './CountryWhitelisting.sol';
import {IEIP2535Introspection} from '../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

contract CountryWhitelistingFacet is CountryWhitelisting, IEIP2535Introspection {
    function whitelistCountry(uint16 country) external override {
        super.whitelistCountry(country);
    }

    function unWhitelistCountry(uint16 country) external override {
        super.unWhitelistCountry(country);
    }

    function isCountryWhitelisted(uint16 country) external view override returns (bool) {
        return super.isCountryWhitelisted(country);
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
        businessId_ = keccak256("CountryWhitelisting");
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 3;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.whitelistCountry.selector;
        selectors_[--selectorsLength] = this.unWhitelistCountry.selector;
        selectors_[--selectorsLength] = this.isCountryWhitelisted.selector;
    }
}