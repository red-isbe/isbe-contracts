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
import { getLastAnchoredBlock } from '../../../scripts/client/anchoring/getLastAnchoredBlock'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'

/*
npx hardhat anchoringcorefacet:getlastanchoredblock \
  --governancediamond 0x00000000000000000000000000000000000015BE \
  --chainid 1 \
  --network genesis_validation_network_k1
*/

task(
    'anchoringcorefacet:getlastanchoredblock',
    'Prepare parameters for calling IAnchoringCore.getLastAnchoredBlock'
)
    .addOptionalParam(
        'governancediamond',
        'Address of the Governance Diamond',
        '0x00000000000000000000000000000000000015BE',
        types.string
    )
    .addParam(
        'chainid',
        'Chain ID to query (_chainId, uint256)',
        undefined,
        types.string
    )
    .setAction(async ({ governancediamond, chainid }, hre) => {
        console.log('anchoringcorefacet:getlastanchoredblock')
        console.log('Target Governance Diamond:', governancediamond)
        console.log('Function: getLastAnchoredBlock(uint256 _chainId)')
        console.log('Parameters:')
        console.log('  _chainId:', chainid.toString())
        console.log(`Network: ${hre.network.name}`)

        const signatureProvider = SignatureProviderFactory.create(hre)
        console.log(`Curve: ${signatureProvider.getCurveType()}`)

        const result = await getLastAnchoredBlock(
            hre,
            governancediamond,
            chainid,
            signatureProvider
        )

        console.log('\n✅ getLastAnchoredBlock result:')
        console.log('  blockNumber:', result.blockNumber.toString())
        console.log('  blockHash  :', result.blockHash)
        console.log('  stateRoot  :', result.stateRoot)
        console.log('  timestamp  :', result.timestamp.toString())
        console.log('  anchorer   :', result.anchorer)
    })
