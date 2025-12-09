import { task, types } from 'hardhat/config'
import { getAnchoringStats } from '../../../scripts/client/anchoring/getAnchoringStats'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'

/*
npx hardhat anchoringcorefacet:getanchoringstats \
  --governancediamond 0x00000000000000000000000000000000000015BE \
  --chainid 1 \
  --network genesis_validation_network_k1
*/

task(
    'anchoringcorefacet:getanchoringstats',
    'Prepare parameters for calling IAnchoringCore.getAnchoringStats'
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
        console.log('anchoringcorefacet:getanchoringstats')
        console.log('Target Governance Diamond:', governancediamond)
        console.log('Function: getAnchoringStats(uint256 _chainId)')
        console.log('Parameters:')
        console.log('  _chainId:', chainid.toString())
        console.log(`Network: ${hre.network.name}`)

        const signatureProvider = SignatureProviderFactory.create(hre)
        console.log(`Curve: ${signatureProvider.getCurveType()}`)

        const result = await getAnchoringStats(
            hre,
            governancediamond,
            chainid,
            signatureProvider
        )

        console.log(
            '\n✅ getAnchoringStats result for ' + chainid.toString() + ':'
        )
        console.log('  totalAnchors     :', result.totalAnchors.toString())
        console.log('  lastAnchoredBlock:', result.lastAnchoredBlock.toString())
        console.log('  thisChainId      :', result.thisChainId.toString())
        console.log('  anchoredChainId  :', result.anchoredChainId.toString())
    })
