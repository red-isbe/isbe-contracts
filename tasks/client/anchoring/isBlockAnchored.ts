import { task, types } from 'hardhat/config'
import { isBlockAnchored } from '../../../scripts/client/anchoring/isBlockAnchored'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'

/*
npx hardhat anchoringcorefacet:isblockanchored \
  --governancediamond 0x00000000000000000000000000000000000015BE \
  --chainid 1 \
  --blocknumber 100 \
  --network genesis_validation_network_k1
*/

task(
    'anchoringcorefacet:isblockanchored',
    'Prepare parameters for calling IAnchoringCore.isBlockAnchored'
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
    .addParam(
        'blocknumber',
        'Block number to query (_blockNumber, uint256)',
        undefined,
        types.string
    )
    .setAction(async ({ governancediamond, chainid, blocknumber }, hre) => {
        console.log('anchoringcorefacet:isblockanchored')
        console.log('Target Governance Diamond:', governancediamond)
        console.log(
            'Function: isBlockAnchored(uint256 _chainId, uint256 _blockNumber)'
        )
        console.log('Parameters:')
        console.log('  _chainId     :', chainid.toString())
        console.log('  _blockNumber :', blocknumber.toString())
        console.log(`Network: ${hre.network.name}`)

        const signatureProvider = SignatureProviderFactory.create(hre)
        console.log(`Curve: ${signatureProvider.getCurveType()}`)

        const result = await isBlockAnchored(
            hre,
            governancediamond,
            chainid,
            blocknumber,
            signatureProvider
        )

        console.log('\n✅ isBlockAnchored result:')
        console.log(`  Is anchored: ${result}`)
    })
