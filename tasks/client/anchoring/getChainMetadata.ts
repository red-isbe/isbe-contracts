import { task, types } from 'hardhat/config'
import { getChainMetadata } from '../../../scripts/client/anchoringCoreFacet'

/*
npx hardhat anchoringcorefacet:getchainmetadata \
  --governancediamond 0x00000000000000000000000000000000000015BE \
  --network genesis_validation_network_k1
*/

task(
    'anchoringcorefacet:getchainmetadata',
    'Prepare parameters for calling IAnchoringCore.getChainMetadata'
)
    .addOptionalParam(
        'governancediamond',
        'Address of the Governance Diamond',
        '0x00000000000000000000000000000000000015BE',
        types.string
    )
    .setAction(async (taskArgs, hre) => {
        const { governancediamond } = taskArgs

        console.log('anchoringcorefacet:getchainmetadata')
        console.log('Target Governance Diamond:', governancediamond)
        console.log('Function: getChainMetadata()')
        console.log(`Network: ${hre.network.name}`)

        const result = await getChainMetadata(hre, governancediamond)

        console.log('\n✅ getChainMetadata result:')
        console.log('  _thisChainId      :', result._thisChainId.toString())
        console.log(
            '  _registeredChainIds:',
            result._registeredChainIds.map((id) => id.toString()).join(', ')
        )
    })
