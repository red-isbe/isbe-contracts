import { task, types } from 'hardhat/config'
import { getRegisteredChains } from '../../../scripts/client/anchoring/getRegisteredChains'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'

/*
npx hardhat anchoringcorefacet:getregisteredchains \
  --governancediamond 0x00000000000000000000000000000000000015BE \
  --pageindex 0 \
  --pagelength 10 \
  --network genesis_validation_network_k1
*/

task(
    'anchoringcorefacet:getregisteredchains',
    'Prepare parameters for calling IAnchoringCore.getRegisteredChains'
)
    .addOptionalParam(
        'governancediamond',
        'Address of the Governance Diamond',
        '0x00000000000000000000000000000000000015BE',
        types.string
    )
    .addParam(
        'pageindex',
        'Page index (_pageIndex, uint256)',
        undefined,
        types.string
    )
    .addParam(
        'pagelength',
        'Page length (_pageLength, uint256)',
        undefined,
        types.string
    )
    .setAction(async (taskArgs, hre) => {
        const { governancediamond, pageindex, pagelength } = taskArgs

        console.log('anchoringcorefacet:getregisteredchains')
        console.log('Target Governance Diamond:', governancediamond)
        console.log(
            'Function: getRegisteredChains(uint256 _pageIndex, uint256 _pageLength)'
        )
        console.log('Governance Diamond:', governancediamond)
        console.log('Parameters:')
        console.log('  _pageIndex :', pageindex.toString())
        console.log('  _pageLength:', pagelength.toString())
        console.log(`Network: ${hre.network.name}`)

        const signatureProvider = SignatureProviderFactory.create(hre)
        console.log(`Curve: ${signatureProvider.getCurveType()}`)

        const result = await getRegisteredChains(
            hre,
            governancediamond,
            pageindex,
            pagelength,
            signatureProvider
        )

        console.log('\n✅ getRegisteredChains result:')
        console.log('  thisChainId      :', result.thisChainId.toString())
        console.log(
            '  registeredChainIds:',
            result.registeredChainIds.map((id) => id.toString()).join(', ')
        )
    })
