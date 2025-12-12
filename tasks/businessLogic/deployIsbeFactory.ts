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
            const { deployIsbeFactorySecp256r1 } =
                await import('../../scripts/businessLogic/deployIsbeFactorySecp256r1')
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
