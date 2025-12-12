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
import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { anchorBlock } from '../../../scripts/client/anchoring/anchorBlock'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'

/*
npx hardhat anchoringcorefacet:anchorblock \
  --governancediamond 0x00000000000000000000000000000000000015BE \
  --chainid 1 \
  --blocknumber 100 \
  --blockhash 0xaaaa... \
  --stateroot 0x1111... \
  --network genesis_validation_network_k1
*/

task(
    'anchoringcorefacet:anchorblock',
    'Prepare parameters for calling IAnchoringCore.anchorBlock'
)
    .addOptionalParam(
        'governancediamond',
        'Address of the Governance Diamond',
        '0x00000000000000000000000000000000000015BE',
        types.string
    )
    .addParam(
        'chainid',
        'Chain ID (_chainId, uint256)',
        undefined,
        types.string
    )
    .addParam(
        'blocknumber',
        'Block number (_blockNumber, uint256)',
        undefined,
        types.string
    )
    .addParam(
        'blockhash',
        'Block hash (_blockHash, bytes32)',
        undefined,
        types.string
    )
    .addParam(
        'stateroot',
        'State root (_stateRoot, bytes32)',
        undefined,
        types.string
    )
    .setAction(
        async (
            { governancediamond, chainid, blocknumber, blockhash, stateroot },
            hre: HardhatRuntimeEnvironment
        ) => {
            console.log('anchoringcorefacet:anchorblock')
            console.log('Target Governance Diamond:', governancediamond)
            console.log(
                'Function: anchorBlock(uint256 _chainId, uint256 _blockNumber, bytes32 _blockHash, bytes32 _stateRoot)'
            )
            console.log('Parameters:')
            console.log('  _chainId     :', chainid.toString())
            console.log('  _blockNumber :', blocknumber.toString())
            console.log('  _blockHash   :', blockhash)
            console.log('  _stateRoot   :', stateroot)

            const signatureProvider = SignatureProviderFactory.create(hre)
            console.log(`Network: ${hre.network.name}`)
            console.log(`Curve: ${signatureProvider.getCurveType()}`)

            await anchorBlock(
                hre,
                governancediamond,
                chainid,
                blocknumber,
                blockhash,
                stateroot,
                signatureProvider
            )

            console.log('\n✅ anchorBlock transaction confirmed:')
            console.log('Done.')
        }
    )
