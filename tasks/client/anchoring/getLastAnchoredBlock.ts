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
