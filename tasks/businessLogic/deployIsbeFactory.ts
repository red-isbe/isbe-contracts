import { task } from 'hardhat/config'
import { deployIsbeFactory } from '../../scripts/businessLogic/deployIsbeFactory'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat deployIsbeFactory --network localhost
 */

task('deployIsbeFactory', 'Deploys the ISBE Factory contract').setAction(
    async (args, hre) => {
        const signer = await getSigner(hre)
        const accountAddress = await signer.getAddress()

        console.log('🚀 Deploying ISBE Factory...')
        console.log(`   🔐 Using account: ${accountAddress}`)
        console.log(`   🌐 Network: ${hre.network.name}`)

        // Check if this is a secp256r1 network and use appropriate deployment method
        const networkConfig = hre.config.networks[hre.network.name] as {
            curve?: string
            secp256r1Accounts?: Array<{ privateKey: string }>
        }
        let address: string

        if (networkConfig.curve === 'secp256r1') {
            console.log('   🔧 Using secp256r1-compatible deployment method...')
            const { deployIsbeFactorySecp256r1 } = await import(
                '../../scripts/businessLogic/deployIsbeFactorySecp256r1'
            )
            address = await deployIsbeFactorySecp256r1(
                hre,
                accountAddress,
                '0x'
            )
        } else {
            console.log('   🔧 Using standard Hardhat deployment method...')
            address = await deployIsbeFactory(hre, accountAddress, '0x')
        }

        console.log('✅ ISBE Factory deployed at:', address)
    }
)
