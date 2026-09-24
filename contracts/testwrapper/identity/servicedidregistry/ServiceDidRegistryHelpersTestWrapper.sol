// SPDX-License-Identifier: Apache-2.0

/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
pragma solidity ^0.8.28;

import {
    ServiceDidRegistryFacet
} from '../../../identity/servicedidregistry/ServiceDidRegistryFacet.sol';

/**
 * @title Service DID Registry Helpers Test Wrapper
 * @notice Exposes the pure derivation helpers of the service DID registry so that they
 *         can be exercised in isolation
 * @dev These helpers decide how key material is stored and how identifiers are derived,
 *      and every one of them can be wrong without any call reverting: a mis-sliced
 *      coordinate stores a key that simply is not the caller's, and a derivation that
 *      disagrees with its off-chain counterpart breaks resolution rather than the
 *      transaction. Reaching them directly is what makes those failures visible.
 *
 *      Deployed standalone, outside any diamond. The helpers are `pure`, so they touch
 *      no storage and need no registry state. Testing environments only.
 * @author ISBE Development Team
 */
contract ServiceDidRegistryHelpersTestWrapper is ServiceDidRegistryFacet {
    /// @notice Exposes the split of public key material into its coordinates
    /// @param _publicKey The signing public key material, 64 or 65 bytes
    /// @return pubKeyX_ The `x` coordinate
    /// @return pubKeyY_ The `y` coordinate
    function splitPublicKey(
        bytes memory _publicKey
    ) external pure returns (bytes32 pubKeyX_, bytes32 pubKeyY_) {
        return _splitPublicKey(_publicKey);
    }

    /// @notice Exposes the address derivation used for the cross-registry check
    /// @param _pubKeyX The `x` coordinate of the public key
    /// @param _pubKeyY The `y` coordinate of the public key
    /// @return The derived address
    function signingKeyAddress(
        bytes32 _pubKeyX,
        bytes32 _pubKeyY
    ) external pure returns (address) {
        return _signingKeyAddress(_pubKeyX, _pubKeyY);
    }

    /// @notice Exposes the digest used as the key of the uniqueness index
    /// @param _pubKeyX The `x` coordinate of the public key
    /// @param _pubKeyY The `y` coordinate of the public key
    /// @return The digest
    function publicKeyHash(
        bytes32 _pubKeyX,
        bytes32 _pubKeyY
    ) external pure returns (bytes32) {
        return _publicKeyHash(_pubKeyX, _pubKeyY);
    }
}
