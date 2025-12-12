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
