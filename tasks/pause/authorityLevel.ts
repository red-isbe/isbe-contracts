import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getAuthorityLevel } from '../../scripts/pause/authorityLevel'
import { SignatureProviderFactory } from '../../tasks/deployment/providers/SignatureProviderFactory'

/*
npx hardhat authorityLevel \
  --diamond 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 \
  --network localhost
*/

task('authorityLevel', 'Get the authority level of a paused contract.')
    .addParam(
        'diamond',
        'The address of the diamond contract.',
        undefined,
        types.string
    )
    .setAction(
        async (
            taskArgs: {
                diamond: string
            },
            hre: HardhatRuntimeEnvironment
        ) => {
            const { diamond } = taskArgs

            const signatureProvider = SignatureProviderFactory.create(hre)

            console.info('AUTHORITY LEVEL TASK')
            console.log(`Retrieving authority level:`)
            console.log(`   Diamond: ${diamond}`)
            console.log(`   Network: ${hre.network.name}`)

            const level = await getAuthorityLevel(
                hre,
                signatureProvider,
                diamond
            )

            console.log('\n📋 Authority Level:')
            console.log(`   Level: ${level}`)
        }
    )
