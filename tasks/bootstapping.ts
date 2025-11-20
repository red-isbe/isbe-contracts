import { BootstrapIsbenetwork } from '../scripts/genesisGenerator'
import { task } from 'hardhat/config'

task(
    'genesis:bootstrap',
    'Generate genesis by extracting storage slots from deployment transactions in Hardhat network'
)
    .addParam('governanceaddress', 'address of the governance contract')
    .addFlag('onlyfacets', 'Only deploy facets')
    .setAction(async (taskArgs, hre) => {
        const { governanceaddress } = taskArgs

        if (!/^0x[a-fA-F0-9]{40}$/.test(governanceaddress)) {
            console.error('Invalid Governance Proxy Address')
            return
        }

        console.log(`🌐 Current network: ${hre.network.name}`)
        console.log(`📄 Using Governance Proxy Address: ${governanceaddress}`)

        const bootstrap: BootstrapIsbenetwork = new BootstrapIsbenetwork(
            hre,
            governanceaddress
        )
        await bootstrap.facetBootstrap()
        if (taskArgs.onlyfacets) {
            console.log('✅ Skipping bootstrap usecases')
        } else {
            await bootstrap.usecaseBootstrap()
        }
    })
